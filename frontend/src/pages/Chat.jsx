import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { chatAPI, authAPI } from "../services/api";

// ── Syntax theme — warm amber ──────────────────────────────────
const dispatchTheme = {
  'code[class*="language-"]': {
    color: "#d8ccb4",
    background: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    lineHeight: "1.75",
  },
  'pre[class*="language-"]': {
    color: "#d8ccb4",
    background: "rgba(0,0,0,.5)",
    padding: "14px 16px",
    borderRadius: "6px",
    overflow: "auto",
  },
  comment: { color: "rgba(210,140,40,.45)", fontStyle: "italic" },
  prolog: { color: "rgba(210,140,40,.45)" },
  doctype: { color: "rgba(210,140,40,.45)" },
  cdata: { color: "rgba(210,140,40,.45)" },
  punctuation: { color: "rgba(220,205,175,.5)" },
  property: { color: "#d4904a" },
  tag: { color: "#d4904a" },
  boolean: { color: "#d4904a" },
  number: { color: "#d4904a" },
  constant: { color: "#d4904a" },
  symbol: { color: "#d4904a" },
  deleted: { color: "#c06858" },
  selector: { color: "#9ab870" },
  "attr-name": { color: "#9ab870" },
  string: { color: "#9ab870" },
  char: { color: "#9ab870" },
  builtin: { color: "#9ab870" },
  inserted: { color: "#9ab870" },
  operator: { color: "rgba(220,205,175,.65)" },
  entity: { color: "#d4904a", cursor: "help" },
  url: { color: "#d4904a" },
  variable: { color: "#ede3cc" },
  atrule: { color: "#c87820", fontStyle: "italic" },
  "attr-value": { color: "#9ab870" },
  function: { color: "#ede3cc" },
  "class-name": { color: "#ede3cc" },
  keyword: { color: "#c87820", fontStyle: "italic" },
  regex: { color: "#9ab870" },
  important: { color: "#c87820", fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  namespace: { opacity: ".7" },
};

const INITIAL_MESSAGE = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: "Hello! I'm your AI assistant. How can I help you today?",
};
const SYSTEM_PROMPT = "You are a helpful, concise AI assistant.";

