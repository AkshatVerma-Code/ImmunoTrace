from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, joinedload

from app.api import current_user
from app.core.config import settings
from app.core.database import get_db
from app.agents.document_agent import prepare_review
from app.models import Conversation, ExtractedMedicalData, MedicalDocument, MedicalSummary, User
from app.services.document_processing import SUPPORTED_TYPES, extract_file_text

router = APIRouter(prefix="/api", tags=["medical documents"])
CATEGORIES = {"prescription", "laboratory_report", "discharge_summary", "other"}


def _storage_root() -> Path:
    root = Path(settings.storage_path)
    if not root.is_absolute():
        root = Path(__file__).resolve().parents[1] / root
    return root.resolve()


def _document_json(document: MedicalDocument) -> dict:
    extracted = document.extracted_data
    return {
        "id": document.id,
        "name": document.original_filename,
        "type": document.category,
        "status": document.status,
        "content_type": document.content_type,
        "uploaded_at": document.created_at.isoformat() if document.created_at else None,
        "extracted_text": document.extracted_text,
        "structured_data": extracted.structured_data if extracted else {},
        "reviewed": extracted.reviewed if extracted else False,
        "warnings": (extracted.structured_data.get("processing_warnings", []) if extracted else []),
    }


def _owned_document(db: Session, user: User, document_id: int) -> MedicalDocument:
    document = db.scalar(
        select(MedicalDocument).options(joinedload(MedicalDocument.extracted_data)).where(
            MedicalDocument.id == document_id, MedicalDocument.user_id == user.id
        )
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return document


@router.post("/documents", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    category: str | None = Form(default=None),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    supplied = (file.filename or "medical-document").replace("\\", "/")
    original_name = Path(supplied).name.strip()[:255] or "medical-document"
    extension = Path(original_name).suffix.lower()
    if extension not in SUPPORTED_TYPES:
        raise HTTPException(status_code=415, detail="Choose a PDF, JPG, or PNG document.")
    if category and category not in CATEGORIES:
        raise HTTPException(status_code=422, detail="Choose a supported medical document category.")
    payload = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(payload) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Files must be {settings.max_upload_mb} MB or smaller.")
    expected_type, magic = SUPPORTED_TYPES[extension]
    if not payload.startswith(magic):
        raise HTTPException(status_code=415, detail="The file contents do not match its file extension.")

    user_dir = _storage_root() / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)
    path = (user_dir / f"{uuid4().hex}{extension}").resolve()
    path.relative_to(user_dir.resolve())
    path.write_bytes(payload)

    document = MedicalDocument(user_id=user.id, original_filename=original_name,
                               storage_path=str(path), content_type=expected_type,
                               category=category or "other", status="uploaded")
    db.add(document)
    db.flush()
    document.status = "processing"
    warnings: list[str] = []
    try:
        text, warnings = extract_file_text(path, extension)
        document.extracted_text = text
        structured = prepare_review(text, original_name, category)
        inferred_category = structured["category"]
        document.category = inferred_category
        document.status = "needs_review"
    except Exception:
        text = ""
        structured = {
            "document_date": None, "date_candidates": [], "category": category or "other",
            "patient_name": None, "laboratory_results": [], "medication_mentions": [],
            "doctor_or_facility": None, "uncertain_fields": ["all_fields"],
        }
        warnings = ["Text extraction could not read this file. The original is saved so you can review it manually."]
        document.status = "needs_review"
    structured["processing_warnings"] = warnings
    db.add(ExtractedMedicalData(document=document, structured_data=structured, reviewed=False))
    db.commit()
    db.refresh(document)
    return _document_json(document)


@router.get("/documents")
def list_documents(
    q: str = Query(default="", max_length=120),
    category: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    sort: str = Query(default="newest", pattern="^(newest|oldest)$"),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    statement = select(MedicalDocument).options(joinedload(MedicalDocument.extracted_data)).where(MedicalDocument.user_id == user.id)
    if q.strip():
        statement = statement.where(MedicalDocument.original_filename.ilike(f"%{q.strip()}%"))
    if category in CATEGORIES:
        statement = statement.where(MedicalDocument.category == category)
    if status_filter:
        statement = statement.where(MedicalDocument.status == status_filter)
    statement = statement.order_by(MedicalDocument.created_at if sort == "oldest" else desc(MedicalDocument.created_at))
    return [_document_json(item) for item in db.scalars(statement).unique().all()]


@router.get("/documents/{document_id}")
def get_document(document_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _document_json(_owned_document(db, user, document_id))


@router.post("/documents/{document_id}/retry")
def retry_extraction(document_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    document = _owned_document(db, user, document_id)
    path = Path(document.storage_path).resolve()
    try:
        path.relative_to(_storage_root() / str(user.id))
    except ValueError:
        raise HTTPException(status_code=404, detail="Document not found.")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="The stored document is unavailable.")
    text, warnings = extract_file_text(path, path.suffix.lower())
    fields = prepare_review(text, document.original_filename, None if document.category == "other" else document.category)
    fields["processing_warnings"] = warnings
    document.extracted_text = text
    document.category = fields["category"]
    document.status = "needs_review"
    if document.extracted_data is None:
        document.extracted_data = ExtractedMedicalData(document=document)
    document.extracted_data.structured_data = fields
    document.extracted_data.reviewed = False
    db.commit()
    return _document_json(_owned_document(db, user, document_id))


@router.get("/documents/{document_id}/file")
def get_document_file(
    document_id: int,
    disposition: str = Query(default="inline", pattern="^(inline|attachment)$"),
    user: User = Depends(current_user), db: Session = Depends(get_db),
):
    document = _owned_document(db, user, document_id)
    path = Path(document.storage_path).resolve()
    try:
        path.relative_to(_storage_root() / str(user.id))
    except ValueError:
        raise HTTPException(status_code=404, detail="Document not found.")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="The stored document is unavailable.")
    return FileResponse(path, media_type=document.content_type,
                        filename=document.original_filename,
                        content_disposition_type=disposition)


@router.patch("/documents/{document_id}/review")
def review_document(document_id: int, fields: dict, user: User = Depends(current_user), db: Session = Depends(get_db)):
    document = _owned_document(db, user, document_id)
    if not isinstance(fields, dict) or len(str(fields)) > 100_000:
        raise HTTPException(status_code=422, detail="The reviewed information is too large.")
    category = fields.get("category", document.category)
    if category not in CATEGORIES:
        raise HTTPException(status_code=422, detail="Choose a supported medical document category.")
    extracted = document.extracted_data
    if extracted is None:
        extracted = ExtractedMedicalData(document=document, structured_data={})
        db.add(extracted)
    fields["category"] = category
    fields["processing_warnings"] = extracted.structured_data.get("processing_warnings", [])
    extracted.structured_data = fields
    extracted.reviewed = True
    document.category = category
    document.status = "reviewed"
    document.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _document_json(_owned_document(db, user, document_id))


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    document = _owned_document(db, user, document_id)
    path = Path(document.storage_path)
    for summary in db.scalars(select(MedicalSummary).where(MedicalSummary.user_id == user.id)).all():
        db.delete(summary)
    for conversation in db.scalars(select(Conversation).options(joinedload(Conversation.messages)).where(Conversation.user_id == user.id)).unique().all():
        if any(document_id == source.get("document_id") for message in conversation.messages for source in message.citations):
            db.delete(conversation)
    db.delete(document)
    db.commit()
    path.unlink(missing_ok=True)


@router.get("/dashboard")
def dashboard_stats(user: User = Depends(current_user), db: Session = Depends(get_db)):
    total = db.scalar(select(func.count()).select_from(MedicalDocument).where(MedicalDocument.user_id == user.id)) or 0
    reviewed = db.scalar(select(func.count()).select_from(MedicalDocument).where(MedicalDocument.user_id == user.id, MedicalDocument.status == "reviewed")) or 0
    pending = db.scalar(select(func.count()).select_from(MedicalDocument).where(MedicalDocument.user_id == user.id, MedicalDocument.status.in_(["uploaded", "processing", "needs_review"]))) or 0
    recent = db.scalars(select(MedicalDocument).where(MedicalDocument.user_id == user.id).order_by(desc(MedicalDocument.created_at)).limit(5)).all()
    latest = db.scalar(select(func.max(MedicalSummary.created_at)).where(MedicalSummary.user_id == user.id))
    return {"total_documents": total, "reviewed_documents": reviewed, "pending_review": pending,
            "latest_summary_update": latest.isoformat() if latest else None,
            "recent_documents": [_document_json(item) for item in recent]}
