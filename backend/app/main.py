from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.documents import router as documents_router
from app.summaries import router as summaries_router
from app.conversations import router as conversations_router
from app.profile import router as profile_router
from app.core.config import settings
from app.core.database import Base, engine
from app import models  # noqa: F401 - register SQLAlchemy models before schema creation

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)
app.include_router(router)
app.include_router(documents_router)
app.include_router(summaries_router)
app.include_router(conversations_router)
app.include_router(profile_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}
