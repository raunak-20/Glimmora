"""
Environment-backed application settings.
Keep defaults local-friendly; override sensitive values in backend/.env.
"""

from functools import lru_cache
import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class Settings:
    app_name: str = os.getenv("APP_NAME", "AI SaaS API")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    database_url: str = os.getenv("DATABASE_URL", "")
    sql_echo: bool = os.getenv("SQL_ECHO", "false").lower() == "true"

    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]
    trusted_hosts: list[str] = [
        host.strip()
        for host in os.getenv("TRUSTED_HOSTS", "*").split(",")
        if host.strip()
    ]

    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str | None = os.getenv("GEMINI_MODEL")
    gemini_embedding_model: str = os.getenv(
        "GEMINI_EMBEDDING_MODEL",
        "gemini-embedding-001",
    )
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "20"))
    vector_store_dir: str = os.getenv("VECTOR_STORE_DIR", "./vector_stores")
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    top_k: int = int(os.getenv("TOP_K", "4"))

    redis_url: str = os.getenv("REDIS_URL", "")
    cache_enabled: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))

    rate_limit_enabled: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "120"))
    rate_limit_window_seconds: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

    secret_key: str = os.getenv(
        "SECRET_KEY",
        "CHANGE_ME_in_production_use_32+_random_bytes",
    )
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
