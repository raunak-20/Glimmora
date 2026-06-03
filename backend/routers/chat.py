"""
Chat router — POST /chat
Accepts a message + history, calls Gemini, returns the reply.
"""

from typing import Any
import os

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
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


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []
    system_prompt: str = "You are a helpful assistant."


class ChatResponse(BaseModel):
    response: str
    tokens_used: int



# Endpoint
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

    # Build prompt
    prompt_parts = [
        f"System: {body.system_prompt}"
    ]

    for turn in body.history:
        if turn.role not in {"user", "assistant", "system"}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid role '{turn.role}' in history.",
            )

        prompt_parts.append(f"{turn.role.capitalize()}: {turn.content}")

    prompt_parts.append(f"User: {body.message}")

    final_prompt = "\n".join(prompt_parts)

    try:
        response = generate_gemini_content(final_prompt, model=GEMINI_MODEL)
        reply = response.text
        tokens_used = 0
        # Extract token usage safely
        
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            tokens_used = (
                response.usage_metadata.total_token_count or 0
            )
        return ChatResponse(
            response=reply,
            tokens_used=tokens_used,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {exc}",
        )
