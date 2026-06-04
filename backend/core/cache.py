"""
Small Redis cache abstraction with an in-memory fallback for local development.
"""

import json
import time
from typing import Any

from core.config import get_settings
from core.logging import get_logger


logger = get_logger(__name__)
_memory_cache: dict[str, tuple[float, Any]] = {}
_redis_client = None


def get_redis_client():
    global _redis_client
    settings = get_settings()
    if not settings.redis_url:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        import redis

        _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
        _redis_client.ping()
        return _redis_client
    except Exception as exc:
        logger.warning("Redis unavailable; using memory fallback: %s", exc)
        _redis_client = None
        return None


def cache_get(key: str) -> Any | None:
    settings = get_settings()
    if not settings.cache_enabled:
        return None
    client = get_redis_client()
    if client:
        raw = client.get(key)
        return json.loads(raw) if raw else None

    expires_at, value = _memory_cache.get(key, (0, None))
    if expires_at < time.time():
        _memory_cache.pop(key, None)
        return None
    return value


def cache_set(key: str, value: Any, ttl_seconds: int | None = None) -> None:
    settings = get_settings()
    if not settings.cache_enabled:
        return
    ttl = ttl_seconds or settings.cache_ttl_seconds
    client = get_redis_client()
    if client:
        client.setex(key, ttl, json.dumps(value, default=str))
        return
    _memory_cache[key] = (time.time() + ttl, value)
