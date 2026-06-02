import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";

function SparkleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/chat";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authAPI.login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-glow" />
      <div className="auth-grid" />

      <div className="auth-page">
        {/* Left — hero copy */}
        <section className="auth-hero">
          <div className="hero-badge">Secure AI workspace</div>
          <h1 className="hero-h1">Welcome back to a calmer, smarter workflow.</h1>
          <p className="hero-p">Access your conversations, document intelligence, and private knowledge base in one secure place.</p>
          <ul className="hero-list">
            {["Private, token-based access", "RAG ready in seconds", "Streaming responses with full history"].map(item => (
              <li key={item} className="hero-li"><span className="hero-dot emerald" />{item}</li>
            ))}
          </ul>
        </section>

        {/* Right — form card */}
        <section className="auth-card-wrap">
          <div className="auth-card-glow" />
          <div className="auth-card">
            {/* Logo row */}
            <div className="card-logo-row">
              <div className="card-logo-icon cyan">
                <SparkleIcon />
              </div>
              <div>
                <p className="card-brand">Glimmora</p>
                <h2 className="card-title">Sign in</h2>
              </div>
            </div>
            <p className="card-sub">Use your account to continue your session.</p>

            {error && (
              <div className="auth-error">
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field">
                <label className="field-label">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" className="field-input cyan-focus" />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" className="field-input cyan-focus" />
              </div>
              <button type="submit" disabled={loading} className="auth-btn cyan-btn">
                {loading
                  ? <><svg className="spin" width={16} height={16} viewBox="0 0 24 24" fill="none"><circle className="op25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in…</>
                  : "Sign in"
                }
              </button>
            </form>

            <p className="auth-footer-txt">No account yet? <Link to="/register" className="auth-link cyan-link">Create one</Link></p>
          </div>
        </section>
      </div>

      <style>{AUTH_STYLES}</style>
    </div>
  );
}

const AUTH_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    min-height: 100vh; min-height: 100dvh;
    background: #08090d; color: white;
    font-family: 'Sora','DM Sans',ui-sans-serif;
    font-size: 14px; position: relative; overflow-x: hidden;
  }
  .auth-glow {
    position: fixed; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 65% 50% at 10% 0%,rgba(6,182,212,.1) 0%,transparent 55%),
                radial-gradient(ellipse 55% 45% at 90% 100%,rgba(59,130,246,.12) 0%,transparent 55%);
  }
  .auth-grid {
    position: fixed; inset: 0; pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
                      linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
    background-size: 52px 52px; opacity: .35;
  }
  .auth-page {
    position: relative; z-index: 1;
    min-height: 100vh; min-height: 100dvh;
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: 1.1fr .9fr;
    align-items: center; gap: 48px;
    padding: 40px 32px;
  }

  /* Hero */
  .auth-hero { max-width: 480px; }
  .hero-badge {
    display: inline-flex; align-items: center;
    border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04);
    border-radius: 100px; padding: 6px 16px;
    font-size: 11px; letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.65);
    margin-bottom: 24px;
  }
  .hero-h1 { font-size: clamp(24px,3vw,36px); font-weight: 600; line-height: 1.3; color: white; margin-bottom: 16px; }
  .hero-p { font-size: 15px; color: rgba(255,255,255,.55); line-height: 1.7; margin-bottom: 32px; }
  .hero-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .hero-li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,.7); }
  .hero-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .hero-dot.emerald { background: #34d399; box-shadow: 0 0 8px rgba(52,211,153,.5); }
  .hero-dot.cyan { background: #22d3ee; box-shadow: 0 0 8px rgba(34,211,238,.5); }

  /* Card */
  .auth-card-wrap { position: relative; }
  .auth-card-glow {
    position: absolute; inset: -20px; border-radius: 36px;
    background: linear-gradient(135deg,rgba(6,182,212,.08),transparent,rgba(59,130,246,.08));
    filter: blur(24px); pointer-events: none;
  }
  .auth-card {
    position: relative; border-radius: 24px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(12,14,20,.92);
    padding: 32px; backdrop-filter: blur(24px);
    box-shadow: 0 24px 60px rgba(0,0,0,.5);
  }
  .card-logo-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .card-logo-icon {
    width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .card-logo-icon.cyan { background: rgba(6,182,212,.12); border: 1px solid rgba(6,182,212,.25); color: #67e8f9; }
  .card-logo-icon.emerald { background: rgba(52,211,153,.12); border: 1px solid rgba(52,211,153,.25); color: #6ee7b7; }
  .card-brand { font-size: 11px; letter-spacing: .35em; text-transform: uppercase; color: rgba(255,255,255,.45); margin-bottom: 4px; }
  .card-title { font-size: 22px; font-weight: 600; color: white; }
  .card-sub { font-size: 13px; color: rgba(255,255,255,.45); margin-bottom: 24px; }

  /* Error */
  .auth-error {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2);
    border-radius: 14px; padding: 12px 14px;
    font-size: 13px; color: #fca5a5; margin-bottom: 20px;
  }
  .auth-error svg { flex-shrink: 0; margin-top: 1px; color: #f87171; }

  /* Form */
  .auth-form { display: flex; flex-direction: column; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field-label { font-size: 11px; font-weight: 500; letter-spacing: .32em; text-transform: uppercase; color: rgba(255,255,255,.4); }
  .field-input {
    width: 100%; border-radius: 14px; border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04); padding: 12px 16px;
    font-size: 14px; color: white; outline: none; transition: border-color .2s, background .2s;
    font-family: inherit;
  }
  .field-input::placeholder { color: rgba(255,255,255,.28); }
  .field-input.cyan-focus:focus { border-color: rgba(6,182,212,.5); background: rgba(255,255,255,.06); }
  .field-input.emerald-focus:focus { border-color: rgba(52,211,153,.5); background: rgba(255,255,255,.06); }

  /* Submit button */
  .auth-btn {
    width: 100%; padding: 13px; border-radius: 14px; border: none; cursor: pointer;
    font-size: 14px; font-weight: 600; font-family: inherit;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 4px; transition: opacity .2s, filter .2s;
  }
  .auth-btn:disabled { cursor: not-allowed; opacity: .6; }
  .auth-btn:not(:disabled):hover { filter: brightness(1.08); }
  .cyan-btn { background: linear-gradient(135deg,#06b6d4,#3b82f6); color: #f0f9ff; }
  .emerald-btn { background: linear-gradient(135deg,#34d399,#06b6d4); color: #f0fdf4; }

  /* Footer */
  .auth-footer-txt { margin-top: 20px; text-align: center; font-size: 13px; color: rgba(255,255,255,.4); }
  .auth-link { text-decoration: none; transition: color .15s; }
  .auth-link.cyan-link { color: #67e8f9; }
  .auth-link.cyan-link:hover { color: #a5f3fc; }
  .auth-link.emerald-link { color: #6ee7b7; }
  .auth-link.emerald-link:hover { color: #a7f3d0; }

  /* Spinner */
  .spin { animation: spinning .7s linear infinite; }
  @keyframes spinning { to { transform: rotate(360deg); } }
  .op25 { opacity: .25; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .auth-page { grid-template-columns: 1fr; padding: 32px 20px; gap: 32px; }
    .auth-hero { max-width: 100%; }
    .hero-h1 { font-size: clamp(20px,5vw,28px); }
  }
  @media (max-width: 480px) {
    .auth-page { padding: 24px 16px; }
    .auth-card { padding: 24px 20px; border-radius: 20px; }
    .card-title { font-size: 20px; }
    .field-input { padding: 11px 14px; }
    .auth-btn { padding: 12px; }
  }`;