import re
import shutil
from io import BytesIO
from pathlib import Path

from PIL import Image

from app.core.config import settings
from app.services.ai_provider import generate_with_parts

SUPPORTED_TYPES = {
    ".pdf": ("application/pdf", b"%PDF"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
}
DATE_RE = re.compile(r"\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b")
LAB_RE = re.compile(r"^\s*([A-Za-z][A-Za-z0-9 /_()-]{2,45}?)\s*[:=]\s*([<>≤≥]?\s*\d+(?:\.\d+)?)\s*([A-Za-zµ/%]+(?:\s*/\s*[A-Za-z]+)?)?(?:\s*(?:\(\s*(?:ref(?:erence)?\s*)?[:=]?\s*([^)]*)\))?)?\s*$", re.I)


def extract_file_text(path: Path, extension: str) -> tuple[str, list[str]]:
    warnings: list[str] = []
    chunks: list[str] = []
    if extension == ".pdf":
        import pymupdf as fitz

        with fitz.open(path) as pdf:
            for index, page in enumerate(pdf):
                page_text = page.get_text("text").strip()
                if len(page_text) < 20:
                    page_text = _ocr_image(page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False), warnings)
                if page_text:
                    chunks.append(f"[Page {index + 1}]\n{page_text}")
    else:
        try:
            image = Image.open(path)
            chunks.append(_ocr_image(image, warnings))
        except Exception:
            warnings.append("The image could not be read by the OCR processor.")
    return "\n\n".join(part for part in chunks if part).strip(), warnings


def _ocr_image(source, warnings: list[str]) -> str:
    if settings.gemini_api_key:
        try:
            return _gemini_ocr(source)
        except (OSError, RuntimeError) as error:
            warning = f"Gemini OCR failed: {error} Local Tesseract OCR was attempted instead."
            if warning not in warnings:
                warnings.append(warning)

    if not shutil.which("tesseract"):
        warning = "Tesseract OCR is not installed. The original file is saved; enter or correct extracted details manually."
        if warning.strip() not in warnings:
            warnings.append(warning.strip())
        return ""
    try:
        import pytesseract

        if hasattr(source, "samples"):
            source = Image.frombytes("RGB", [source.width, source.height], source.samples)
        return pytesseract.image_to_string(source).strip()
    except Exception:
        warnings.append("OCR could not read text from this file. You can still enter details manually.")
        return ""


def _gemini_ocr(source) -> str:
    """Transcribe a PIL image or PyMuPDF pixmap using Gemini vision."""
    if hasattr(source, "samples"):
        source = Image.frombytes("RGB", [source.width, source.height], source.samples)
    buffer = BytesIO()
    import base64

    image = source.convert("RGB")
    image.thumbnail((3072, 3072), Image.Resampling.LANCZOS)
    image.save(buffer, format="JPEG", quality=92, optimize=True)

    return generate_with_parts(
        "Transcribe all visible text in this medical document image exactly. Preserve line breaks, labels, numbers, units, and reference ranges. Do not infer or correct unclear text; mark unreadable portions as [unclear]. Return only the transcription.",
        [
            {"text": "Transcribe the attached document image."},
            {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(buffer.getvalue()).decode("ascii")}},
        ],
    )


def structure_document(text: str, filename: str, requested_category: str | None = None) -> tuple[str, dict]:
    lower = f"{filename}\n{text}".lower()
    category = requested_category or _guess_category(lower)
    dates = list(dict.fromkeys(DATE_RE.findall(text)))
    labs = []
    for line in text.splitlines():
        match = LAB_RE.match(line.strip())
        if match:
            label, value, unit, reference = match.groups()
            labs.append({"name": label.strip(), "value": value.strip(), "unit": (unit or "").strip(),
                         "reference_range": (reference or "").strip(), "source_text": line.strip()})
    uncertain = ["patient_name", "doctor_or_facility", "medication_mentions"]
    if len(dates) != 1:
        uncertain.append("document_date")
    fields = {
        "document_date": dates[0] if len(dates) == 1 else None,
        "date_candidates": dates,
        "category": category,
        "patient_name": None,
        "laboratory_results": labs,
        "medication_mentions": [],
        "doctor_or_facility": None,
        "uncertain_fields": uncertain,
    }
    return category, fields


def _guess_category(text: str) -> str:
    if any(word in text for word in ("prescription", "rx", "dosage", "take one", "tablet")):
        return "prescription"
    if any(word in text for word in ("laboratory", "lab report", "reference range", "hemoglobin", "glucose", "test result")):
        return "laboratory_report"
    if any(word in text for word in ("discharge summary", "discharged", "admission", "hospital course")):
        return "discharge_summary"
    return "other"
