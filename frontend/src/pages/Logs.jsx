import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logsAPI, authAPI } from "../services/api";
import Navbar from "../components/Navbar";

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

function IconRefresh() {
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
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );
}

export default function Logs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const consoleEndRef = useRef(null);

  const levels = ["", "INFO", "WARNING", "ERROR", "DEBUG"];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await logsAPI.getLogs(levelFilter || null, searchTerm, 200);
      // We want oldest logs first to flow down like a real console
      setLogs(res.data.reverse());
      setError("");
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Failed to retrieve system logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [levelFilter, searchTerm]);

  // Polling for auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, levelFilter, searchTerm]);

  // Scroll to bottom when new logs come in
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  const handleClearLogs = async () => {
    const ok = window.confirm("Clear all application logs? This cannot be undone.");
    if (!ok) return;
    try {
      await logsAPI.clearLogs();
      setLogs([]);
      fetchLogs();
    } catch (err) {
      console.error("Failed to clear logs:", err);
      setError("Failed to clear logs on server.");
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString() + "." + String(date.getMilliseconds()).padStart(3, "0");
    } catch {
      return ts;
    }
  };

  const getLevelBadgeClass = (lvl) => {
    const clean = lvl.toUpperCase();
    if (clean === "ERROR") return "log-badge-err";
    if (clean === "WARNING") return "log-badge-warn";
    if (clean === "DEBUG") return "log-badge-debug";
    return "log-badge-info";
  };

  return (
    <div className="root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
      <div className="noise-overlay" />

      <Navbar currentPage="logs" statusText="logging monitor" />

      <div className="app-container" style={{ flexDirection: "column", padding: "20px 24px" }}>
        <div className="logs-header-bar">
          <div className="logs-controls-left">
            <span className="logs-page-title">System Console Logs</span>
            <div className="level-filters">
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`lvl-pill ${levelFilter === lvl ? "lvl-pill--active" : ""}`}
                >
                  {lvl || "ALL"}
                </button>
              ))}
            </div>
          </div>

          <div className="logs-controls-right">
            <input
              type="text"
              placeholder="Search log messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="logs-search-input"
            />
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`logs-refresh-btn ${autoRefresh ? "logs-refresh-btn--active" : ""}`}
              title={autoRefresh ? "Pause auto-refresh" : "Enable auto-refresh"}
            >
              {autoRefresh ? "Live Feed (ON)" : "Live Feed (PAUSED)"}
            </button>
            <button
              onClick={fetchLogs}
              className="logs-action-btn"
              title="Manual Reload"
              disabled={loading}
            >
              <IconRefresh />
            </button>
            <button
              onClick={handleClearLogs}
              className="logs-action-btn logs-action-btn--danger"
              title="Clear Logs"
            >
              <IconTrash />
            </button>
          </div>
        </div>

        {error && <div className="err-bar" style={{ margin: "0 0 15px" }}>{error}</div>}

        <div className="console-container">
          <div className="console-header-decor">
            <div className="decor-dot decor-dot-red" />
            <div className="decor-dot decor-dot-yellow" />
            <div className="decor-dot decor-dot-green" />
            <span className="decor-title">bash — uvicorn logs</span>
          </div>
          <div className="console-body">
            {logs.length === 0 ? (
              <div className="console-empty">
                {loading ? "Reading logs..." : "No matching log statements recorded."}
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="log-row">
                  <span className="log-time">[{formatTimestamp(log.timestamp)}]</span>
                  <span className={`log-badge ${getLevelBadgeClass(log.level)}`}>
                    {log.level.padEnd(7)}
                  </span>
                  <span className="log-module">[{log.module}]</span>
                  <span className="log-msg">{log.message}</span>
                  {log.request_id && log.request_id !== "-" && (
                    <span className="log-req-id">(req: {log.request_id.slice(0,8)})</span>
                  )}
                  {log.exception && (
                    <pre className="log-exception">{log.exception}</pre>
                  )}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
