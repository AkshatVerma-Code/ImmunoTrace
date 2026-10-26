from datetime import date, datetime
from typing import Any

from app.models import MedicalDocument


def _as_date(value: Any) -> date | None:
    if not isinstance(value, str) or not value.strip():
        return None
    for pattern in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y", "%d %B %Y", "%d %b %Y"):
        try:
            return datetime.strptime(value.strip(), pattern).date()
        except ValueError:
            pass
    return None


def build_summary(documents: list[MedicalDocument]) -> dict:
    entries = []
    missing = []
    for document in documents:
        data = document.extracted_data.structured_data if document.extracted_data else {}
        source = {"document_id": document.id, "name": document.original_filename}
        date_text = data.get("document_date")
        entry = {
            "source": source,
            "document_date": date_text,
            "category": document.category,
            "patient_name": data.get("patient_name"),
            "laboratory_results": data.get("laboratory_results", []),
            "medication_mentions": data.get("medication_mentions", []),
            "doctor_or_facility": data.get("doctor_or_facility"),
            "uploaded_at": document.created_at.isoformat() if document.created_at else None,
        }
        entries.append(entry)
        uncertain = list(data.get("uncertain_fields", []))
        if not date_text and "document_date" not in uncertain:
            uncertain.append("document_date")
        if len(data.get("date_candidates", [])) > 1:
            uncertain.append("multiple_date_candidates_need_review")
        if uncertain:
            missing.append({"source": source, "details": list(dict.fromkeys(uncertain)),
                            "date_candidates": data.get("date_candidates", [])})
    entries.sort(key=lambda item: (_as_date(item["document_date"]) is None,
                                   _as_date(item["document_date"]) or date.max,
                                   item["uploaded_at"] or ""))
    return {
        "overview": {"reviewed_documents": len(entries), "message": "This overview contains information you reviewed from your uploaded records." if entries else "No reviewed documents are available yet."},
        "timeline": [{"date": item["document_date"], "category": item["category"], "source": item["source"], "laboratory_results": item["laboratory_results"], "medication_mentions": item["medication_mentions"]} for item in entries],
        "documents": entries,
        "missing_or_uncertain": missing,
        "review_flags": _possible_duplicates(documents),
        "limitations": ["This summary includes only records marked as reviewed.", "Extraction may omit text or misread a field. Verify important details against the original document.", "A fact not shown here may still exist outside the documents you uploaded."],
    }


def _possible_duplicates(documents: list[MedicalDocument]) -> list[dict]:
    flags = []
    seen: dict[tuple[str, str], MedicalDocument] = {}
    for document in documents:
        text = " ".join(document.extracted_text.lower().split())
        if not text:
            continue
        key = (document.category, text)
        prior = seen.get(key)
        if prior:
            flags.append({"kind": "possible_duplicate", "sources": [
                {"document_id": prior.id, "name": prior.original_filename},
                {"document_id": document.id, "name": document.original_filename},
            ], "details": "These records have matching extracted text. Check whether they are duplicates."})
        else:
            seen[key] = document
    return flags
