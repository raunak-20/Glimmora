import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import ThemeToggle from "./ThemeToggle";

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

function IconChat() {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconRAG() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconLogs() {
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
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconClear() {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function Navbar({
  currentPage,
  statusText = "online",
  showChatControls = false,
  onSidebarToggle,
  onNewChat,
  onClearScreen,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  return (
    <header className="hdr">
      <div className="hdr-left">
        <Link to="/chat" className="model-selector-pill" style={{ textDecoration: "none" }}>
          <span className="hdr-wordmark">Dispatch</span>
        </Link>
        <div
          className="chatgpt-controls-pill"
          style={!showChatControls ? { visibility: "hidden", pointerEvents: "none" } : {}}
        >
          <button
            onClick={onSidebarToggle}
            className="control-btn"
            title="Toggle sidebar"
          >
            <IconSidebarToggle />
          </button>
          <button
            onClick={onNewChat}
            className="control-btn"
            title="New Chat"
          >
            <IconNewChat />
          </button>
        </div>
      </div>

      <div className="hdr-status-pill">
        <span className="status-ring" />
        {statusText}
      </div>

      <nav className="hdr-nav">
        <button
          onClick={onClearScreen || (() => {})}
          className="nav-btn"
          style={{
            visibility: onClearScreen ? "visible" : "hidden",
            pointerEvents: onClearScreen ? "auto" : "none",
          }}
          title="Clear current screen"
        >
          <IconClear />
          <span>Clear</span>
        </button>
        <Link
          to="/chat"
          className={`nav-btn ${currentPage === "chat" ? "nav-btn--active" : ""}`}
          style={currentPage === "chat" ? { background: "rgba(210,140,40,.09)", borderColor: "rgba(210,140,40,.22)" } : {}}
        >
          <IconChat />
          <span>Chat</span>
        </Link>
        <Link
          to="/rag"
          className={`nav-btn ${currentPage === "rag" ? "nav-btn--active" : ""}`}
          style={currentPage === "rag" ? { background: "rgba(210,140,40,.09)", borderColor: "rgba(210,140,40,.22)" } : {}}
        >
          <IconRAG />
          <span>RAG</span>
        </Link>
        <Link
          to="/logs"
          className={`nav-btn ${currentPage === "logs" ? "nav-btn--active" : ""}`}
          style={currentPage === "logs" ? { background: "rgba(210,140,40,.09)", borderColor: "rgba(210,140,40,.22)" } : {}}
        >
          <IconLogs />
          <span>Logs</span>
        </Link>

        <ThemeToggle />

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
  );
}
