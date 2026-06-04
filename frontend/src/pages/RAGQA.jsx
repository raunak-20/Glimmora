import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, ragAPI } from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function Diamond() {
  return <span className="d-diamond">◆</span>;
}

function UploadIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5-5 5 5" />
      <path d="M12 5v12" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function FileEntry({ file, deleting, onDelete }) {
  return (
    <div className="archive-entry">
      <div className="archive-entry-main">
        <p className="archive-filename">{file.filename}</p>
        <div className="archive-meta">
          <span>{file.status}</span>
          <span>·</span>
          <span>{file.chunk_count || 0} chunks</span>
          {file.language && (
            <>
              <span>·</span>
              <span>{file.language}</span>
            </>
          )}
        </div>
      </div>
      {file.error_message ? (
        <span className="archive-badge archive-badge--err">error</span>
      ) : (
        <button
          className="archive-delete"
          disabled={deleting}
          onClick={() => onDelete(file)}
        >
          {deleting ? "Deleting" : "Delete"}
        </button>
      )}
    </div>
  );
}

export default function RAGQA() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [queriesHistory, setQueriesHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [topK, setTopK] = useState(4);
  const [dragOver, setDragOver] = useState(false);

  const canAsk = useMemo(
    () => question.trim().length > 0 && !asking,
    [question, asking],
  );

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await ragAPI.listDocuments();
      setDocuments(res.data || []);
    } catch (err) {
      if (err.response?.status !== 404)
        setError(err.response?.data?.detail || "Failed to load documents.");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    async function init() {
      setLoadingDocs(true);
      try {
        const res = await ragAPI.listDocuments();
        setDocuments(res.data || []);
      } catch (err) {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.detail || "Failed to load documents.");
        }
      } finally {
        setLoadingDocs(false);
      }

      try {
        const historyRes = await ragAPI.getHistory();
        setQueriesHistory(historyRes.data || []);
      } catch (err) {
        console.error("Failed to load RAG history:", err);
      }
    }

    init();
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      await ragAPI.upload(selectedFile);
      setSuccess(`Uploaded "${selectedFile.name}"`);
      setSelectedFile(null);
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setError("");
    setSuccess("");
    try {
      const res = await ragAPI.query(q, topK);
      const newEntry = {
        id: res.data.id || Date.now(),
        question: q,
        answer: res.data.answer || "No answer returned.",
        source_documents: res.data.source_documents || [],
        source_languages: res.data.source_languages || [],
        cache_hit: res.data.cache_hit ?? false,
        time_ms: res.data.time_ms ?? 0,
      };
      setQueriesHistory((prev) => [...prev, newEntry]);
      setQuestion("");
    } catch (err) {
      setError(err.response?.data?.detail || "Query failed.");
    } finally {
      setAsking(false);
    }
  };

  const handleClearQueryHistory = async () => {
    const ok = window.confirm("Are you sure you want to clear your RAG query history?");
    if (!ok) return;
    setError("");
    setSuccess("");
    try {
      await ragAPI.clearHistory();
      setQueriesHistory([]);
      setSuccess("Cleared RAG query history.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to clear RAG history.");
    }
  };

  const handleDeleteAll = async () => {
    if (!documents.length || deletingId) return;
    const ok = window.confirm("Are you sure you want to clear the entire knowledge base?");
    if (!ok) return;
    setDeletingId("all");
    setError("");
    try {
      await ragAPI.deleteAll();
      await loadDocuments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to clear knowledge base");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (doc) => {
    if (!doc || deletingId) return;
    const ok = window.confirm(`Delete "${doc.filename}"?`);
    if (!ok) return;
    setDeletingId(doc.id);
    setError("");
    setSuccess("");
    try {
      await ragAPI.deleteDocument(doc.id);
      setSuccess(`Deleted "${doc.filename}"`);
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setSelectedFile(f);
  };

  const kbLangs = [
    ...new Set(documents.filter((d) => d.language).map((d) => d.language)),
  ];
  const kbChunks = documents.reduce((s, d) => s + (d.chunk_count || 0), 0);

  return (
    <div className="rag-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }

        .rag-root {
          min-height: 100vh; min-height: 100dvh;
          background: #13110d;
          color: #ede3cc;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          position: relative;
          overflow-x: hidden;
        }

        .rag-root::before {
          content: "";
          position: fixed; inset: 0; pointer-events: none;
          opacity: .03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 220px 220px;
        }

        .rag-layout {
          position: relative; z-index: 2;
          max-width: 1320px; margin: 0 auto;
          padding: 28px 32px 60px;
        }

        /* ── Header ── */
        .rag-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 24px;
          padding-bottom: 28px; margin-bottom: 34px;
          border-bottom: 1px solid rgba(210,140,40,.2);
        }
        .rag-header-left { max-width: 680px; }
        .rag-kicker {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
          color: rgba(210,140,40,.7);
          margin-bottom: 14px;
        }
        .rag-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-style: italic; font-weight: 400;
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1.08; color: #f0e6ce;
          margin-bottom: 12px;
        }
        .rag-sub {
          font-size: 14px; line-height: 1.8;
          color: rgba(237,227,204,.6);
          max-width: 560px;
        }
        .rag-header-nav {
          display: flex; gap: 6px; flex-shrink: 0;
          align-items: flex-start; padding-top: 4px;
        }
        .nav-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 400;
          color: rgba(237,227,204,.6);
          padding: 5px 10px; border-radius: 5px;
          border: 1px solid rgba(210,140,40,.2);
          background: transparent;
          cursor: pointer; text-decoration: none;
          transition: all .15s;
          font-family: 'Outfit', sans-serif; letter-spacing: .01em;
        }
        .nav-btn:hover {
          color: rgba(237,227,204,.95);
          background: rgba(210,140,40,.1);
          border-color: rgba(210,140,40,.35);
        }
        .nav-btn--danger { color: rgba(220,120,90,.7); border-color: rgba(220,120,90,.2); }
        .nav-btn--danger:hover {
          color: rgba(230,140,110,.95);
          background: rgba(200,80,60,.1);
          border-color: rgba(200,80,60,.3);
        }

        /* ── Alerts ── */
        .rag-alert {
          padding: 12px 16px; margin-bottom: 16px;
          border-left: 2px solid rgba(210,140,40,.5);
          background: rgba(210,140,40,.08);
          color: rgba(237,227,204,.9);
          font-size: 13px; font-family: 'JetBrains Mono', monospace; letter-spacing: .02em;
        }
        .rag-alert--err {
          border-left-color: rgba(210,90,70,.6);
          background: rgba(200,80,60,.08);
          color: rgba(230,140,110,.9);
        }

        /* ── Main grid ── */
        .rag-main {
          display: grid; grid-template-columns: 300px 1fr;
          gap: 44px; align-items: start;
        }
        .rag-sidebar {
          position: sticky; top: 24px;
          display: flex; flex-direction: column; gap: 38px;
        }

        .section-title {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
          color: rgba(210,140,40,.75);
        }
        .d-diamond { color: rgba(210,140,40,.85); font-size: 8px; }

        /* ── Upload zone ── */
        .upload-zone {
          border: 1px dashed rgba(210,140,40,.3);
          background: rgba(210,140,40,.04);
          padding: 26px 16px; border-radius: 4px;
          text-align: center; cursor: pointer;
          transition: all .18s;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: rgba(210,140,40,.75);
        }
        .upload-zone:hover, .upload-zone--over {
          border-color: rgba(210,140,40,.6);
          background: rgba(210,140,40,.08);
          color: rgba(210,140,40,.95);
        }
        .upload-zone-name { font-size: 13px; color: rgba(237,227,204,.9); line-height: 1.5; }
        .upload-zone-types {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(210,140,40,.5);
        }
        .upload-btn {
          width: 100%; margin-top: 12px;
          border: 1px solid rgba(210,140,40,.28);
          background: rgba(210,140,40,.09);
          color: rgba(237,227,204,.92);
          padding: 10px 12px; border-radius: 4px;
          cursor: pointer; font-size: 12px;
          font-family: 'Outfit', sans-serif; letter-spacing: .03em;
          transition: all .15s;
        }
        .upload-btn:hover:not(:disabled) {
          background: rgba(210,140,40,.16);
          border-color: rgba(210,140,40,.45);
          color: #f0e6ce;
        }
        .upload-btn:disabled { opacity: .35; cursor: not-allowed; }

        /* ── Archive entries ── */
        .archive-list { display: flex; flex-direction: column; gap: 14px; }
        .archive-entry {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 10px;
          padding-left: 14px;
          border-left: 1px solid rgba(210,140,40,.3);
        }
        .archive-filename {
          font-size: 13px; color: #ede3cc;
          line-height: 1.5; margin-bottom: 5px; word-break: break-word;
        }
        .archive-meta {
          display: flex; flex-wrap: wrap; gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
          color: rgba(210,140,40,.6);
        }
        .archive-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
          flex-shrink: 0; padding: 2px 7px; border-radius: 2px;
        }
        .archive-badge--err { color: rgba(220,120,90,.85); border: 1px solid rgba(200,80,60,.3); }
        .archive-delete {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
          flex-shrink: 0; padding: 2px 7px; border-radius: 2px;
          color: rgba(220,120,90,.85); border: 1px solid rgba(200,80,60,.3);
          background: transparent; cursor: pointer;
          transition: all .15s;
        }
        .archive-delete:hover:not(:disabled) {
          background: rgba(200,80,60,.25);
          border-color: rgba(200,80,60,.55);
          color: rgba(230,140,110,1);
        }
        .clear-kb-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 3px;
          color: rgba(220,120,90,.85); border: 1px solid rgba(200,80,60,.3);
          background: transparent; cursor: pointer;
          transition: all .15s;
        }
        .clear-kb-btn:hover:not(:disabled) {
          background: rgba(200,80,60,.25);
          border-color: rgba(200,80,60,.55);
          color: rgba(230,140,110,1);
        }
        .clear-kb-btn:disabled {
          opacity: 0.3; cursor: not-allowed;
        }
        .archive-delete:disabled { opacity: .35; cursor: not-allowed; }

        .kb-stats {
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid rgba(210,140,40,.12);
        }
        .kb-stats-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
          color: rgba(210,140,40,.6); margin-bottom: 12px;
        }
        .kb-stats-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .kb-lang {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(210,140,40,.8);
          border: 1px solid rgba(210,140,40,.28); padding: 2px 8px; border-radius: 2px;
        }
        .kb-chunks {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; color: rgba(210,140,40,.5);
          margin-left: auto; letter-spacing: .05em;
        }

        /* ── Console ── */
        .rag-console { min-width: 0; }
        .console-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 20px; padding-bottom: 18px; margin-bottom: 24px;
          border-bottom: 1px solid rgba(210,140,40,.14);
        }
        .console-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 28px; font-style: italic; font-weight: 400;
          color: #f0e6ce; margin-bottom: 8px;
        }
        .console-desc { font-size: 13px; line-height: 1.7; color: rgba(237,227,204,.6); }
        .topk-group {
          display: flex; align-items: center; gap: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(210,140,40,.65); flex-shrink: 0;
        }
        .topk-input {
          width: 58px; background: transparent; border: none;
          border-bottom: 1px solid rgba(210,140,40,.3);
          color: #ede3cc; padding: 5px 2px; outline: none;
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          caret-color: rgba(210,140,40,.8);
        }

        .question-wrap { margin-bottom: 16px; }
        .question-textarea {
          width: 100%; resize: vertical; min-height: 110px;
          background: transparent; border: none;
          border-bottom: 1px solid rgba(210,140,40,.25);
          color: #ede3cc; outline: none;
          font-size: 15px; line-height: 1.9;
          font-family: 'Outfit', sans-serif; font-weight: 300;
          padding: 0 0 12px;
          caret-color: rgba(210,140,40,.8);
          transition: border-color .2s;
        }
        .question-textarea:focus { border-bottom-color: rgba(210,140,40,.6); }
        .question-textarea::placeholder { color: rgba(210,140,40,.35); font-style: italic; }

        .ask-btn {
          border: 1px solid rgba(210,140,40,.28);
          background: rgba(210,140,40,.09);
          color: rgba(237,227,204,.92);
          padding: 10px 18px; border-radius: 4px;
          cursor: pointer; transition: all .15s;
          font-size: 12px; font-family: 'Outfit', sans-serif; letter-spacing: .03em;
        }
        .ask-btn:hover:not(:disabled) {
          background: rgba(210,140,40,.16);
          border-color: rgba(210,140,40,.5);
          color: #f0e6ce;
        }
        .ask-btn:disabled { opacity: .35; cursor: not-allowed; }

        /* ── Response ── */
        .response-grid {
          display: grid; grid-template-columns: 1fr 220px;
          gap: 38px; align-items: start;
          margin-top: 32px; padding-top: 28px;
          border-top: 1px solid rgba(210,140,40,.12);
        }
        .answer-thread-row { display: flex; gap: 0; animation: fadeSlideIn .3s ease; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .answer-marker {
          width: 28px; flex-shrink: 0;
          display: flex; flex-direction: column; align-items: center; padding-top: 2px;
        }
        .answer-thread-line {
          width: 1px; flex: 1; margin-top: 6px;
          background: linear-gradient(to bottom, rgba(210,140,40,.3), transparent);
          min-height: 80px;
        }

        /* ── Cache indicator ── */
        .cache-indicator {
          display: flex; align-items: center; gap: 12px;
          margin-top: 14px; padding-top: 10px;
          border-top: 1px solid rgba(210,140,40,.09);
        }
        .cache-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 3px;
          font-weight: 600;
        }
        .cache-badge--hit {
          color: rgba(80,200,120,.95); border: 1px solid rgba(80,200,120,.35);
          background: rgba(80,200,120,.08);
        }
        .cache-badge--miss {
          color: rgba(210,140,40,.85); border: 1px solid rgba(210,140,40,.3);
          background: rgba(210,140,40,.08);
        }
        .cache-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: rgba(210,140,40,.55);
          letter-spacing: .04em;
        }
        .answer-body {
          flex: 1; min-width: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; line-height: 1.65;
          color: #ede3cc;
          white-space: pre-wrap; word-break: break-word; padding-left: 8px;
        }
        .answer-placeholder { color: rgba(237,227,204,.38); font-style: italic; }
        .d-diamond--pulse { animation: dpulse 1.5s ease-in-out infinite; }
        @keyframes dpulse {
          0%,100% { opacity: .7; }
          50% { opacity: 1; color: rgba(210,140,40,1); }
        }

        /* ── Sources ── */
        .sources-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
          color: rgba(210,140,40,.7); margin-bottom: 18px;
        }
        .sources-list { display: flex; flex-direction: column; gap: 14px; }
        .source-entry { padding-left: 12px; border-left: 1px solid rgba(210,140,40,.25); }
        .source-index {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: rgba(210,140,40,.55); margin-bottom: 4px;
        }
        .source-name { font-size: 13px; color: rgba(237,227,204,.85); line-height: 1.6; word-break: break-word; }
        .source-lang {
          margin-top: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(210,140,40,.55);
        }
        .sources-empty {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: .06em;
          color: rgba(210,140,40,.4);
        }
        .source-langs-row {
          display: flex; flex-wrap: wrap; gap: 6px;
          margin-bottom: 14px; padding-bottom: 12px;
          border-bottom: 1px solid rgba(210,140,40,.1);
        }
        .source-lang-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(210,140,40,.8);
          border: 1px solid rgba(210,140,40,.28); padding: 2px 8px; border-radius: 2px;
        }

        @media (max-width: 1000px) { .response-grid { grid-template-columns: 1fr; gap: 28px; } }
        @media (max-width: 820px) { .rag-main { grid-template-columns: 1fr; gap: 36px; } .rag-sidebar { position: static; } }
        @media (max-width: 640px) {
          .rag-layout { padding: 18px 16px 40px; }
          .rag-header { flex-direction: column; align-items: flex-start; }
          .rag-header-nav { width: 100%; }
          .nav-btn { flex: 1; justify-content: center; }
          .rag-title { font-size: 36px; }
          .console-header { flex-direction: column; align-items: flex-start; gap: 14px; }
        }
      `}</style>

      <div className="rag-layout">
        <header className="rag-header">
          <div className="rag-header-left">
            <p className="rag-kicker">Retrieval archive · operational memory</p>
            <h1 className="rag-title">Research & retrieval console</h1>
            <p className="rag-sub">
              Upload source material, index technical documents, and interrogate
              your knowledge archive through retrieval-augmented generation.
            </p>
          </div>
          <nav className="rag-header-nav">
            <Link to="/chat" className="nav-btn">
              ← Chat
            </Link>
            <ThemeToggle />
            <button className="nav-btn nav-btn--danger" onClick={handleLogout}>
              <IconLogout /> Sign out
            </button>
          </nav>
        </header>

        {error && <div className="rag-alert rag-alert--err">{error}</div>}
        {success && <div className="rag-alert">{success}</div>}

        <div className="rag-main">
          <aside className="rag-sidebar">
            <section>
              <div className="section-title">
                <Diamond /> Archive intake
              </div>
              <label
                className={`upload-zone ${dragOver ? "upload-zone--over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <input
                  type="file"
                  style={{ display: "none" }}
                  accept=".pdf,.txt,.md,.markdown,.py,.js,.ts,.jsx,.tsx,.java,.go,.cpp,.rs,.rb,.php,.cs,.swift,.kt,.sql,.yaml,.json,.xml,.html,.css,.lua,.dart,.groovy,.r"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <UploadIcon />
                <span className="upload-zone-name">
                  {selectedFile ? selectedFile.name : "Drop document or browse"}
                </span>
                <span className="upload-zone-types">
                  PDF · Markdown · Source · Text
                </span>
              </label>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="upload-btn"
              >
                {uploading ? "Uploading..." : "Index into archive"}
              </button>
            </section>

            <section>
              <div className="section-title">
                <Diamond /> Indexed dossiers
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                  {loadingDocs && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "rgba(210,140,40,.55)",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: ".08em",
                      }}
                    >
                      Loading...
                    </span>
                  )}
                  <button
                    onClick={handleDeleteAll}
                    className="clear-kb-btn"
                    disabled={documents.length === 0 || deletingId}
                  >
                    {deletingId === "all" ? "Clearing..." : "Clear All"}
                  </button>
                </div>
              </div>
              <div className="archive-list">
                {documents.length === 0 && !loadingDocs ? (
                  <div className="archive-meta">No indexed documents.</div>
                ) : (
                  documents.map((doc) => (
                    <FileEntry
                      key={doc.id}
                      file={doc}
                      deleting={deletingId === doc.id}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
              {kbLangs.length > 0 && (
                <div className="kb-stats">
                  <div className="kb-stats-title">Knowledge base</div>
                  <div className="kb-stats-row">
                    {kbLangs.map((lang) => (
                      <span key={lang} className="kb-lang">
                        {lang}
                      </span>
                    ))}
                    <span className="kb-chunks">{kbChunks} chunks</span>
                  </div>
                </div>
              )}
            </section>
          </aside>

          <section className="rag-console">
            <div className="console-header">
              <div>
                <h2 className="console-title">Ask the archive</h2>
                <p className="console-desc">
                  Query indexed knowledge sources using semantic retrieval and
                  AI synthesis.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={handleClearQueryHistory}
                  disabled={queriesHistory.length === 0}
                  className="clear-kb-btn"
                >
                  Clear History
                </button>
                <label className="topk-group">
                  Top K
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value) || 4)}
                    className="topk-input"
                  />
                </label>
              </div>
            </div>

            <div className="question-wrap">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What does the authentication pipeline do? How are embeddings generated? Explain the ingestion flow..."
                className="question-textarea"
              />
              <button
                onClick={handleQuery}
                disabled={!canAsk}
                className="ask-btn"
              >
                {asking ? "Generating response..." : "Query archive"}
              </button>
            </div>

            {queriesHistory.length === 0 && !asking ? (
              <div className="response-grid">
                <div className="answer-thread-row">
                  <div className="answer-marker">
                    <span className="d-diamond">◆</span>
                    <div className="answer-thread-line" />
                  </div>
                  <div className="answer-body">
                    <span className="answer-placeholder">
                      No query history yet. The archive response will appear here.
                    </span>
                  </div>
                </div>
                <aside>
                  <div className="sources-label">Source citations</div>
                  <div className="sources-empty">No citations yet.</div>
                </aside>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginTop: "24px" }}>
                {queriesHistory.map((item, idx) => (
                  <div key={item.id || idx} className="response-grid" style={{ marginTop: 0, paddingTop: "20px", borderTop: idx > 0 ? "1px solid rgba(210,140,40,.12)" : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ fontStyle: "italic", color: "rgba(210,140,40,.85)", fontSize: "14px", fontFamily: "'JetBrains Mono', monospace" }}>
                        Q: {item.question}
                      </div>
                      <div className="answer-thread-row">
                        <div className="answer-marker">
                          <span className="d-diamond">◆</span>
                          <div className="answer-thread-line" />
                        </div>
                        <div className="answer-body">
                          {item.answer}
                          <div className="cache-indicator">
                            <span className={`cache-badge ${item.cache_hit ? 'cache-badge--hit' : 'cache-badge--miss'}`}>
                              {item.cache_hit ? '⚡ CACHE HIT' : '◆ CACHE MISS'}
                            </span>
                            {item.time_ms !== null && (
                              <span className="cache-time">{item.time_ms} ms</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside>
                      <div className="sources-label">Source citations</div>
                      {item.source_documents && item.source_documents.length > 0 ? (
                        <div className="sources-list">
                          {item.source_documents.map((src, srcIdx) => (
                            <div key={src + srcIdx} className="source-entry">
                              <div className="source-index">
                                [{String(srcIdx + 1).padStart(2, "0")}]
                              </div>
                              <div className="source-name">{src}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="sources-empty">No citations.</div>
                      )}
                    </aside>
                  </div>
                ))}

                {asking && (
                  <div className="response-grid" style={{ marginTop: 0, paddingTop: "20px", borderTop: "1px solid rgba(210,140,40,.12)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ fontStyle: "italic", color: "rgba(210,140,40,.85)", fontSize: "14px", fontFamily: "'JetBrains Mono', monospace" }}>
                        Q: {question}
                      </div>
                      <div className="answer-thread-row">
                        <div className="answer-marker">
                          <span className="d-diamond d-diamond--pulse">◆</span>
                          <div className="answer-thread-line" />
                        </div>
                        <div className="answer-body">
                          <span className="answer-placeholder">Retrieving knowledge and formulating response...</span>
                        </div>
                      </div>
                    </div>
                    <aside>
                      <div className="sources-label">Source citations</div>
                      <div className="sources-empty">Searching documents...</div>
                    </aside>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
