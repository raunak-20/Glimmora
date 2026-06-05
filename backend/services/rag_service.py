"""
RAG service — Gemini + FAISS + HuggingFace Embeddings
"""

import hashlib
import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import HTTPException, status
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.user import RAGDocument, User


# Config
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set")

LLM_MODEL = os.getenv("GEMINI_MODEL")

if not LLM_MODEL:
    raise RuntimeError("GEMINI_MODEL is not set")

VECTOR_STORE_DIR = Path(os.getenv("VECTOR_STORE_DIR", "./vector_stores"))

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")


CHUNK_SIZE = int(os.getenv("CHUNK_SIZE"))
if not CHUNK_SIZE:
    raise RuntimeError("CHUNK_SIZE is not set")

CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP"))
if not CHUNK_OVERLAP:
    raise RuntimeError("CHUNK_OVERLAP is not set")

TOP_K = int(os.getenv("TOP_K"))
if not TOP_K:
    raise RuntimeError("TOP_K is not set")

VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)

# Language detection map
LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".ts": "typescript",
    ".jsx": "jsx",
    ".tsx": "tsx",
    ".java": "java",
    ".go": "go",
    ".cpp": "cpp",
    ".c": "c",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".sql": "sql",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".json": "json",
    ".xml": "xml",
    ".html": "html",
    ".css": "css",
    ".lua": "lua",
    ".dart": "dart",
    ".groovy": "groovy",
    ".r": "r",
    ".pdf": "pdf",
    ".md": "markdown",
}


# Gemini setup

genai_configured = False

def _configure_genai_lazy():
    global genai_configured
    if not genai_configured:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        global gemini_model
        gemini_model = genai.GenerativeModel(LLM_MODEL)
        genai_configured = True

# Helper to run gemini content generation lazy
def ask_gemini(prompt: str) -> str:
    _configure_genai_lazy()
    response = gemini_model.generate_content(prompt)
    return response.text


# Embeddings


_embeddings: Optional[GoogleGenerativeAIEmbeddings] = None


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2",
            google_api_key=GEMINI_API_KEY
        )
    return _embeddings


def _get_file_language(filename: str) -> Optional[str]:
    ext = Path(filename).suffix.lower()
    return LANGUAGE_MAP.get(ext)


# Schemas


class RAGQueryRequest(BaseModel):
    question: str
    top_k: int = TOP_K


class RAGQueryResponse(BaseModel):
    answer: str
    source_documents: list[str]
    source_languages: list[Optional[str]] = []
    cache_hit: bool = False
    time_ms: float = 0.0


class DocumentIngestionResult(BaseModel):
    document_id: int
    filename: str
    chunk_count: int
    status: str



# Helpers


def _user_index_path(user_uid: str) -> Path:
    path = VECTOR_STORE_DIR / user_uid
    path.mkdir(parents=True, exist_ok=True)
    return path


def _load_or_create_vectorstore(user_uid: str) -> PineconeVectorStore:
    if not PINECONE_API_KEY or not PINECONE_INDEX_NAME:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pinecone credentials are not configured. Please set PINECONE_API_KEY and PINECONE_INDEX_NAME in the environment."
        )
    return PineconeVectorStore(
        index_name=PINECONE_INDEX_NAME,
        embedding=get_embeddings(),
        pinecone_api_key=PINECONE_API_KEY,
        namespace=user_uid
    )


def _file_sha256(path: str) -> str:

    h = hashlib.sha256()

    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)

    return h.hexdigest()


def _loader_for_file(file_path: str):

    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        from langchain_community.document_loaders import PyPDFLoader
        return PyPDFLoader(file_path)

    elif ext in {".md", ".markdown"}:
        from langchain_community.document_loaders import UnstructuredMarkdownLoader
        return UnstructuredMarkdownLoader(file_path)

    from langchain_community.document_loaders import TextLoader
    return TextLoader(file_path, encoding="utf-8")



# Ingestion



# Ingestion


def ingest_document(
    db: Session,
    user: User,
    file_path: str,
    original_filename: str,
) -> DocumentIngestionResult:

    file_hash = _file_sha256(file_path)
    language = _get_file_language(original_filename)

    doc_record = (
        db.query(RAGDocument)
        .filter_by(user_id=user.id, file_hash=file_hash)
        .first()
    )

    if doc_record is None:

        doc_record = RAGDocument(
            user_id=user.id,
            filename=original_filename,
            file_hash=file_hash,
            language=language,
            status="processing",
        )

        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

    try:

        loader = _loader_for_file(file_path)

        raw_docs = loader.load()

        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )

        chunks = splitter.split_documents(raw_docs)

        for chunk in chunks:
            chunk.metadata["source"] = original_filename
            if language:
                chunk.metadata["language"] = language

        vs = _load_or_create_vectorstore(user.uid)
        vs.add_documents(chunks)

        doc_record.chunk_count = len(chunks)
        doc_record.status = "ready"

        db.commit()

        return DocumentIngestionResult(
            document_id=doc_record.id,
            filename=original_filename,
            chunk_count=len(chunks),
            status="ready",
        )

    except Exception as exc:

        logger.exception("Ingestion failed: %s", exc)

        doc_record.status = "error"
        doc_record.error_message = str(exc)

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {exc}",
        )



# Query


def query_documents(
    user: User,
    request: RAGQueryRequest,
) -> RAGQueryResponse:

    from pinecone import Pinecone
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        stats = index.describe_index_stats()
        namespace_stats = stats.get("namespaces", {})
        if user.uid not in namespace_stats or namespace_stats[user.uid].get("vector_count", 0) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No documents uploaded yet.",
            )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        logger.warning(f"Could not fetch Pinecone stats: {exc}")

    vs = _load_or_create_vectorstore(user.uid)

    docs = vs.similarity_search(
        request.question,
        k=request.top_k,
    )

    context = "\n\n".join(
        [doc.page_content for doc in docs]
    )

    languages = list(
        {
            doc.metadata.get("language")
            for doc in docs
            if doc.metadata.get("language")
        }
    )

    prompt = f"""
Answer the user's question using ONLY the context below.

{f'Programming languages in context: {", ".join(languages)}' if languages else ''}

Context:
{context}

Question:
{request.question}
"""

    try:

        answer = ask_gemini(prompt)

    except Exception as exc:

        logger.exception("RAG query failed: %s", exc)

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini RAG query failed: {exc}",
        )

    sources = list(
        {
            doc.metadata.get("source", "unknown")
            for doc in docs
        }
    )

    source_languages = [
        doc.metadata.get("language")
        for doc in docs
    ]

    return RAGQueryResponse(
        answer=answer,
        source_documents=sources,
        source_languages=source_languages,
    )



# Management


def list_user_documents(
    db: Session,
    user: User,
) -> list[RAGDocument]:

    return (
        db.query(RAGDocument)
        .filter_by(user_id=user.id)
        .order_by(RAGDocument.created_at.desc())
        .all()
    )


def delete_user_index(
    db: Session,
    user: User,
):

    try:
        from pinecone import Pinecone
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        index.delete(delete_all=True, namespace=user.uid)
    except Exception as exc:
        logger.warning(f"Failed to delete Pinecone namespace {user.uid}: {exc}")

    db.query(RAGDocument).filter_by(user_id=user.id).delete()

    db.commit()
