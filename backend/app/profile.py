from pathlib import Path

from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api import COOKIE_NAME, current_user, digest, hasher
from app.core.database import get_db
from app.core.config import settings
from app.documents import _storage_root
from app.models import Conversation, MedicalDocument, MedicalSummary, User, UserPreference, UserSession
from app.services.ai_provider import configured

router = APIRouter(prefix="/api/profile", tags=["profile and privacy"])


class PreferencesIn(BaseModel):
    dietary_preferences: list[str] = Field(default_factory=list, max_length=20)
    activity_preferences: list[str] = Field(default_factory=list, max_length=20)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=10, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)


@router.get("")
def get_profile(user: User = Depends(current_user), db: Session = Depends(get_db)):
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    return {
        "username": user.username,
        "created_at": user.created_at.isoformat(),
        "dietary_preferences": preference.dietary_preferences if preference else [],
        "activity_preferences": preference.activity_preferences if preference else [],
        "external_ai_processing": configured(),
        "privacy_notice": "Relevant record excerpts are sent to Google Gemini for records questions. Your message and saved preferences may be sent for wellness questions. Uploaded images and scanned pages may be sent to Gemini for transcription." if configured() else "No external AI provider is configured. The assistant uses local demo behavior.",
    }


@router.put("/preferences")
def save_preferences(fields: PreferencesIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    def clean(items: list[str]) -> list[str]:
        values = [value.strip()[:120] for value in items if value.strip()]
        return list(dict.fromkeys(values))
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    if preference is None:
        preference = UserPreference(user_id=user.id)
        db.add(preference)
    preference.dietary_preferences = clean(fields.dietary_preferences)
    preference.activity_preferences = clean(fields.activity_preferences)
    db.commit()
    return {"dietary_preferences": preference.dietary_preferences, "activity_preferences": preference.activity_preferences}


@router.post("/password", status_code=204)
def change_password(fields: PasswordChange, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        hasher.verify(user.password_hash, fields.current_password)
    except VerifyMismatchError:
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if fields.current_password == fields.new_password:
        raise HTTPException(status_code=422, detail="Choose a new password that is different from your current one.")
    user.password_hash = hasher.hash(fields.new_password)
    current_token = request.cookies.get(COOKIE_NAME)
    current_hash = digest(current_token) if current_token else ""
    for session in db.scalars(select(UserSession).where(UserSession.user_id == user.id)).all():
        if session.token_hash != current_hash:
            db.delete(session)
    db.commit()


@router.delete("/documents", status_code=204)
def delete_all_documents(user: User = Depends(current_user), db: Session = Depends(get_db)):
    documents = db.scalars(select(MedicalDocument).where(MedicalDocument.user_id == user.id)).all()
    for document in documents:
        Path(document.storage_path).unlink(missing_ok=True)
        db.delete(document)
    for summary in db.scalars(select(MedicalSummary).where(MedicalSummary.user_id == user.id)).all():
        db.delete(summary)
    for conversation in db.scalars(select(Conversation).where(Conversation.user_id == user.id, Conversation.agent == "records")).all():
        db.delete(conversation)
    db.commit()


@router.delete("", status_code=204)
def delete_account(response: Response, user: User = Depends(current_user), db: Session = Depends(get_db)):
    directory = _storage_root() / str(user.id)
    db.delete(user)
    db.commit()
    if directory.exists():
        for path in directory.iterdir():
            if path.is_file():
                path.unlink(missing_ok=True)
        directory.rmdir()
    response.delete_cookie(COOKIE_NAME, path="/", httponly=True, secure=settings.cookie_secure, samesite="lax")
