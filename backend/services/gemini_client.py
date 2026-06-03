"""
Gemini client wrapper using the current Google Gen AI SDK.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
DEFAULT_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
DEFAULT_MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2048"))


@lru_cache(maxsize=1)
def get_gemini_client() -> genai.Client:
    return genai.Client(api_key=GEMINI_API_KEY)


def generate_gemini_content(
    prompt: str,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_output_tokens: Optional[int] = None,
):
    config = types.GenerateContentConfig(
        temperature=temperature if temperature is not None else DEFAULT_TEMPERATURE,
        max_output_tokens=(
            max_output_tokens
            if max_output_tokens is not None
            else DEFAULT_MAX_OUTPUT_TOKENS
        ),
    )

    return get_gemini_client().models.generate_content(
        model=model or DEFAULT_MODEL,
        contents=prompt,
        config=config,
    )
