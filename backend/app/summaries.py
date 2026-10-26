from datetime import datetime, timezone
from io import BytesIO

import pymupdf as fitz
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.agents.summary_agent import summarize
from app.api import current_user
from app.core.database import get_db
from app.models import MedicalDocument, MedicalSummary, User
from app.services.summary import build_summary

router = APIRouter(prefix="/api/summary", tags=["medical summary"])


def _latest(db: Session, user_id: int) -> MedicalSummary | None:
    return db.scalar(select(MedicalSummary).where(MedicalSummary.user_id == user_id).order_by(desc(MedicalSummary.created_at)).limit(1))


@router.get("")
def get_summary(user: User = Depends(current_user), db: Session = Depends(get_db)):
    summary = _latest(db, user.id)
    if not summary:
        return {"id": None, "content": None, "created_at": None}
    return {"id": summary.id, "content": summary.content, "created_at": summary.created_at.isoformat()}


@router.post("/regenerate")
def regenerate_summary(user: User = Depends(current_user), db: Session = Depends(get_db)):
    documents = db.scalars(
        select(MedicalDocument).options(joinedload(MedicalDocument.extracted_data)).where(
            MedicalDocument.user_id == user.id, MedicalDocument.status == "reviewed"
        )
    ).unique().all()
    content = summarize(documents)
    summary = MedicalSummary(user_id=user.id, content=content)
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return {"id": summary.id, "content": summary.content, "created_at": summary.created_at.isoformat()}


@router.get("/download")
def download_summary(user: User = Depends(current_user), db: Session = Depends(get_db)):
    summary = _latest(db, user.id)
    if not summary:
        raise HTTPException(status_code=404, detail="Generate a summary before downloading it.")
    content = summary.content
    pdf = fitz.open()
    page = pdf.new_page()
    page.insert_text((52, 52), "ImmunoTrace · Medical summary", fontsize=17, fontname="helv", color=(0.08, 0.38, 0.34))
    page.insert_text((52, 74), f"Generated {summary.created_at.strftime('%d %b %Y')}", fontsize=9, color=(0.4, 0.48, 0.47))
    y = 108
    lines = [content.get("overview", {}).get("message", ""), "", "CHRONOLOGICAL RECORDS"]
    for event in content.get("timeline", []):
        source = event.get("source", {})
        lines.append(f"{event.get('date') or 'Date not recorded'} · {event.get('category', 'document').replace('_', ' ')} · {source.get('name', '')}")
        for result in event.get("laboratory_results", []):
            rendered = " ".join(part for part in (result.get("name"), str(result.get("value", "")), result.get("unit"), f"(reference: {result.get('reference_range')})" if result.get("reference_range") else "") if part)
            lines.append(f"    {rendered} [Source document {source.get('document_id')}]")
        for medication in event.get("medication_mentions", []):
            lines.append(f"    Medication mention: {medication} [Source document {source.get('document_id')}]")
    lines.extend(["", "LIMITATIONS"])
    lines.extend(f"• {item}" for item in content.get("limitations", []))
    for line in lines:
        if y > 765:
            page = pdf.new_page()
            y = 52
        page.insert_textbox(fitz.Rect(52, y, 550, y + 32), line, fontsize=9, fontname="helv", color=(0.18, 0.28, 0.28))
        y += 21
    payload = pdf.tobytes()
    pdf.close()
    return StreamingResponse(BytesIO(payload), media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="immunotrace-summary.pdf"'})
