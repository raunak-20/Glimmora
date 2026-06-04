"""
Fixed-window rate limiting backed by Redis when REDIS_URL is configured.
"""

import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from core.cache import get_redis_client
from core.config import get_settings
from core.responses import error_response


_memory_windows: dict[str, tuple[int, int]] = {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if not settings.rate_limit_enabled or request.url.path in {"/health", "/docs", "/redoc", "/openapi.json"}:
            return await call_next(request)

        identifier = request.client.host if request.client else "anonymous"
        window = int(time.time() // settings.rate_limit_window_seconds)
        key = f"rate:{identifier}:{window}"
        limit = settings.rate_limit_requests

        client = get_redis_client()
        if client:
            count = client.incr(key)
            if count == 1:
                client.expire(key, settings.rate_limit_window_seconds)
        else:
            count, stored_window = _memory_windows.get(identifier, (0, window))
            if stored_window != window:
                count = 0
                stored_window = window
            count += 1
            _memory_windows[identifier] = (count, stored_window)

        if count > limit:
            return JSONResponse(
                status_code=429,
                content=error_response(
                    "Too many requests. Please slow down and try again shortly.",
                    code="rate_limited",
                    meta={"limit": limit, "window_seconds": settings.rate_limit_window_seconds},
                ),
            )
        return await call_next(request)
