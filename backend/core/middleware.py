"""
Request logging and response envelope middleware.
"""

import json
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from core.logging import get_logger, request_id_ctx
from core.responses import is_enveloped, success_response


logger = get_logger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        token = request_id_ctx.set(request_id)
        started = time.perf_counter()
        try:
            response = await call_next(request)
            elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.info(
                "%s %s completed with %s in %sms",
                request.method,
                request.url.path,
                response.status_code,
                elapsed_ms,
            )
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            request_id_ctx.reset(token)


class ResponseEnvelopeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if (
            response.status_code == 204
            or response.status_code >= 400
            or request.url.path in {"/docs", "/redoc", "/openapi.json"}
        ):
            return response

        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response

        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        payload = json.loads(body.decode() or "null")
        wrapped = payload if is_enveloped(payload) else success_response(payload)

        headers = dict(response.headers)
        headers.pop("content-length", None)

        return JSONResponse(
            content=wrapped,
            status_code=response.status_code,
            headers=headers,
        )
