"""
AI SaaS FastAPI Application
Entry point — mounts all routers, configures middleware, lifespan events.
"""

from contextlib import asynccontextmanager
from database import engine
from models.user import Base

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from database import Base, engine
from routers import auth, chat, rag


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup (use Alembic migrations in production)."""
    Base.metadata.create_all(bind=engine)
    yield
    # Add any teardown logic here (close connection pools, etc.)


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

Base.metadata.create_all(bind=engine)

def create_app() -> FastAPI:
    app = FastAPI(
        title="AI SaaS API",
        description="Production-ready AI SaaS backend with auth, chat, and RAG.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],          # Restrict in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"],          # Restrict in production
    )

    # ── Routers ───────────────────────────────────────────────────────────
    app.include_router(auth.router,  prefix="/api/v1/auth",  tags=["Auth"])
    app.include_router(chat.router,  prefix="/api/v1/chat",  tags=["Chat"])
    app.include_router(rag.router,   prefix="/api/v1/rag",   tags=["RAG"])

    # ── Health-check ──────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health_check():
        return JSONResponse({"status": "ok", "version": app.version})

    return app


app = create_app()
