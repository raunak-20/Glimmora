import hashlib
import json

from core.cache import cache_get, cache_set, get_redis_client
from core.config import get_settings
from core.logging import get_logger
from typing import Optional

logger = get_logger(__name__)


def _cache_key(user_uid: str, question: str, top_k: int) -> str:
    """Generate a deterministic cache key from user + question + top_k."""
    raw = f"{user_uid}:{question.strip().lower()}:{top_k}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"rag:cache:{user_uid}:{digest}"


def get_cached_response(user_uid: str, question: str, top_k: int) -> Optional[dict]:
    """
    Try to retrieve a cached RAG response.
    Returns the cached dict if found, None otherwise.
    """
    key = _cache_key(user_uid, question, top_k)
    result = cache_get(key)
    if result is not None:
        logger.info("Cache HIT: %s", key)
    else:
        logger.info("Cache MISS: %s", key)
    return result


def set_cached_response(
    user_uid: str,
    question: str,
    top_k: int,
    response_data: dict,
) -> None:
    """Store a RAG response in cache with TTL."""
    key = _cache_key(user_uid, question, top_k)
    cache_set(key, response_data)
    logger.info("Cache SET: %s", key)


def invalidate_user_cache(user_uid: str) -> int:
    """Delete all cached queries for a user (e.g. after document changes)."""
    settings = get_settings()
    if not settings.cache_enabled:
        return 0

    client = get_redis_client()
    if client is None:
        return 0

    try:
        pattern = f"rag:cache:{user_uid}:*"
        keys = list(client.scan_iter(match=pattern, count=100))
        if keys:
            deleted = client.delete(*keys)
            logger.info("Invalidated %d cache keys for user %s", deleted, user_uid)
            return deleted
        return 0
    except Exception as exc:
        logger.warning("Cache invalidation error: %s", exc)
        return 0
