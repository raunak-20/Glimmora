import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, ragAPI } from "../services/api";

function SparkleIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function LanguageBadge({ language }) {
  if (!language) return null;
  return (
    <span
      style={{
        display: "inline-block",
        flexShrink: 0,
        borderRadius: 6,
        border: "1px solid rgba(99,102,241,.3)",
        background: "rgba(99,102,241,.15)",
        padding: "2px 8px",
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: ".2em",
        textTransform: "uppercase",
        color: "#a5b4fc",
        marginLeft: 8,
      }}
    >
      {language}
    </span>
  );
}

function CodeIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function FilePill({ file }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.03)",
        padding: "10px 14px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "white",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file.filename}
        </p>
        <p
          style={{
            fontSize: 11.5,
            color: "rgba(255,255,255,.35)",
            marginTop: 2,
          }}
        >
          {file.status} · {file.chunk_count ?? 0} chunks
          {file.language && ` · ${file.language}`}
        </p>
      </div>
      {file.error_message ? (
        <span
          style={{
            flexShrink: 0,
            borderRadius: 100,
            border: "1px solid rgba(239,68,68,.2)",
            background: "rgba(239,68,68,.1)",
            padding: "3px 10px",
            fontSize: 10,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "#fca5a5",
          }}
        >
          error
        </span>
      ) : (
        <span
          style={{
            flexShrink: 0,
            borderRadius: 100,
            border: "1px solid rgba(52,211,153,.2)",
            background: "rgba(52,211,153,.1)",
            padding: "3px 10px",
            fontSize: 10,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "#6ee7b7",
          }}
        >
          ready
        </span>
      )}
    </div>
  );
}

