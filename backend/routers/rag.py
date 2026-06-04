"""
RAG router — document upload, ingestion, querying, and management.
"""
from typing import Optional
import os
import time
import tempfile
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import RAGDocument, User, RAGQueryHistory
from services.auth_service import get_current_user
from services.cache_service import (
    get_cached_response,
    set_cached_response,
    invalidate_user_cache,
)
from services.rag_service import (
    DocumentIngestionResult,
    RAGQueryRequest,
    RAGQueryResponse,
    delete_user_index,
    ingest_document,
    list_user_documents,
    query_documents,
)

router = APIRouter()


# Constants
ALLOWED_EXTENSIONS = {
    ".pdf", ".txt", ".md", ".markdown",
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".cpp", ".c", ".rs", ".rb",
    ".php", ".cs", ".swift", ".kt", ".scala", ".sql", ".yaml", ".yml", ".json",
    ".xml", ".html", ".css", ".lua", ".dart", ".groovy", ".r"
}
MAX_FILE_SIZE_MB = int(os.getenv("MAX_UPLOAD_MB", "20"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024



# Schemas
class DocumentRead(BaseModel):
    id: int
    filename: str
    chunk_count: int
    status: str
    language: Optional[str]
    error_message: Optional[str]

    model_config = {"from_attributes": True}


class RAGHistoryItem(BaseModel):
    id: int
    question: str
    answer: str
    source_documents: Optional[list[str]] = []
    source_languages: Optional[list[Optional[str]]] = []
    cache_hit: bool
    time_ms: Optional[float] = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}



# Endpoints


@router.post(
    "/documents",
    response_model=DocumentIngestionResult,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest a document into your personal vector store",
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ── Validate extension ────────────────────────────────────────────────
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{suffix}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    # ── Read & size-check ─────────────────────────────────────────────────
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {MAX_FILE_SIZE_MB} MB limit",
        )

    # ── Write to temp file for LangChain loaders ──────────────────────────
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = ingest_document(
            db=db,
            user=current_user,
            file_path=tmp_path,
            original_filename=file.filename or "unknown",
        )
    finally:
        os.unlink(tmp_path)   # always clean up temp file

    # Invalidate cache when new documents are added
    invalidate_user_cache(current_user.uid)

    return result


@router.get(
    "/history",
    response_model=list[RAGHistoryItem],
    summary="Get RAG query history for the current user",
)
def get_rag_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(RAGQueryHistory)
        .filter_by(user_id=current_user.id)
        .order_by(RAGQueryHistory.created_at.asc())
        .all()
    )
    return history


@router.delete(
    "/history",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete all RAG query history for the current user",
)
def delete_rag_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(RAGQueryHistory).filter_by(user_id=current_user.id).delete()
    db.commit()


@router.post(
    "/query",
    response_model=RAGQueryResponse,
    summary="Ask a question answered using your ingested documents",
)
def query_rag(
    request: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = time.perf_counter()

    # ── Check cache ──────────────────────────────────────────────────────
    cached = get_cached_response(current_user.uid, request.question, request.top_k)
    if cached is not None:
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        ans = RAGQueryResponse(
            answer=cached["answer"],
            source_documents=cached["source_documents"],
            source_languages=cached.get("source_languages", []),
            cache_hit=True,
            time_ms=elapsed_ms,
        )

        history_entry = RAGQueryHistory(
            user_id=current_user.id,
            question=request.question,
            answer=ans.answer,
            source_documents=ans.source_documents,
            source_languages=ans.source_languages,
            cache_hit=True,
            time_ms=elapsed_ms,
        )
        db.add(history_entry)
        db.commit()

        return ans

    # ── Cache miss — run full RAG pipeline ───────────────────────────────
    result = query_documents(current_user, request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    # Store in cache for next time
    set_cached_response(
        user_uid=current_user.uid,
        question=request.question,
        top_k=request.top_k,
        response_data={
            "answer": result.answer,
            "source_documents": result.source_documents,
            "source_languages": result.source_languages,
        },
    )

    result.cache_hit = False
    result.time_ms = elapsed_ms

    history_entry = RAGQueryHistory(
        user_id=current_user.id,
        question=request.question,
        answer=result.answer,
        source_documents=result.source_documents,
        source_languages=result.source_languages,
        cache_hit=False,
        time_ms=elapsed_ms,
    )
    db.add(history_entry)
    db.commit()

    return result


@router.get(
    "/documents",
    response_model=list[DocumentRead],
    summary="List all documents you have ingested",
)
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_documents(db, current_user)


@router.delete(
    "/documents",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete all your ingested documents and vector store",
)
def delete_all_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_user_index(db, current_user)
    # Invalidate all cached queries for this user
    invalidate_user_cache(current_user.uid)


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a single document record (does not rebuild FAISS index)",
)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(RAGDocument)
        .filter_by(id=document_id, user_id=current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    db.delete(doc)
    db.commit()
    # Invalidate cache since knowledge base changed
    invalidate_user_cache(current_user.uid)

