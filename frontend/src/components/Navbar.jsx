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
          <span>Clear</span>
        </button>
        <Link
          to="/chat"
          className={`nav-btn ${currentPage === "chat" ? "nav-btn--active" : ""}`}
          style={currentPage === "chat" ? { background: "rgba(210,140,40,.09)", borderColor: "rgba(210,140,40,.22)" } : {}}
        >
          <span>Chat</span>
        </Link>
        <Link
          to="/rag"
          className={`nav-btn ${currentPage === "rag" ? "nav-btn--active" : ""}`}
          style={currentPage === "rag" ? { background: "rgba(210,140,40,.09)", borderColor: "rgba(210,140,40,.22)" } : {}}
        >
          <span>RAG</span>
        </Link>
        <Link
          to="/logs"
          className={`nav-btn ${currentPage === "logs" ? "nav-btn--active" : ""}`}
          style={currentPage === "logs" ? { background: "rgba(210,140,40,.09)", borderColor: "rgba(210,140,40,.22)" } : {}}
        >
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
