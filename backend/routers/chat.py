"""
Chat router — POST /chat
Accepts a message + history, calls Gemini, returns the reply.
"""

from typing import Any, Optional
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, ChatSession, ChatMessage
from services.auth_service import get_current_user
from services.gemini_client import generate_gemini_content

# Load environment variables
load_dotenv()

# Gemini setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")


# Router
router = APIRouter()


# Schemas
class HistoryMessage(BaseModel):
    role: str
    content: str

    model_config = {"from_attributes": True}


class ChatSessionResponse(BaseModel):
    uid: str
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str
    session_uid: Optional[str] = None
    system_prompt: str = "You are a helpful assistant."


class ChatResponse(BaseModel):
    response: str
    tokens_used: int
    session_uid: str


# Endpoints

@router.get(
    "/sessions",
    response_model=list[ChatSessionResponse],
    summary="Get all chat sessions for the current user",
)
def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(ChatSession)
        .filter_by(user_id=current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return sessions


@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    summary="Create a new chat session",
)
def create_chat_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_session = ChatSession(
        user_id=current_user.id,
        title="New Chat"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get(
    "/sessions/{session_uid}/messages",
    response_model=list[HistoryMessage],
    summary="Get all messages for a specific session",
)
def get_session_messages(
    session_uid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter_by(uid=session_uid, user_id=current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    messages = (
        db.query(ChatMessage)
        .filter_by(session_id=session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return messages


@router.delete(
    "/sessions/{session_uid}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a specific chat session",
)
def delete_chat_session(
    session_uid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter_by(uid=session_uid, user_id=current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    db.delete(session)
    db.commit()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Send a message to the AI with full conversation history",
)
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured on the server.",
        )

    # Resolve active session
    session = None
    if body.session_uid:
        session = (
            db.query(ChatSession)
            .filter_by(uid=body.session_uid, user_id=current_user.id)
            .first()
        )
    
    if not session:
        session = ChatSession(
            user_id=current_user.id,
            title="New Chat"
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Build prompt from historical messages stored in database
    past_messages = (
        db.query(ChatMessage)
        .filter_by(session_id=session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    prompt_parts = [
        f"System: {body.system_prompt}"
    ]

    for msg in past_messages:
        prompt_parts.append(f"{msg.role.capitalize()}: {msg.content}")

    prompt_parts.append(f"User: {body.message}")
    final_prompt = "\n".join(prompt_parts)

    try:
        response = generate_gemini_content(final_prompt, model=GEMINI_MODEL)
        reply = response.text
        tokens_used = 0
        
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            tokens_used = (
                response.usage_metadata.total_token_count or 0
            )

        # If first message, update session title
        if not past_messages:
            title_candidate = body.message.strip()
            if len(title_candidate) > 40:
                title_candidate = title_candidate[:40] + "..."
            session.title = title_candidate or "New Chat"
        
        # Save both messages to DB
        user_msg = ChatMessage(
            user_id=current_user.id,
            session_id=session.id,
            role="user",
            content=body.message,
            model=None,
            tokens_used=None
        )
        assistant_msg = ChatMessage(
            user_id=current_user.id,
            session_id=session.id,
            role="assistant",
            content=reply,
            model=GEMINI_MODEL,
            tokens_used=tokens_used
        )
        session.updated_at = datetime.now(timezone.utc)
        db.add(user_msg)
        db.add(assistant_msg)
        db.commit()

        return ChatResponse(
            response=reply,
            tokens_used=tokens_used,
            session_uid=session.uid,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {exc}",
        )
