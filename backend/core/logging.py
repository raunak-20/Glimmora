"""
Structured JSON logging with request id support.
"""

import json
import logging
from contextvars import ContextVar
from datetime import datetime, timezone

from core.config import get_settings


request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class JSONLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "request_id": request_id_ctx.get(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    import os
    settings = get_settings()
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(settings.log_level.upper())

    # Stream Handler (console)
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(JSONLogFormatter())
    root.addHandler(stream_handler)

    # File Handler (saved logs for frontend)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_dir = os.path.join(backend_dir, "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    file_handler = logging.FileHandler(os.path.join(log_dir, "app.log"), encoding="utf-8")
    file_handler.setFormatter(JSONLogFormatter())
    root.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
