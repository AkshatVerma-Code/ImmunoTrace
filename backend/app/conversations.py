from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.agents.orchestrator import handle
from app.api import current_user
from app.core.database import get_db
from app.models import ChatMessage, Conversation, User
from app.services.ai_provider import configured

router = APIRouter(prefix="/api/assistant", tags=["AI assistants"])
VALID_AGENTS = {"records", "diet", "exercise"}


@router.get("/status")
def assistant_status(user: User = Depends(current_user)):
    return {"mode": "provider" if configured() else "demo",
            "external_processing": configured(),
        "notice": "Relevant record excerpts are sent to Google Gemini for records questions. Your message and saved preferences may be sent for wellness questions." if configured() else "No external AI provider is configured. Replies use clearly labeled local demo behavior."}


class MessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


def _conversation_json(conversation: Conversation, include_messages: bool = False) -> dict:
    payload = {"id": conversation.id, "agent": conversation.agent, "title": conversation.title,
               "created_at": conversation.created_at.isoformat(), "updated_at": conversation.updated_at.isoformat()}
    if include_messages:
        payload["messages"] = [{"id": msg.id, "role": msg.role, "agent": msg.agent, "mode": msg.mode,
                                "content": msg.content, "citations": msg.citations, "created_at": msg.created_at.isoformat()}
                               for msg in conversation.messages]
    return payload


def _owned_conversation(db: Session, user: User, conversation_id: int) -> Conversation:
    conversation = db.execute(select(Conversation).options(joinedload(Conversation.messages)).where(
        Conversation.id == conversation_id, Conversation.user_id == user.id
    )).unique().scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conversation


@router.get("/{agent}/conversations")
def list_conversations(agent: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if agent not in VALID_AGENTS:
        raise HTTPException(status_code=404, detail="Assistant not found.")
    conversations = db.scalars(select(Conversation).where(Conversation.user_id == user.id, Conversation.agent == agent).order_by(desc(Conversation.updated_at))).all()
    return [_conversation_json(item) for item in conversations]


@router.post("/{agent}/conversations", status_code=201)
def create_conversation(agent: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if agent not in VALID_AGENTS:
        raise HTTPException(status_code=404, detail="Assistant not found.")
    conversation = Conversation(user_id=user.id, agent=agent, title=f"{agent.title()} conversation")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return _conversation_json(conversation, include_messages=True)


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _conversation_json(_owned_conversation(db, user, conversation_id), include_messages=True)


@router.post("/conversations/{conversation_id}/messages")
def send_message(conversation_id: int, message: MessageIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    conversation = _owned_conversation(db, user, conversation_id)
    content = message.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Write a message before sending.")
    if conversation.agent not in VALID_AGENTS:
        raise HTTPException(status_code=422, detail="Assistant not found.")
    user_message = ChatMessage(role="user", content=content, agent=conversation.agent, mode="user")
    conversation.messages.append(user_message)
    db.flush()
    try:
        answer, mode, citations = handle(db, user.id, conversation.agent, content)
    except RuntimeError:
        db.rollback()
        raise HTTPException(status_code=503, detail="The configured AI provider is unavailable. Please retry in a moment.")
    except ValueError as error:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(error))
    routed_agent = conversation.agent
    if conversation.agent == "records" and citations == []:
        # A request routed to a wellness agent has no record sources; label it in history.
        lowered = content.lower()
        if any(term in lowered for term in ("diet", "meal", "food", "nutrition", "eat", "recipe", "vegetarian", "vegan")):
            routed_agent = "diet"
        elif any(term in lowered for term in ("exercise", "workout", "movement", "walk", "fitness", "stretch", "activity")):
            routed_agent = "exercise"
    assistant_message = ChatMessage(role="assistant", content=answer, agent=routed_agent,
                                    mode=mode, citations=citations)
    conversation.messages.append(assistant_message)
    if conversation.title.endswith("conversation"):
        conversation.title = content[:60]
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assistant_message)
    return {"conversation": _conversation_json(_owned_conversation(db, user, conversation_id), include_messages=True),
            "reply": {"id": assistant_message.id, "agent": assistant_message.agent, "mode": mode,
                      "content": answer, "citations": citations, "created_at": assistant_message.created_at.isoformat()}}


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    conversation = _owned_conversation(db, user, conversation_id)
    db.delete(conversation)
    db.commit()
