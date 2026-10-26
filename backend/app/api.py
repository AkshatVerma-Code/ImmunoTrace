import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import User, UserSession
from app.schemas import AuthOut, Credentials, UserOut

router = APIRouter(prefix="/api/auth", tags=["authentication"])
hasher = PasswordHasher()
COOKIE_NAME = "immunotrace_session"
SESSION_DAYS = 7


def digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
        path="/",
    )


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in to continue.")
    session = db.scalar(select(UserSession).where(UserSession.token_hash == digest(token)))
    expires_at = session.expires_at if session else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not session or expires_at <= datetime.now(timezone.utc):
        if session:
            db.delete(session)
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in again.")
    return session.user


@router.post("/register", response_model=AuthOut, status_code=201)
def register(credentials: Credentials, response: Response, db: Session = Depends(get_db)):
    username = credentials.username.strip()
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(status_code=409, detail="That username is already taken.")
    user = User(username=username, password_hash=hasher.hash(credentials.password))
    db.add(user)
    db.flush()
    issue_session(db, user, response)
    db.commit()
    return AuthOut(user=UserOut(username=user.username))


@router.post("/login", response_model=AuthOut)
def login(credentials: Credentials, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == credentials.username.strip()))
    try:
        valid = user is not None and hasher.verify(user.password_hash, credentials.password)
    except VerifyMismatchError:
        valid = False
    if not valid:
        raise HTTPException(status_code=401, detail="Username or password is incorrect.")
    issue_session(db, user, response)
    db.commit()
    return AuthOut(user=UserOut(username=user.username))


def issue_session(db: Session, user: User, response: Response) -> None:
    token = secrets.token_urlsafe(32)
    db.add(UserSession(token_hash=digest(token), user_id=user.id,
                       expires_at=datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)))
    set_session_cookie(response, token)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        session = db.scalar(select(UserSession).where(UserSession.token_hash == digest(token)))
        if session:
            db.delete(session)
            db.commit()
    response.delete_cookie(COOKIE_NAME, path="/", httponly=True, secure=settings.cookie_secure, samesite="lax")


@router.get("/me", response_model=AuthOut)
def me(user: User = Depends(current_user)):
    return AuthOut(user=UserOut(username=user.username))
