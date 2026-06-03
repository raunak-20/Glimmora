"""
AI service — Gemini implementation.
Handles conversation history and responses.
"""

import os
from typing import AsyncIterator

from dotenv import load_dotenv
from fastapi import HTTPException, status
from pydantic import BaseModel

from services.gemini_client import generate_gemini_content


# Load environment variables
load_dotenv()


# Config
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
DEFAULT_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
DEFAULT_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
DEFAULT_MAX_TOKENS: int = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2048"))

# Schemas
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = DEFAULT_MODEL
    max_tokens: int = DEFAULT_MAX_TOKENS
    temperature: float = DEFAULT_TEMPERATURE
    stream: bool = False


class ChatResponse(BaseModel):
    content: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0



# Service
async def chat_completion(request: ChatRequest) -> ChatResponse:
    
    # Send chat request to Gemini.
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured",
        )

    try:
        # Combine all messages into a single prompt
        prompt = "\n".join(
            [f"{msg.role}: {msg.content}" for msg in request.messages]
        )

        response = generate_gemini_content(
            prompt,
            model=request.model,
            temperature=request.temperature,
            max_output_tokens=request.max_tokens,
        )

        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0

        if hasattr(response, "usage_metadata") and response.usage_metadata:
            usage = response.usage_metadata

            prompt_tokens = usage.prompt_token_count or 0
            completion_tokens = usage.candidates_token_count or 0
            total_tokens = usage.total_token_count or 0

        return ChatResponse(
            content=response.text,
            model=request.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error: {exc}",
        )



# Streaming (basic simulated streaming)
async def chat_completion_stream(
    request: ChatRequest,
) -> AsyncIterator[str]:

    response = await chat_completion(request)

    yield response.content



# System Prompt Builder
def build_system_prompt(extra: str = "") -> ChatMessage:
    base = (
        "You are a helpful, concise AI assistant. "
        "Always respond in the same language as the user. "
        "If you don't know something, say so honestly."
    )

    return ChatMessage(
        role="system",
        content=f"{base} {extra}".strip(),
    )
