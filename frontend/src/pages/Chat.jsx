import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism/index.js";
import { chatAPI, authAPI } from "../services/api";

const INITIAL_MESSAGE = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: "Hello! I'm your AI assistant. How can I help you today?",
};
const SYSTEM_PROMPT = "You are a helpful, concise AI assistant.";

// ── Icons ──────────────────────────────────────────────────────────────────
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
function UserIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
function CopyIcon() {
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
      <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 10h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      width={13}
      height={13}
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

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ role }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        width: 28,
        height: 28,
        minWidth: 28,
        minHeight: 28,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg,rgba(52,211,153,.2),rgba(20,184,166,.15))"
          : "linear-gradient(135deg,rgba(167,139,250,.2),rgba(99,102,241,.15))",
        border: isUser
          ? "1px solid rgba(52,211,153,.25)"
          : "1px solid rgba(167,139,250,.25)",
        color: isUser ? "#6ee7b7" : "#c4b5fd",
      }}
    >
      {isUser ? <UserIcon size={12} /> : <SparkleIcon size={12} />}
    </div>
  );
}

// ── Markdown ───────────────────────────────────────────────────────────────
function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { children, className } = props;
          const match = /language-(\w+)/.exec(className || "");
          if (match)
            return (
              <SyntaxHighlighter
                language={match[1]}
                style={oneDark}
                customStyle={{
                  borderRadius: 10,
                  margin: "10px 0",
                  padding: 14,
                  fontSize: 12.5,
                  background: "rgba(0,0,0,.5)",
                  border: "1px solid rgba(255,255,255,.08)",
                  overflowX: "auto",
                  textAlign: "left",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          return (
            <code
              style={{
                background: "rgba(255,255,255,.08)",
                color: "#f9a8d4",
                padding: "2px 6px",
                borderRadius: 5,
                fontSize: 12.5,
                fontFamily: "'JetBrains Mono',monospace",
                wordBreak: "break-all",
              }}
            >
              {children}
            </code>
          );
        },
        p({ children }) {
          return (
            <p
              style={{
                margin: "0 0 10px",
                lineHeight: 1.75,
                color: "rgba(255,255,255,.88)",
                wordBreak: "break-word",
                textAlign: "left", // ← fix: explicit left alignment
              }}
            >
              {children}
            </p>
          );
        },
        ul({ children }) {
          return (
            <ul
              style={{
                paddingLeft: 20,
                margin: "0 0 10px",
                listStyleType: "disc",
                textAlign: "left",
              }}
            >
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol
              style={{
                paddingLeft: 20,
                margin: "0 0 10px",
                listStyleType: "decimal",
                textAlign: "left",
              }}
            >
              {children}
            </ol>
          );
        },
        li({ children }) {
          return (
            <li
              style={{
                marginBottom: 4,
                color: "rgba(255,255,255,.82)",
                textAlign: "left",
              }}
            >
              {children}
            </li>
          );
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#a78bfa",
                textDecoration: "underline",
                wordBreak: "break-all",
              }}
            >
              {children}
            </a>
          );
        },
        h1({ children }) {
          return (
            <h1
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                margin: "0 0 10px",
                color: "white",
                textAlign: "left",
              }}
            >
              {children}
            </h1>
          );
        },
        h2({ children }) {
          return (
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 600,
                margin: "0 0 8px",
                color: "white",
                textAlign: "left",
              }}
            >
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3
              style={{
                fontSize: ".95rem",
                fontWeight: 600,
                margin: "0 0 6px",
                color: "rgba(255,255,255,.9)",
                textAlign: "left",
              }}
            >
              {children}
            </h3>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote
              style={{
                borderLeft: "3px solid rgba(167,139,250,.4)",
                paddingLeft: 14,
                fontStyle: "italic",
                color: "rgba(255,255,255,.55)",
                margin: "10px 0",
                textAlign: "left",
              }}
            >
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div style={{ overflowX: "auto", margin: "10px 0" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontSize: 12.5,
                  textAlign: "left",
                }}
              >
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                padding: "6px 10px",
                background: "rgba(255,255,255,.05)",
                color: "rgba(255,255,255,.8)",
                textAlign: "left",
              }}
            >
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td
              style={{
                border: "1px solid rgba(255,255,255,.08)",
                padding: "6px 10px",
                color: "rgba(255,255,255,.72)",
                textAlign: "left",
              }}
            >
              {children}
            </td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Message ────────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
      }}
    >
      <Avatar role={msg.role} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          maxWidth: "72%",
          minWidth: 0,
        }}
      >
        {/* Bubble */}
        <div
          style={{
            position: "relative",
            padding: "10px 14px",
            borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
            fontSize: 14,
            lineHeight: 1.65,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            textAlign: "left", // ← fix: always left-align bubble content
            ...(isUser
              ? {
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  color: "#f0fdf4",
                  boxShadow: "0 4px 20px rgba(16,185,129,.2)",
                }
              : {
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "rgba(255,255,255,.9)",
                }),
          }}
          className="msg-bubble-group"
        >
          {isUser ? (
            <p style={{ margin: 0, whiteSpace: "pre-wrap", textAlign: "left" }}>
              {msg.content}
            </p>
          ) : (
            <MarkdownRenderer content={msg.content} />
          )}
          <button onClick={copy} className="copy-btn" title="Copy">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>

        {msg.tokens_used && (
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,.2)",
              marginTop: 3,
              paddingInline: 2,
            }}
          >
            {msg.tokens_used} tokens
          </span>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Avatar role="assistant" />
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "4px 18px 18px 18px",
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.1)",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Suggested prompts ──────────────────────────────────────────────────────
function SuggestedPrompts({ onSelect }) {
  const prompts = [
    { label: "Explain React hooks", icon: "⚛" },
    { label: "Write a Python API", icon: "🐍" },
    { label: "Generate SQL queries", icon: "🗄" },
    { label: "Summarize this text", icon: "✦" },
  ];
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,.28)",
          textAlign: "center",
          marginBottom: 12,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        Try asking
      </p>
      <div className="prompt-grid">
        {prompts.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className="prompt-btn"
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const hasMessages = useMemo(() => messages.length > 1, [messages]);

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };
  const resetH = () => {
    if (textareaRef.current) textareaRef.current.style.height = "22px";
  };

  const handleSend = async (forced = null) => {
    const text = (forced || input).trim();
    if (!text || loading) return;
    const userMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    resetH();
    abortRef.current = new AbortController();
    const history = next
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));
    try {
      // Pass the abort signal so Stop button can cancel the request
      const res = await chatAPI.send(
        text,
        history,
        SYSTEM_PROMPT,
        abortRef.current.signal,
      );
      const { response, tokens_used } = res.data;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          tokens_used,
        },
      ]);
    } catch (err) {
      if (err.name === "CanceledError") return;
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };
  const clear = () => {
    setMessages([INITIAL_MESSAGE]);
    setError("");
    localStorage.removeItem("chat_messages");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const onInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  return (
    <div className="chat-root">
      <div className="bg-glow" />
      <div className="bg-grid" />

      {/* Header */}
      <header className="chat-header">
        <div className="hdr-brand">
          <div className="brand-icon-wrap">
            <SparkleIcon size={13} />
          </div>
          <div>
            <div className="brand-name">AI Chat</div>
            <div className="brand-sub">gemini-2.5-flash-lite</div>
          </div>
        </div>

        <div className="hdr-status">
          <span className="status-dot" />
          <span className="status-txt">Online</span>
        </div>

        <div className="hdr-actions">
          <Link to="/rag" className="hdr-btn ghost">
            <span className="btn-icon-only">
              <svg
                width={13}
                height={13}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
            <span className="btn-lbl">RAG Q&A</span>
          </Link>
          <button onClick={clear} className="hdr-btn ghost" title="Clear">
            <span className="btn-icon-only">
              <TrashIcon />
            </span>
            <span className="btn-lbl">Clear</span>
          </button>
          <button
            onClick={handleLogout}
            className="hdr-btn danger"
            title="Sign out"
          >
            <span className="btn-icon-only">
              <LogoutIcon />
            </span>
            <span className="btn-lbl">Sign out</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="msgs-scroll">
        <div className="msgs-inner">
          {!hasMessages && (
            <>
              <div className="welcome">
                <div className="welcome-icon">
                  <SparkleIcon size={22} />
                </div>
                <h2 className="welcome-h">How can I help today?</h2>
                <p className="welcome-p">
                  Ask me anything — code, writing, analysis, and more.
                </p>
              </div>
              <SuggestedPrompts onSelect={handleSend} />
            </>
          )}

          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          {error && <div className="err-banner">{error}</div>}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="input-bar">
        <div className="input-wrap">
          <div
            className="input-box"
            onFocusCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(124,58,237,.5)")
            }
            onBlurCapture={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,.09)")
            }
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onInput={onInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              placeholder="Message AI…"
              className="msg-input"
            />
            {loading ? (
              <button onClick={stop} className="send-btn stop-btn">
                <StopIcon />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className={`send-btn ${input.trim() ? "send-active" : "send-idle"}`}
              >
                <SendIcon />
              </button>
            )}
          </div>
          <p className="disclaimer">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      <style>{`
        /* ── Global resets (scoped via chat-root or global) ── */
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        #root {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-root {
          width: 100%; height: 100vh; height: 100dvh;
          overflow: hidden; background: #08090d; color: white;
          display: flex; flex-direction: column;
          font-family: 'Sora','DM Sans',ui-sans-serif;
          position: relative; font-size: 14px;
        }
        .bg-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 70% 45% at 15% 0%,rgba(124,58,237,.1) 0%,transparent 60%),
                      radial-gradient(ellipse 55% 40% at 90% 100%,rgba(16,185,129,.08) 0%,transparent 55%);
        }
        .bg-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
          background-size: 48px 48px; opacity: .4;
        }

        /* Header */
        .chat-header {
          position: relative; z-index: 10; flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,.07);
          background: rgba(8,9,13,.9); backdrop-filter: blur(20px);
          padding: 0 20px; height: 52px;
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
        }
        .hdr-brand { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
        .brand-icon-wrap {
          width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg,rgba(124,58,237,.3),rgba(99,102,241,.2));
          border: 1px solid rgba(124,58,237,.3);
          display: flex; align-items: center; justify-content: center; color: #a78bfa;
        }
        .brand-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.92); line-height: 1.2; }
        .brand-sub { font-size: 10.5px; color: rgba(255,255,255,.3); line-height: 1.2; }
        .hdr-status {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 5px;
          padding: 4px 11px; border-radius: 20px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
          pointer-events: none;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,.6); }
        .status-txt { font-size: 11px; color: rgba(255,255,255,.45); font-weight: 500; }
        .hdr-actions { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .hdr-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 500; padding: 5px 12px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,.08); background: transparent;
          cursor: pointer; text-decoration: none; transition: all .15s; white-space: nowrap;
          font-family: inherit;
        }
        .hdr-btn.ghost { color: rgba(255,255,255,.45); }
        .hdr-btn.ghost:hover { color: rgba(255,255,255,.9); background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.15); }
        .hdr-btn.danger { color: rgba(252,165,165,.8); border-color: rgba(239,68,68,.2); }
        .hdr-btn.danger:hover { color: #fca5a5; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.3); }
        .btn-icon-only { display: none; }
        .btn-lbl { display: inline; }

        /* Messages */
        .msgs-scroll {
          position: relative; z-index: 10; flex: 1; overflow-y: auto;
          padding: 24px 20px 12px;
          -webkit-overflow-scrolling: touch;
        }
        .msgs-inner {
          width: 100%; max-width: 860px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 18px;
        }

        /* Welcome */
        .welcome { text-align: center; padding: 36px 0 24px; }
        .welcome-icon {
          width: 46px; height: 46px; border-radius: 14px; margin: 0 auto 14px;
          background: linear-gradient(135deg,rgba(124,58,237,.25),rgba(99,102,241,.15));
          border: 1px solid rgba(124,58,237,.25);
          display: flex; align-items: center; justify-content: center; color: #a78bfa;
        }
        .welcome-h { font-size: 18px; font-weight: 600; color: rgba(255,255,255,.9); margin-bottom: 6px; }
        .welcome-p { font-size: 13px; color: rgba(255,255,255,.35); }

        /* Prompt grid */
        .prompt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .prompt-btn {
          text-align: left; padding: 12px 14px; border-radius: 14px;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
          color: rgba(255,255,255,.72); font-size: 13px; cursor: pointer;
          transition: all .15s; display: flex; align-items: center; gap: 9px;
          font-family: inherit;
        }
        .prompt-btn:hover { background: rgba(255,255,255,.06); border-color: rgba(167,139,250,.2); color: rgba(255,255,255,.92); }
        .prompt-btn:active { transform: scale(.98); }

        /* Bubble copy btn */
        .copy-btn {
          position: absolute; top: 8px; right: 8px;
          opacity: 0; transition: opacity .15s;
          color: rgba(255,255,255,.3); background: transparent;
          border: none; cursor: pointer; padding: 3px; border-radius: 5px; line-height: 1;
        }
        .msg-bubble-group:hover .copy-btn { opacity: 1; }
        @media (hover: none) { .copy-btn { opacity: .4; } }

        /* Typing */
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(167,139,250,.7); display: inline-block;
          animation: tdot 1.2s ease-in-out infinite;
        }
        @keyframes tdot {
          0%,80%,100% { transform: translateY(0); opacity: .5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }

        /* Error */
        .err-banner {
          background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2);
          border-radius: 12px; padding: 11px 15px; font-size: 13px; color: #fca5a5;
        }

        /* Input */
        .input-bar {
          position: relative; z-index: 10; flex-shrink: 0;
          border-top: 1px solid rgba(255,255,255,.07);
          background: rgba(8,9,13,.94); backdrop-filter: blur(20px);
          padding: 12px 20px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
        .input-wrap { width: 100%; max-width: 860px; margin: 0 auto; }
        .input-box {
          display: flex; align-items: flex-end; gap: 10px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
          border-radius: 16px; padding: 10px 12px; transition: border-color .2s;
        }
        .msg-input {
          flex: 1; background: transparent; resize: none;
          font-size: 14px; color: rgba(255,255,255,.88); caret-color: #a78bfa;
          outline: none; border: none; line-height: 1.6;
          max-height: 150px; height: 22px; font-family: inherit;
          -webkit-appearance: none;
          text-align: left;
        }
        .msg-input::placeholder { color: rgba(255,255,255,.22); }
        .send-btn {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; transition: all .18s;
        }
        .send-active {
          background: linear-gradient(135deg,#7c3aed,#4f46e5);
          border: 1px solid rgba(124,58,237,.5) !important;
          color: white; box-shadow: 0 4px 16px rgba(124,58,237,.3);
        }
        .send-idle {
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.06) !important;
          color: rgba(255,255,255,.2); cursor: default;
        }
        .stop-btn {
          background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.3) !important;
          color: #f87171;
        }
        .disclaimer { font-size: 10.5px; color: rgba(255,255,255,.18); text-align: center; margin-top: 7px; }

        /* Scrollbar */
        .msgs-scroll::-webkit-scrollbar { width: 4px; }
        .msgs-scroll::-webkit-scrollbar-track { background: transparent; }
        .msgs-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hdr-status { display: none; }
          .chat-header { padding: 0 14px; }
          .brand-sub { display: none; }
          .msgs-scroll { padding: 18px 14px 10px; }
          .input-bar { padding: 10px 14px; padding-bottom: max(10px,env(safe-area-inset-bottom)); }
        }
        @media (max-width: 480px) {
          .chat-header { padding: 0 10px; height: 48px; }
          .hdr-btn { padding: 7px; border-radius: 9px; }
          .btn-lbl { display: none; }
          .btn-icon-only { display: flex; align-items: center; }
          .brand-icon-wrap { width: 26px; height: 26px; }
          .brand-name { font-size: 12.5px; }
          .msgs-scroll { padding: 14px 10px 8px; }
          .msgs-inner { gap: 14px; }
          .prompt-grid { grid-template-columns: 1fr; gap: 6px; }
          .input-bar { padding: 8px 10px; padding-bottom: max(10px,env(safe-area-inset-bottom)); }
          .input-box { padding: 8px 10px; border-radius: 14px; }
          .welcome { padding: 20px 0 16px; }
          .welcome-h { font-size: 16px; }
        }
        @media (min-width: 1200px) {
          .chat-header { padding: 0 28px; }
          .msgs-scroll { padding: 28px 28px 12px; }
          .input-bar { padding: 14px 28px 16px; }
        }
      `}</style>
    </div>
  );
}