export default function RAGQA() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [sourceLanguages, setSourceLanguages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
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
    loadDocuments();
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
      setSuccess(`Uploaded "${selectedFile.name}" successfully.`);
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
    setAnswer("");
    setSources([]);
    setSourceLanguages([]);
    try {
      const res = await ragAPI.query(q, topK);
      setAnswer(res.data?.answer || "No answer returned.");
      setSources(res.data?.source_documents || []);
      setSourceLanguages(res.data?.source_languages || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Query failed.");
    } finally {
      setAsking(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setSelectedFile(f);
  };

  return (
    <div className="rag-root">
      <div className="rag-glow" />
      <div className="rag-grid" />

      <div className="rag-layout">
        {/* ── Header ── */}
        <header className="rag-header">
          <div className="rag-hdr-left">
            <div className="rag-hdr-icon">
              <SparkleIcon size={13} />
            </div>
            <div>
              <p className="rag-hdr-kicker">Knowledge base</p>
              <h1 className="rag-hdr-title">RAG Q&A</h1>
            </div>
          </div>
          <p className="rag-hdr-desc">
            Upload code files, PDFs, or markdown documents, then ask questions
            about your codebase using AI-powered retrieval.
          </p>
          <div className="rag-hdr-actions">
            <Link to="/chat" className="rag-btn ghost">
              ← Back to chat
            </Link>
            <button onClick={handleLogout} className="rag-btn danger">
              Sign out
            </button>
          </div>
        </header>

        {/* ── Alerts ── */}
        {(error || success) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
          </div>
        )}

        {/* ── Features info ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(99,102,241,.2)",
              background: "rgba(99,102,241,.08)",
              padding: "12px 14px",
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                color: "#a5b4fc",
                fontWeight: 600,
              }}
            >
              <CodeIcon />
              Code-Aware
            </div>
            <p style={{ color: "rgba(255,255,255,.5)", lineHeight: 1.4 }}>
              Detects programming languages automatically
            </p>
          </div>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(34,211,238,.2)",
              background: "rgba(34,211,238,.08)",
              padding: "12px 14px",
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                color: "#06b6d4",
                fontWeight: 600,
              }}
            >
              ⚡
              Multi-Language
            </div>
            <p style={{ color: "rgba(255,255,255,.5)", lineHeight: 1.4 }}>
              Query across Python, JS, TS, Go, Rust & more
            </p>
          </div>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(124,58,237,.2)",
              background: "rgba(124,58,237,.08)",
              padding: "12px 14px",
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                color: "#c4b5fd",
                fontWeight: 600,
              }}
            >
              🧠
              AI-Powered
            </div>
            <p style={{ color: "rgba(255,255,255,.5)", lineHeight: 1.4 }}>
              Gemini LLM understands code context
            </p>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="rag-main">
          {/* Left sidebar */}
          <aside className="rag-sidebar">
            {/* Upload card */}
            <div className="rag-card">
              <div className="rag-card-hdr">
                <div>
                  <h2 className="rag-card-title">Upload document</h2>
                  <p className="rag-card-sub">
                    PDF, Markdown, code files, or plain text.
                  </p>
                </div>
                {uploading && (
                  <span className="badge badge-indigo">Uploading</span>
                )}
              </div>

              {/* Drop zone */}
              <label
                className={`drop-zone ${dragOver ? "drop-zone--over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,.py,.js,.ts,.jsx,.tsx,.java,.go,.cpp,.rs,.rb,.php,.cs,.swift,.kt,.sql,.yaml,.json,.xml,.html,.css,.lua,.dart,.groovy,.r"
                  style={{ display: "none" }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <UploadIcon />
                <span className="drop-zone-title">
                  {selectedFile ? selectedFile.name : "Choose or drop a file"}
                </span>
                <span className="drop-zone-sub">
                  Click to browse · PDF, Markdown, Code, TXT
                </span>
              </label>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="rag-submit-btn cyan-btn"
              >
                {uploading ? "Uploading…" : "Upload to knowledge base"}
              </button>
            </div>

            {/* Documents list */}
            <div className="rag-card">
              <div className="rag-card-hdr">
                <div>
                  <h2 className="rag-card-title">Uploaded documents</h2>
                  <p className="rag-card-sub">
                    Currently indexed for this account.
                  </p>
                </div>
                {loadingDocs && <div className="spinner" />}
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {documents.length === 0 && !loadingDocs ? (
                  <div className="empty-state">No documents uploaded yet.</div>
                ) : (
                  documents.map((doc) => <FilePill key={doc.id} file={doc} />)
                )}
              </div>

              {documents.length > 0 && (
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(255,255,255,.07)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: ".3em",
                      color: "rgba(255,255,255,.45)",
                      marginBottom: 12,
                    }}
                  >
                    Knowledge Base
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {(() => {
                      const langs = new Set(
                        documents
                          .filter((d) => d.language)
                          .map((d) => d.language)
                      );
                      const chunkTotal = documents.reduce(
                        (sum, d) => sum + (d.chunk_count || 0),
                        0
                      );
                      return (
                        <>
                          {Array.from(langs).map((lang) => (
                            <span
                              key={lang}
                              style={{
                                fontSize: 11,
                                borderRadius: 6,
                                border: "1px solid rgba(99,102,241,.3)",
                                background: "rgba(99,102,241,.15)",
                                padding: "4px 10px",
                                color: "#a5b4fc",
                                fontWeight: 500,
                                letterSpacing: ".2em",
                                textTransform: "uppercase",
                              }}
                            >
                              {lang}
                            </span>
                          ))}
                          <span
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,.4)",
                              marginLeft: "auto",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {chunkTotal} chunks
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right — Q&A */}
          <section className="rag-card rag-qa">
            <div className="rag-qa-hdr">
              <div>
                <h2 className="rag-card-title">Ask a question</h2>
                <p className="rag-card-sub">
                  Code-aware queries powered by Gemini AI using your knowledge base.
                </p>
              </div>
              <label className="topk-label">
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

            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div className="field">
                <label className="field-label">Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  placeholder="Ask anything about your code and documents…"
                  className="rag-textarea"
                />
              </div>

              <div>
                <button
                  onClick={handleQuery}
                  disabled={!canAsk}
                  className="rag-submit-btn violet-btn"
                >
                  {asking ? (
                    <>
                      <div className="spinner spinner-inline" />
                      Thinking…
                    </>
                  ) : (
                    "Ask question"
                  )}
                </button>
              </div>

              {/* Answer + Sources */}
              <div className="qa-results">
                <div className="qa-answer-wrap">
                  <div className="qa-section-hdr">
                    <span className="qa-section-title">Answer</span>
                    {asking && (
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "rgba(255,255,255,.35)",
                        }}
                      >
                        Generating…
                      </span>
                    )}
                  </div>
                  <div className="qa-answer-box">
                    {answer || (
                      <span style={{ color: "rgba(255,255,255,.3)" }}>
                        Your answer will appear here after you ask a question.
                      </span>
                    )}
                  </div>
                </div>

                <div className="qa-sources-wrap">
                  <div className="qa-section-hdr">
                    <span className="qa-section-title">Sources</span>
                    {sources.length > 0 && (
                      <span
                        style={{
                          fontSize: 10.5,
                          color: "rgba(255,255,255,.4)",
                        }}
                      >
                        {sources.length} result{sources.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {sources.length > 0 && (
                    <div
                      style={{
                        marginBottom: 12,
                        paddingBottom: 10,
                        borderBottom: "1px solid rgba(255,255,255,.07)",
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {(() => {
                        const langs = new Set(
                          sourceLanguages.filter((l) => l)
                        );
                        return Array.from(langs).map((lang) => (
                          <span
                            key={lang}
                            style={{
                              fontSize: 10,
                              borderRadius: 5,
                              border: "1px solid rgba(99,102,241,.3)",
                              background: "rgba(99,102,241,.15)",
                              padding: "2px 8px",
                              color: "#a5b4fc",
                              fontWeight: 500,
                              letterSpacing: ".15em",
                              textTransform: "uppercase",
                            }}
                          >
                            {lang}
                          </span>
                        ));
                      })()}
                    </div>
                  )}

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {sources.length === 0 ? (
                      <div className="empty-state">
                        Sources will appear here.
                      </div>
                    ) : (
                      sources.map((src, idx) => (
                        <div
                          key={src}
                          style={{
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,.08)",
                            background: "rgba(0,0,0,.3)",
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "rgba(255,255,255,.72)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <span>{src}</span>
                          {sourceLanguages[idx] && (
                            <LanguageBadge language={sourceLanguages[idx]} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rag-root {
          min-height: 100vh; min-height: 100dvh;
          background: #08090d; color: white;
          font-family: 'Sora','DM Sans',ui-sans-serif; font-size: 14px;
          position: relative;
        }
        .rag-glow {
          position: fixed; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 45% at 5% 0%,rgba(59,130,246,.1) 0%,transparent 55%),
                      radial-gradient(ellipse 50% 40% at 95% 100%,rgba(14,165,233,.08) 0%,transparent 55%);
        }
        .rag-grid {
          position: fixed; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
          background-size: 56px 56px; opacity: .35;
        }
        .rag-layout {
          position: relative; z-index: 1;
          max-width: 1280px; margin: 0 auto;
          padding: 28px 28px 40px;
          min-height: 100vh;
        }

        /* Header */
        .rag-header {
          display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
          border-radius: 20px; border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.03); backdrop-filter: blur(20px);
          padding: 18px 22px; margin-bottom: 24px;
        }
        .rag-hdr-left { display: flex; align-items: center; gap: 12px; }
        .rag-hdr-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg,rgba(124,58,237,.25),rgba(99,102,241,.15));
          border: 1px solid rgba(124,58,237,.25);
          display: flex; align-items: center; justify-content: center; color: #a78bfa;
        }
        .rag-hdr-kicker { font-size: 10.5px; letter-spacing: .35em; text-transform: uppercase; color: rgba(34,211,238,.7); margin-bottom: 3px; }
        .rag-hdr-title { font-size: 22px; font-weight: 600; color: white; line-height: 1; }
        .rag-hdr-desc { flex: 1; font-size: 13px; color: rgba(255,255,255,.45); line-height: 1.6; min-width: 180px; }
        .rag-hdr-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .rag-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12.5px; font-weight: 500; padding: 7px 14px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08); background: transparent;
          cursor: pointer; text-decoration: none; transition: all .15s; font-family: inherit;
        }
        .rag-btn.ghost { color: rgba(255,255,255,.55); }
        .rag-btn.ghost:hover { color: rgba(255,255,255,.9); background: rgba(255,255,255,.05); }
        .rag-btn.danger { color: rgba(252,165,165,.8); border-color: rgba(239,68,68,.2); }
        .rag-btn.danger:hover { color: #fca5a5; background: rgba(239,68,68,.08); }

        /* Alerts */
        .alert { border-radius: 14px; padding: 11px 15px; font-size: 13px; }
        .alert-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); color: #fca5a5; }
        .alert-success { background: rgba(52,211,153,.08); border: 1px solid rgba(52,211,153,.2); color: #6ee7b7; }

        /* Main grid */
        .rag-main {
          display: grid; grid-template-columns: 340px 1fr; gap: 20px;
          align-items: start;
        }
        .rag-sidebar { display: flex; flex-direction: column; gap: 16px; }

        /* Cards */
        .rag-card {
          border-radius: 20px; border: 1px solid rgba(255,255,255,.08);
          background: rgba(12,14,20,.92); padding: 22px;
          backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0,0,0,.3);
        }
        .rag-card-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
        .rag-card-title { font-size: 15px; font-weight: 600; color: white; margin-bottom: 4px; }
        .rag-card-sub { font-size: 12.5px; color: rgba(255,255,255,.38); line-height: 1.5; }

        /* Badge */
        .badge { flex-shrink: 0; border-radius: 100px; padding: 3px 10px; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; }
        .badge-indigo { border: 1px solid rgba(99,102,241,.25); background: rgba(99,102,241,.12); color: #a5b4fc; }

        /* Drop zone */
        .drop-zone {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          border-radius: 14px; border: 1.5px dashed rgba(255,255,255,.14);
          background: rgba(255,255,255,.02); padding: 28px 16px; cursor: pointer;
          text-align: center; transition: all .2s; margin-bottom: 14px;
          color: rgba(255,255,255,.4);
        }
        .drop-zone:hover, .drop-zone--over { border-color: rgba(34,211,238,.4); background: rgba(34,211,238,.04); color: rgba(255,255,255,.7); }
        .drop-zone-title { font-size: 13px; font-weight: 500; color: rgba(255,255,255,.8); }
        .drop-zone-sub { font-size: 11.5px; color: rgba(255,255,255,.3); }

        /* Submit buttons */
        .rag-submit-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px; border-radius: 14px; border: none;
          font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: filter .2s, opacity .2s;
        }
        .rag-submit-btn:disabled { cursor: not-allowed; opacity: .5; }
        .rag-submit-btn:not(:disabled):hover { filter: brightness(1.08); }
        .cyan-btn { background: linear-gradient(135deg,#06b6d4,#3b82f6); color: #f0f9ff; }
        .violet-btn { background: linear-gradient(135deg,#7c3aed,#6366f1); color: white; }

        /* Empty state */
        .empty-state {
          border-radius: 12px; border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.02); padding: 16px; font-size: 13px;
          color: rgba(255,255,255,.3); text-align: center;
        }

        /* Spinner */
        .spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,.15); border-top-color: #22d3ee;
          animation: spin .7s linear infinite; flex-shrink: 0;
        }
        .spinner-inline { display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Q&A section */
        .rag-qa { }
        .rag-qa-hdr {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
          flex-wrap: wrap; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.07);
          margin-bottom: 4px;
        }
        .topk-label { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,.5); flex-shrink: 0; }
        .topk-input {
          width: 68px; border-radius: 10px; border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04); padding: 8px 12px;
          font-size: 13px; color: white; outline: none; font-family: inherit;
          transition: border-color .2s;
        }
        .topk-input:focus { border-color: rgba(124,58,237,.4); }

        /* Fields */
        .field { display: flex; flex-direction: column; gap: 8px; }
        .field-label { font-size: 11px; font-weight: 500; letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.38); }
        .rag-textarea {
          width: 100%; resize: vertical; border-radius: 14px;
          border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04);
          padding: 12px 14px; font-size: 13.5px; color: white;
          placeholder-color: rgba(255,255,255,.25); outline: none;
          transition: border-color .2s; line-height: 1.6; font-family: inherit;
          min-height: 100px;
        }
        .rag-textarea::placeholder { color: rgba(255,255,255,.25); }
        .rag-textarea:focus { border-color: rgba(124,58,237,.4); background: rgba(255,255,255,.05); }

        /* Results */
        .qa-results { display: grid; grid-template-columns: 1fr 240px; gap: 14px; margin-top: 4px; }
        .qa-answer-wrap, .qa-sources-wrap {
          border-radius: 16px; border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.025); padding: 16px;
        }
        .qa-section-hdr { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
        .qa-section-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.85); }
        .qa-answer-box {
          min-height: 200px; border-radius: 12px; border: 1px solid rgba(255,255,255,.07);
          background: rgba(0,0,0,.3); padding: 14px 16px;
          font-size: 13.5px; line-height: 1.75; color: rgba(255,255,255,.82);
          white-space: pre-wrap; word-break: break-word;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .qa-results { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .rag-main { grid-template-columns: 1fr; }
          .rag-sidebar { flex-direction: row; flex-wrap: wrap; }
          .rag-sidebar > * { flex: 1; min-width: 280px; }
        }
        @media (max-width: 640px) {
          .rag-layout { padding: 16px 14px 32px; }
          .rag-header { padding: 14px 16px; gap: 10px; }
          .rag-hdr-desc { display: none; }
          .rag-hdr-title { font-size: 18px; }
          .rag-card { padding: 16px; }
          .rag-sidebar { flex-direction: column; }
        }
        @media (max-width: 420px) {
          .rag-hdr-kicker { display: none; }
          .rag-btn { padding: 6px 10px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
