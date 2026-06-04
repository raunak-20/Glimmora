import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { chatAPI, authAPI } from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../components/themeContext";

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
  id: "initial-msg",
  role: "assistant",
  content: "Hello! I'm your AI assistant. How can I help you today?",
};
const SYSTEM_PROMPT = "You are a helpful, concise AI assistant.";

function IconPlus() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}
function IconMic() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  );
}
function IconArrowUp() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  );
}
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
function IconSidebarToggle() {
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
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}
function IconNewChat() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function MarkdownRenderer({ content }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const c = isLight
    ? {
      p: "#2d1a0d",
      li: "#3e2917",
      h1: "#19110b",
      h2: "#2d1a0d",
      h3: "#4c3322",
      a: "#7d5237",
      blockquote: "rgba(62,41,23,0.65)",
      th: "#332217",
      td: "#3e2917",
      thBg: "rgba(156,102,68,.12)",
      thBorder: "rgba(156,102,68,.28)",
      tdBorder: "rgba(156,102,68,.18)",
      codePre: "rgba(44,28,14,.85)",
      codePreBorder: "rgba(156,102,68,.25)",
      inlineCode: "#6e3d20",
      inlineCodeBorder: "rgba(110,61,32,.45)",
      blockquoteBorder: "rgba(156,102,68,.55)",
    }
    : {
      p: "#ede3cc",
      li: "#ddd4bc",
      h1: "#f0e6ce",
      h2: "#e8dcca",
      h3: "#d8ccb4",
      a: "#d4904a",
      blockquote: "rgba(237,227,204,.65)",
      th: "#d8ccb4",
      td: "#ccc4b0",
      thBg: "rgba(210,140,40,.08)",
      thBorder: "rgba(210,140,40,.2)",
      tdBorder: "rgba(255,255,255,.08)",
      codePre: "rgba(0,0,0,.5)",
      codePreBorder: "rgba(210,140,40,.15)",
      inlineCode: "rgba(210,140,40,.95)",
      inlineCodeBorder: "rgba(210,140,40,.4)",
      blockquoteBorder: "rgba(210,140,40,.6)",
    };

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
                  background: c.codePre,
                  border: `1px solid ${c.codePreBorder}`,
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
                color: c.inlineCode,
                background: "transparent",
                borderBottom: `1px dashed ${c.inlineCodeBorder}`,
                paddingBottom: "1px",
              }}
            >
              {children}
            </code>
          );
        },
        p({ children }) {
          return (
            <p style={{ margin: "0 0 12px", lineHeight: 1.85, color: c.p, textAlign: "left" }}>
              {children}
            </p>
          );
        },
        ul({ children }) {
          return (
            <ul style={{ paddingLeft: 22, margin: "0 0 12px", textAlign: "left" }}>
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol style={{ paddingLeft: 22, margin: "0 0 12px", textAlign: "left" }}>
              {children}
            </ol>
          );
        },
        li({ children }) {
          return (
            <li style={{ marginBottom: 5, color: c.li, lineHeight: 1.75, textAlign: "left" }}>
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
              style={{ color: c.a, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              {children}
            </a>
          );
        },
        h1({ children }) {
          return (
            <h1
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "1.1rem",
                fontWeight: 600,
                margin: "0 0 12px",
                color: c.h1,
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
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "1rem",
                fontWeight: 600,
                margin: "0 0 10px",
                color: c.h2,
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
                color: c.h3,
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
                borderLeft: `2px solid ${c.blockquoteBorder}`,
                paddingLeft: 16,
                fontStyle: "italic",
                color: c.blockquote,
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
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th
              style={{
                border: `1px solid ${c.thBorder}`,
                padding: "7px 12px",
                background: c.thBg,
                color: c.th,
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
                border: `1px solid ${c.tdBorder}`,
                padding: "7px 12px",
                color: c.td,
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
  
  // App-level state for session management
  const [sessions, setSessions] = useState([]);
  const [activeSessionUid, setActiveSessionUid] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // Fetch recent sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await chatAPI.getSessions();
      setSessions(res.data || []);
      return res.data;
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
      setError("Failed to load chat history from backend.");
    }
  };

  const loadSession = async (uid) => {
    setError("");
    setLoading(true);
    try {
      const res = await chatAPI.getSessionMessages(uid);
      const loaded = res.data.map((m) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
      }));
      setMessages([INITIAL_MESSAGE, ...loaded]);
      setActiveSessionUid(uid);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load conversation history.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveSessionUid(null);
    setMessages([INITIAL_MESSAGE]);
    setError("");
  };

  const handleDeleteSession = async (e, uid) => {
    e.stopPropagation();
    const ok = window.confirm("Delete this conversation?");
    if (!ok) return;
    try {
      await chatAPI.deleteSession(uid);
      if (activeSessionUid === uid) {
        handleNewChat();
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete session:", err);
      setError("Failed to delete chat session.");
    }
  };

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
    try {
      const res = await chatAPI.send(
        text,
        activeSessionUid,
        SYSTEM_PROMPT,
        abortRef.current.signal,
      );
      const { response, tokens_used, session_uid } = res.data;
      
      if (!activeSessionUid) {
        setActiveSessionUid(session_uid);
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          tokens_used,
        },
      ]);
      fetchSessions();
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
  
  const clearCurrent = () => {
    setMessages([INITIAL_MESSAGE]);
    setError("");
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

      <Navbar
        currentPage="chat"
        statusText="online"
        showChatControls={true}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onClearScreen={clearCurrent}
      />

      <div className="app-container">
        <aside className={`sidebar ${sidebarOpen ? "" : "sidebar--collapsed"}`}>
          <div className="sidebar-header">
            <span className="sidebar-title">Recent Chats</span>
          </div>
          <div className="sidebar-list">
            {sessions.length === 0 ? (
              <div className="sidebar-empty">No past conversations</div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.uid}
                  onClick={() => loadSession(s.uid)}
                  className={`sidebar-item ${activeSessionUid === s.uid ? "sidebar-item--active" : ""}`}
                >
                  <span className="sidebar-item-title" title={s.title}>
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.uid)}
                    className="sidebar-delete-btn"
                    title="Delete conversation"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="main-chat-area">
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
                <div className="input-actions-row">
                  <button type="button" className="toolbar-btn" title="Voice input">
                    <IconMic />
                  </button>
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
                      <IconArrowUp />
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
        </main>
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


        /* App container & Sidebar */
        .app-container {
          display: flex;
          flex: 1;
          height: calc(100vh - 50px);
          overflow: hidden;
          position: relative;
          z-index: 10;
        }
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          background: #181612;
          border-right: 1px solid rgba(210,140,40,.15);
          display: flex;
          flex-direction: column;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .sidebar--collapsed {
          width: 0;
          border-right: none;
        }
        .sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(210,140,40,.08);
          flex-shrink: 0;
        }
        .sidebar-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(210,140,40,.65);
        }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-list::-webkit-scrollbar { width: 3px; }
        .sidebar-list::-webkit-scrollbar-thumb { background: rgba(210,140,40,.12); border-radius: 3px; }
        
        .sidebar-empty {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: rgba(237,227,204,.35);
          font-style: italic;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          gap: 8px;
        }
        .sidebar-item:hover {
          background: rgba(210,140,40,.08);
        }
        .sidebar-item--active {
          background: rgba(210,140,40,.15);
          border: 1px solid rgba(210,140,40,.25);
        }
        .sidebar-item-title {
          font-size: 13px;
          color: rgba(237,227,204,.75);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .sidebar-item--active .sidebar-item-title {
          color: rgba(237,227,204,.95);
          font-weight: 500;
        }
        .sidebar-delete-btn {
          background: transparent;
          border: none;
          color: rgba(220,120,90,.5);
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
          line-height: 1;
          transition: color 0.15s;
          opacity: 0;
        }
        .sidebar-item:hover .sidebar-delete-btn {
          opacity: 1;
        }
        .sidebar-delete-btn:hover {
          color: rgba(220,120,90,0.95);
        }

        .main-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
          background: #13110d;
        }

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
        .msg-ai-body { flex: 1; min-width: 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.65; color: #ede3cc; padding-left: 8px; }
        .msg-ai-body p:last-child { margin-bottom: 0; }
        .msg-ai-footer { display: flex; align-items: center; gap: 14px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(210,140,40,.09); }
        .token-count { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(210,140,40,.45); letter-spacing: .04em; }
        .copy-btn-ai { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(237,227,204,.38); background: transparent; border: none; cursor: pointer; font-family: 'Outfit', sans-serif; transition: color .15s; letter-spacing: .03em; }
        .copy-btn-ai:hover { color: rgba(210,140,40,.75); }

        /* User messages */
        .msg-user-row { display: flex; justify-content: flex-end; padding: 16px 0; animation: fadeSlideIn .25s ease; }
        .msg-user-bubble {
          position: relative; max-width: 62%; padding: 11px 36px 11px 15px;
          border-radius: 14px 3px 14px 14px;
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
        .err-bar { margin: 10px 0; padding: 10px 16px; border-radius: 4px; background: rgba(200,80,60,.08); border: 1px solid rgba(200,80,60,.25); font-size: 13px; color: rgba(230,140,110,.9); font-family: 'JetBrains Mono', monospace; }

        /* Input zone */
        .input-zone { position: relative; z-index: 20; flex-shrink: 0; background: transparent; padding: 10px 24px; padding-bottom: max(12px, env(safe-area-inset-bottom)); }
        .input-inner { max-width: 820px; margin: 0 auto; }
        .input-field-wrap {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          padding: 10px 10px 10px 16px;
          background: #1b1915;
          border: 1px solid rgba(210,140,40,.18);
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          transition: border-color .2s, box-shadow .2s;
        }
        .input-field-wrap:focus-within {
          border-color: rgba(210,140,40,.42);
          box-shadow: 0 10px 30px rgba(210,140,40,.03);
        }
        .input-field {
          flex: 1;
          background: transparent;
          resize: none;
          font-size: 14.5px;
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          color: rgba(237,227,204,.92);
          caret-color: rgba(210,140,40,.85);
          outline: none;
          border: none;
          line-height: 1.5;
          max-height: 160px;
          height: 22px;
          padding: 0;
          -webkit-appearance: none;
        }
        .input-field::placeholder { color: rgba(237, 227, 204, 0.45); font-style: italic; }
        
        .input-actions-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          align-self: center;
        }
        .toolbar-btn {
          background: transparent;
          border: none;
          color: rgba(237,227,204,.55);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .toolbar-btn:hover {
          background: rgba(210,140,40,.08);
          color: rgba(237,227,204,.95);
        }
        .toolbar-btn--text {
          border-radius: 14px;
          padding: 0 10px;
          width: auto;
          height: 26px;
          gap: 4px;
          font-size: 11.5px;
          font-family: 'Outfit', sans-serif;
          font-weight: 400;
        }
        
        .send-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all .15s;
          flex-shrink: 0;
        }
        .send-btn--active {
          background: #ede3cc;
          color: #13110d;
        }
        .send-btn--active:hover {
          background: #f0e6ce;
          transform: scale(1.02);
        }
        .send-btn--idle {
          background: rgba(237,227,204,.08);
          color: rgba(237,227,204,.22);
          cursor: default;
        }
        .send-btn--stop {
          background: rgba(200,80,60,.85);
          color: #ffffff;
        }
        .disclaimer { font-size: 10.5px; color: rgba(210,140,40,.28); font-family: 'JetBrains Mono', monospace; letter-spacing: .03em; text-align: center; margin-top: 10px; }

        @media (max-width: 768px) { 
          .hdr { padding: 0 16px; } 
          .hdr-status-pill { display: none; } 
          .scroll-area { padding: 0 16px; } 
          .input-zone { padding: 12px 16px; padding-bottom: max(12px,env(safe-area-inset-bottom)); } 
          .msg-user-bubble { max-width: 80%; font-size: 12.5px; } 
          .welcome-heading { font-size: 32px; } 
          .sidebar { position: absolute; left: 0; top: 0; bottom: 0; z-index: 100; box-shadow: 5px 0 15px rgba(0,0,0,0.5); }
        }
        @media (max-width: 480px) { .hdr { height: 46px; padding: 0 12px; } .hdr-sep { display: none; } .nav-btn span:not([style]) { display: none; } .scroll-area { padding: 0 12px; } .scroll-inner { padding: 24px 0 16px; } .input-zone { padding: 10px 12px; padding-bottom: max(12px,env(safe-area-inset-bottom)); } .msg-user-bubble { max-width: 88%; } .welcome { padding: 10px 0 32px; } .prompt-tag { display: none; } }
        @media (min-width: 1280px) { .hdr { padding: 0 36px; } .scroll-area { padding: 0 36px; } .input-zone { padding: 18px 36px 20px; } }
      `}</style>
    </div>
  );
}