function IconSend() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconStop() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg
      width={11}
      height={11}
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
function IconTrash() {
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
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
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
function IconEdit() {
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
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

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
                style={dispatchTheme}
                customStyle={{
                  borderRadius: 6,
                  margin: "12px 0",
                  padding: "14px 16px",
                  fontSize: 12,
                  background: "rgba(0,0,0,.5)",
                  border: "1px solid rgba(210,140,40,.15)",
                  overflowX: "auto",
                  boxShadow: "none",
                }}
                codeTagProps={{
                  style: { fontFamily: "'JetBrains Mono', monospace" },
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          return (
            <code
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11.5px",
                color: "rgba(210,140,40,.95)",
                background: "transparent",
                borderBottom: "1px dashed rgba(210,140,40,.4)",
                paddingBottom: "1px",
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
                margin: "0 0 12px",
                lineHeight: 1.85,
                color: "#ede3cc",
                textAlign: "left",
              }}
            >
              {children}
            </p>
          );
        },
        ul({ children }) {
          return (
            <ul
              style={{ paddingLeft: 22, margin: "0 0 12px", textAlign: "left" }}
            >
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol
              style={{ paddingLeft: 22, margin: "0 0 12px", textAlign: "left" }}
            >
              {children}
            </ol>
          );
        },
        li({ children }) {
          return (
            <li
              style={{
                marginBottom: 5,
                color: "#ddd4bc",
                lineHeight: 1.75,
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
                color: "#d4904a",
                textDecoration: "underline",
                textUnderlineOffset: 3,
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
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                margin: "0 0 12px",
                color: "#f0e6ce",
                fontStyle: "italic",
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
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "1.25rem",
                fontWeight: 400,
                margin: "0 0 10px",
                color: "#e8dcca",
                fontStyle: "italic",
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
                fontSize: ".9rem",
                fontWeight: 600,
                margin: "0 0 8px",
                color: "#d8ccb4",
                textTransform: "uppercase",
                letterSpacing: ".08em",
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
                borderLeft: "2px solid rgba(210,140,40,.6)",
                paddingLeft: 16,
                fontStyle: "italic",
                color: "rgba(237,227,204,.65)",
                margin: "12px 0",
              }}
            >
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div style={{ overflowX: "auto", margin: "12px 0" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontSize: 13,
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
                border: "1px solid rgba(210,140,40,.2)",
                padding: "7px 12px",
                background: "rgba(210,140,40,.08)",
                color: "#d8ccb4",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: ".07em",
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
                padding: "7px 12px",
                color: "#ccc4b0",
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

function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  if (isUser)
    return (
      <div className="msg-user-row">
        <div className="msg-user-bubble">
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {msg.content}
          </p>
          <button onClick={copy} className="copy-btn-user" title="Copy">
            {copied ? <IconCheck /> : <IconCopy />}
          </button>
        </div>
      </div>
    );
  return (
    <div className="msg-ai-row">
      <div className="msg-ai-marker">
        <span className="ai-diamond">◆</span>
        <div className="ai-thread-line" />
      </div>
      <div className="msg-ai-body">
        <MarkdownRenderer content={msg.content} />
        <div className="msg-ai-footer">
          {msg.tokens_used && (
            <span className="token-count">{msg.tokens_used} tokens</span>
          )}
          <button onClick={copy} className="copy-btn-ai" title="Copy">
            {copied ? (
              <>
                <IconCheck /> <span>Copied</span>
              </>
            ) : (
              <>
                <IconCopy /> <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg-ai-row">
      <div className="msg-ai-marker">
        <span className="ai-diamond pulse-diamond">◆</span>
        <div className="ai-thread-line" />
      </div>
      <div className="msg-ai-body" style={{ paddingTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompts({ onSelect }) {
  const prompts = [
    { label: "Explain React hooks in depth", tag: "code" },
    { label: "Write a Python REST API", tag: "code" },
    { label: "Generate optimized SQL queries", tag: "data" },
    { label: "Summarize and analyze this text", tag: "writing" },
  ];
  return (
    <div className="prompts-section">
      <p className="prompts-eyebrow">— Try asking</p>
      <div className="prompts-list">
        {prompts.map(({ label, tag }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className="prompt-item"
          >
            <span className="prompt-tag">{tag}</span>
            <span className="prompt-label">{label}</span>
            <span className="prompt-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved messages: ", err);
      }
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
    if (textareaRef.current) textareaRef.current.style.height = "24px";
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
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
      <div className="noise-overlay" />

      <header className="hdr">
        <div className="hdr-left">
          <span className="hdr-wordmark">Dispatch</span>
          <span className="hdr-sep">·</span>
          <span className="hdr-model">gemini-2.5-flash-lite</span>
        </div>
        <div className="hdr-status-pill">
          <span className="status-ring" />
          online
        </div>
        <nav className="hdr-nav">
          <Link to="/rag" className="nav-btn">
            <IconEdit />
            <span>RAG</span>
          </Link>
          <button onClick={clear} className="nav-btn" title="Clear history">
            <IconTrash />
            <span>Clear</span>
          </button>
          <button
            onClick={handleLogout}
            className="nav-btn nav-btn--danger"
            title="Sign out"
          >
            <IconLogout />
            <span>Sign out</span>
          </button>
        </nav>
      </header>

      <div className="scroll-area">
        <div className="scroll-inner">
          {!hasMessages && (
            <div className="welcome">
              <p className="welcome-eyebrow">AI · Ready</p>
              <h1 className="welcome-heading">
                How can I<br />
                <em>help today?</em>
              </h1>
              <p className="welcome-sub">
                Code, writing, analysis - ask anything.
              </p>
              <SuggestedPrompts onSelect={handleSend} />
            </div>
          )}
          <div className="thread">
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            {error && <div className="err-bar">{error}</div>}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="input-zone">
        <div className="input-inner">
          <div className="input-field-wrap">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onInput={onInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              placeholder="Message Dispatch…"
              className="input-field"
            />
            <div className="input-actions">
              {loading ? (
                <button
                  onClick={stop}
                  className="send-btn send-btn--stop"
                  title="Stop"
                >
                  <IconStop />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`send-btn ${input.trim() ? "send-btn--active" : "send-btn--idle"}`}
                  title="Send"
                >
                  <IconSend />
                </button>
              )}
            </div>
          </div>
          <p className="disclaimer">
            Dispatch may produce inaccurate results. Verify important
            information.
          </p>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        #root { display: flex; flex-direction: column; }

        .root {
          height: 100vh; height: 100dvh;
          display: flex; flex-direction: column; overflow: hidden;
          background: #13110d;
          color: #ede3cc;
          font-family: 'Outfit', ui-sans-serif, sans-serif; font-size: 14px;
          position: relative;
        }
        .noise-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: .03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 200px 200px;
        }

        /* Header */
        .hdr {
          position: relative; z-index: 20; flex-shrink: 0; height: 50px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid rgba(210,140,40,.18);
          background: rgba(13,11,8,.94); backdrop-filter: blur(24px);
        }
        .hdr-left { display: flex; align-items: baseline; gap: 8px; flex-shrink: 0; }
        .hdr-wordmark { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 17px; color: #f0e6ce; letter-spacing: .01em; }
        .hdr-sep { color: rgba(210,140,40,.55); font-size: 15px; }
        .hdr-model { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(210,140,40,.65); letter-spacing: .03em; }
        .hdr-status-pill {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: rgba(237,227,204,.5);
          font-family: 'JetBrains Mono', monospace; letter-spacing: .05em;
        }
        .status-ring {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(210,140,40,.85);
          box-shadow: 0 0 0 2px rgba(210,140,40,.2);
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 2px rgba(210,140,40,.2); }
          50% { box-shadow: 0 0 0 4px rgba(210,140,40,.1); }
        }
        .hdr-nav { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .nav-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 400; color: rgba(237,227,204,.55);
          padding: 5px 10px; border-radius: 5px;
          border: 1px solid transparent; background: transparent;
          cursor: pointer; text-decoration: none; transition: all .15s;
          font-family: 'Outfit', sans-serif; letter-spacing: .01em;
        }
        .nav-btn:hover { color: rgba(237,227,204,.9); background: rgba(210,140,40,.09); border-color: rgba(210,140,40,.22); }
        .nav-btn--danger { color: rgba(220,120,90,.65); }
        .nav-btn--danger:hover { color: rgba(230,140,110,.95); background: rgba(200,80,60,.09); border-color: rgba(200,80,60,.22); }

        /* Scroll */
        .scroll-area { position: relative; z-index: 10; flex: 1; overflow-y: auto; padding: 0 24px; -webkit-overflow-scrolling: touch; }
        .scroll-area::-webkit-scrollbar { width: 3px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(210,140,40,.2); border-radius: 3px; }
        .scroll-inner { max-width: 820px; margin: 0 auto; padding: 40px 0 20px; }

        /* Welcome */
        .welcome { padding: 20px 0 48px; }
        .welcome-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .15em; color: rgba(210,140,40,.65); text-transform: uppercase; margin-bottom: 16px; }
        .welcome-heading { font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(36px, 5vw, 52px); font-weight: 400; line-height: 1.15; color: #f0e6ce; margin-bottom: 14px; }
        .welcome-heading em { font-style: italic; color: rgba(210,140,40,.9); }
        .welcome-sub { font-size: 14px; color: rgba(237,227,204,.45); margin-bottom: 36px; font-weight: 300; }

        /* Prompts */
        .prompts-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; color: rgba(210,140,40,.55); margin-bottom: 14px; }
        .prompts-list { display: flex; flex-direction: column; gap: 2px; }
        .prompt-item {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 6px;
          border: 1px solid transparent; background: transparent;
          cursor: pointer; text-align: left; transition: all .15s; font-family: 'Outfit', sans-serif;
        }
        .prompt-item:hover { background: rgba(210,140,40,.07); border-color: rgba(210,140,40,.18); }
        .prompt-item:hover .prompt-arrow { opacity: .8; transform: translateX(3px); }
        .prompt-tag { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: rgba(210,140,40,.65); min-width: 38px; }
        .prompt-label { font-size: 13.5px; color: rgba(237,227,204,.75); flex: 1; font-weight: 300; }
        .prompt-arrow { font-size: 14px; color: rgba(210,140,40,.55); transition: all .15s; opacity: 0; }

        /* Thread */
        .thread { display: flex; flex-direction: column; gap: 0; }

        /* AI messages */
        .msg-ai-row {
          display: flex; gap: 0; padding: 20px 0;
          border-top: 1px solid rgba(210,140,40,.09);
          animation: fadeSlideIn .3s ease;
        }
        .msg-ai-row:first-child { border-top: none; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .msg-ai-marker { width: 32px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 0; padding-top: 2px; }
        .ai-diamond { font-size: 8px; color: rgba(210,140,40,.75); line-height: 1; flex-shrink: 0; display: block; }
        .pulse-diamond { animation: diamondPulse 1.5s ease-in-out infinite; }
        @keyframes diamondPulse { 0%,100% { opacity: .7; } 50% { opacity: 1; color: rgba(210,140,40,1); } }
        .ai-thread-line { width: 1px; flex: 1; margin-top: 6px; background: linear-gradient(to bottom, rgba(210,140,40,.25), transparent); min-height: 20px; }
        .msg-ai-body { flex: 1; min-width: 0; font-family: 'Instrument Serif', Georgia, serif; font-size: 15.5px; line-height: 1.85; color: #ede3cc; padding-left: 8px; }
        .msg-ai-body p:last-child { margin-bottom: 0; }
        .msg-ai-footer { display: flex; align-items: center; gap: 14px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(210,140,40,.09); }
        .token-count { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(210,140,40,.45); letter-spacing: .04em; }
        .copy-btn-ai { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(237,227,204,.38); background: transparent; border: none; cursor: pointer; font-family: 'Outfit', sans-serif; transition: color .15s; letter-spacing: .03em; }
        .copy-btn-ai:hover { color: rgba(210,140,40,.75); }

        /* User messages */
        .msg-user-row { display: flex; justify-content: flex-end; padding: 16px 0; animation: fadeSlideIn .25s ease; }
        .msg-user-bubble {
          position: relative; max-width: 62%; padding: 11px 15px;
          border-radius: 3px 14px 14px 14px;
          background: rgba(210,140,40,.12);
          border: 1px solid rgba(210,140,40,.25);
          font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.65;
          color: rgba(237,227,204,.9); word-break: break-word;
        }
        .copy-btn-user { position: absolute; top: 8px; right: 8px; opacity: 0; transition: opacity .15s; color: rgba(210,140,40,.55); background: transparent; border: none; cursor: pointer; padding: 2px; border-radius: 3px; }
        .msg-user-bubble:hover .copy-btn-user { opacity: 1; }
        @media (hover: none) { .copy-btn-user { opacity: .5; } }

        /* Typing */
        .typing-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(210,140,40,.65); display: inline-block; animation: tdot 1.3s ease-in-out infinite; }
        @keyframes tdot { 0%,80%,100% { transform: translateY(0); opacity: .5; } 40% { transform: translateY(-5px); opacity: 1; } }

        /* Error */
        .err-bar { margin: 10px 0; padding: 10px 16px; border-radius: 4px; background: rgba(200,80,60,.08); border: 1px solid rgba(200,80,60,.25); font-size: 13px; color: rgba(230,150,130,.9); font-family: 'JetBrains Mono', monospace; }

        /* Input zone */
        .input-zone { position: relative; z-index: 20; flex-shrink: 0; background: rgba(13,11,8,.95); backdrop-filter: blur(24px); border-top: 1px solid rgba(210,140,40,.15); padding: 16px 24px; padding-bottom: max(16px, env(safe-area-inset-bottom)); }
        .input-inner { max-width: 820px; margin: 0 auto; }
        .input-field-wrap { display: flex; align-items: flex-end; gap: 12px; padding: 10px 0 10px; border-bottom: 1.5px solid rgba(210,140,40,.32); transition: border-color .2s; }
        .input-field-wrap:focus-within { border-bottom-color: rgba(210,140,40,.65); }
        .input-field { flex: 1; background: transparent; resize: none; font-size: 15px; font-family: 'Outfit', sans-serif; font-weight: 300; color: rgba(237,227,204,.92); caret-color: rgba(210,140,40,.85); outline: none; border: none; line-height: 1.6; max-height: 160px; height: 24px; -webkit-appearance: none; }
        .input-field::placeholder { color: rgba(210,140,40,.35); font-style: italic; }
        .input-actions { flex-shrink: 0; display: flex; align-items: center; }
        .send-btn { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all .18s; flex-shrink: 0; }
        .send-btn--active { background: rgba(210,140,40,.2); border: 1px solid rgba(210,140,40,.45); color: rgba(210,140,40,.95); }
        .send-btn--active:hover { background: rgba(210,140,40,.28); border-color: rgba(210,140,40,.6); }
        .send-btn--idle { background: transparent; border: 1px solid transparent; color: rgba(210,140,40,.28); cursor: default; }
        .send-btn--stop { background: rgba(200,80,60,.12); border: 1px solid rgba(200,80,60,.3); color: rgba(230,140,120,.8); }
        .disclaimer { font-size: 10.5px; color: rgba(210,140,40,.3); font-family: 'JetBrains Mono', monospace; letter-spacing: .03em; text-align: center; margin-top: 10px; }

        @media (max-width: 768px) { .hdr { padding: 0 16px; } .hdr-status-pill { display: none; } .scroll-area { padding: 0 16px; } .input-zone { padding: 12px 16px; padding-bottom: max(12px,env(safe-area-inset-bottom)); } .msg-user-bubble { max-width: 80%; font-size: 12.5px; } .welcome-heading { font-size: 32px; } }
        @media (max-width: 480px) { .hdr { height: 46px; padding: 0 12px; } .hdr-model { display: none; } .hdr-sep { display: none; } .nav-btn span:not([style]) { display: none; } .scroll-area { padding: 0 12px; } .scroll-inner { padding: 24px 0 16px; } .input-zone { padding: 10px 12px; padding-bottom: max(12px,env(safe-area-inset-bottom)); } .msg-user-bubble { max-width: 88%; } .welcome { padding: 10px 0 32px; } .prompt-tag { display: none; } }
        @media (min-width: 1280px) { .hdr { padding: 0 36px; } .scroll-area { padding: 0 36px; } .input-zone { padding: 18px 36px 20px; } }
      `}</style>
    </div>
  );
}
