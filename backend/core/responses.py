"""
Standard API envelope helpers.
"""

from typing import Any


def success_response(data: Any = None, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "error": None,
        "meta": meta or {},
    }


def error_response(
    message: str,
    *,
    code: str = "error",
    details: Any = None,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "meta": meta or {},
    }


def is_enveloped(payload: Any) -> bool:
    return (
        isinstance(payload, dict)
        and {"success", "data", "error", "meta"}.issubset(payload.keys())
    )
