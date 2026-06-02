# AI SaaS — FastAPI Backend

Production-ready REST API with **JWT auth**, **OpenAI chat**, and **LangChain + FAISS RAG**.

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | SQLite → SQLAlchemy 2.x |
| Auth | JWT (HS256) · bcrypt |
| Chat | OpenAI Chat Completions |
| RAG | LangChain · OpenAI Embeddings · FAISS |

## Project Layout

```
.
├── main.py                   # App factory, middleware, lifespan
├── database.py               # Engine, session, Base, get_db()
├── models/
│   └── user.py               # User, ChatMessage, RAGDocument ORM models
├── services/
│   ├── auth_service.py       # JWT, bcrypt, user CRUD
│   ├── ai_service.py         # OpenAI wrapper (sync + stream)
│   └── rag_service.py        # LangChain ingestion + retrieval
├── routers/
│   ├── auth.py               # /api/v1/auth/*
│   ├── chat.py               # /api/v1/chat/*
│   └── rag.py                # /api/v1/rag/*
├── requirements.txt
└── .env.example
```

## Quick Start

```bash
# 1. Clone / copy files, then:
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY and OPENAI_API_KEY

# 3. Run
uvicorn main:app --reload
# Docs: http://localhost:8000/docs
```

## API Overview

### Auth  `/api/v1/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | OAuth2 password flow → token pair |
| POST | `/refresh` | Exchange refresh token |
| GET | `/me` | Current user profile |
| PATCH | `/me/password` | Change password |

### Chat  `/api/v1/chat`
| Method | Path | Description |
|---|---|---|
| POST | `/send` | Send message, receive AI reply |
| POST | `/send/stream` | SSE streaming reply |
| GET | `/history` | Conversation history |
| DELETE | `/history` | Clear history |

### RAG  `/api/v1/rag`
| Method | Path | Description |
|---|---|---|
| POST | `/documents` | Upload + ingest document (PDF/TXT/MD) |
| GET | `/documents` | List ingested documents |
| DELETE | `/documents` | Wipe all documents + vector store |
| DELETE | `/documents/{id}` | Delete single document record |
| POST | `/query` | RAG question answering |

## Production Checklist

- [ ] Replace SQLite with PostgreSQL (`DATABASE_URL=postgresql://...`)
- [ ] Set a strong `SECRET_KEY` (≥32 random bytes)
- [ ] Lock down `CORS` origins and `TrustedHostMiddleware`
- [ ] Run behind a reverse proxy (nginx / Caddy) with TLS
- [ ] Add Alembic for schema migrations
- [ ] Use Celery + Redis for background document ingestion
- [ ] Rate-limit endpoints (slowapi)
- [ ] Add structured logging (structlog / python-json-logger)
