from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.agents import conversational_agent, diet_agent, exercise_agent
from app.models import MedicalDocument, UserPreference
from app.services.ai_provider import configured

DIET_TERMS = {"diet", "meal", "food", "nutrition", "eat", "recipe", "vegetarian", "vegan"}
EXERCISE_TERMS = {"exercise", "workout", "movement", "walk", "fitness", "stretch", "activity"}


def route_agent(requested: str, message: str) -> str:
    words = set(message.lower().replace("?", " ").replace(",", " ").split())
    if requested == "records" and words & DIET_TERMS:
        return "diet"
    if requested == "records" and words & EXERCISE_TERMS:
        return "exercise"
    return requested


def handle(db: Session, user_id: int, requested_agent: str, message: str) -> tuple[str, str, list[dict]]:
    agent = route_agent(requested_agent, message)
    if agent == "records":
        documents = db.scalars(select(MedicalDocument).options(joinedload(MedicalDocument.extracted_data)).where(MedicalDocument.user_id == user_id).order_by(MedicalDocument.created_at.desc())).unique().all()
        if any(term in message.lower() for term in ("diagnose", "should i stop", "change my dose", "change dosage", "should i take", "treatment plan")):
            return ("I can help find what your uploaded documents say, but I can’t diagnose or advise on changing treatment or medication. Please discuss those decisions with a qualified health professional.", [], "demo")
        answer, citations, mode = conversational_agent.answer(message, documents)
        return answer, mode, citations
    preference = db.scalar(select(UserPreference).where(UserPreference.user_id == user_id))
    preferences = (preference.dietary_preferences if agent == "diet" else preference.activity_preferences) if preference else []
    if agent == "diet":
        answer, mode = diet_agent.respond(message, preferences)
        return answer, mode, []
    if agent == "exercise":
        answer, mode = exercise_agent.respond(message, preferences)
        return answer, mode, []
    raise ValueError("Choose the records, diet, or exercise assistant.")


def mode_label() -> str:
    return "provider" if configured() else "demo"
