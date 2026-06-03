import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/chat";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authAPI.login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed. Check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { label: "Private, token-based access", tag: "security" },
    { label: "RAG-powered document intelligence", tag: "search" },
    { label: "Streaming responses with full history", tag: "ai" },
  ];

  return (
    <div className="root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
      <div className="noise" />
      <div className="page">
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="eyebrow-diamond">◆</span>
            <span>Secure AI workspace</span>
          </div>
          <h1 className="hero-h1">
            Welcome back
            <br />
            to <em>Dispatch.</em>
          </h1>
          <p className="hero-body">
            Access your conversations, document intelligence, and private
            knowledge base in one place.
          </p>
          <div className="features">
            {features.map(({ label, tag }) => (
              <div key={label} className="feature-row">
                <div className="feature-marker">
                  <span className="f-diamond">◆</span>
                  <div className="f-line" />
                </div>
                <div className="feature-content">
                  <span className="feature-tag">{tag}</span>
                  <span className="feature-label">{label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hero-footer">
            <span className="hf-bar" />
            <span className="hf-txt">
              gemini-2.5-flash-lite · encrypted transit
            </span>
          </div>
        </section>

        <section className="card-wrap">
          <div className="card">
            <div className="card-header">
              <div className="card-wordmark">Dispatch</div>
              <div className="card-divider" />
              <div className="card-title-group">
                <p className="card-eyebrow">Sign in</p>
                <p className="card-sub">
                  Use your account to continue your session.
                </p>
              </div>
            </div>
            {error && (
              <div className="err-box">
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label className="field-label">Email</label>
                <div className="input-wrap">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="field-input"
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="field-input"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <>
                    <svg
                      className="spin"
                      width={13}
                      height={13}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeOpacity=".25"
                      />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg
                      width={13}
                      height={13}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
            <p className="card-footer">
              No account yet?{" "}
              <Link to="/register" className="register-link">
                Create one →
              </Link>
            </p>
          </div>
        </section>
      </div>
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  .root { min-height: 100vh; min-height: 100dvh; background: #13110d; color: #ede3cc; font-family: 'Outfit', ui-sans-serif, sans-serif; font-size: 14px; position: relative; overflow-x: hidden; }
  .noise { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: .03; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px 200px; }
  .page { position: relative; z-index: 1; min-height: 100vh; min-height: 100dvh; max-width: 1060px; margin: 0 auto; display: grid; grid-template-columns: 1.15fr .85fr; align-items: center; gap: 64px; padding: 48px 40px; }

  .hero { display: flex; flex-direction: column; }
  .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: rgba(210,140,40,.7); margin-bottom: 28px; }
  .eyebrow-diamond { font-size: 7px; color: rgba(210,140,40,.85); }
  .hero-h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(38px, 4.5vw, 58px); font-weight: 400; line-height: 1.12; color: #f0e6ce; margin-bottom: 20px; }
  .hero-h1 em { font-style: italic; color: rgba(210,140,40,.9); }
  .hero-body { font-size: 14.5px; font-weight: 300; color: rgba(237,227,204,.58); line-height: 1.8; max-width: 400px; margin-bottom: 40px; }

  .features { display: flex; flex-direction: column; gap: 0; margin-bottom: 40px; }
  .feature-row { display: flex; gap: 0; padding: 14px 0; border-top: 1px solid rgba(210,140,40,.1); }
  .feature-row:last-child { border-bottom: 1px solid rgba(210,140,40,.1); }
  .feature-marker { width: 28px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding-top: 3px; }
  .f-diamond { font-size: 7px; color: rgba(210,140,40,.65); display: block; }
  .f-line { width: 1px; flex: 1; margin-top: 5px; background: linear-gradient(to bottom, rgba(210,140,40,.2), transparent); min-height: 14px; }
  .feature-content { display: flex; align-items: center; gap: 12px; }
  .feature-tag { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: rgba(210,140,40,.6); min-width: 46px; }
  .feature-label { font-size: 13.5px; font-weight: 300; color: rgba(237,227,204,.72); }
  .hero-footer { display: flex; align-items: center; gap: 12px; }
  .hf-bar { display: block; width: 28px; height: 1px; background: rgba(210,140,40,.4); }
  .hf-txt { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .07em; color: rgba(210,140,40,.45); }

  .card-wrap { display: flex; align-items: stretch; }
  .card { width: 100%; border: 1px solid rgba(210,140,40,.2); border-radius: 4px; background: rgba(18,15,10,.75); padding: 36px 32px; backdrop-filter: blur(20px); position: relative; overflow: hidden; }
  .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(210,140,40,.5), transparent); }
  .card-header { margin-bottom: 28px; }
  .card-wordmark { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; color: rgba(240,230,206,.65); margin-bottom: 16px; }
  .card-divider { width: 100%; height: 1px; background: rgba(210,140,40,.15); margin-bottom: 16px; }
  .card-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: rgba(210,140,40,.7); margin-bottom: 5px; }
  .card-sub { font-size: 12.5px; font-weight: 300; color: rgba(237,227,204,.45); line-height: 1.6; }
  .err-box { display: flex; align-items: flex-start; gap: 9px; background: rgba(200,80,60,.08); border: 1px solid rgba(200,80,60,.25); border-radius: 3px; padding: 10px 13px; font-size: 12.5px; font-family: 'JetBrains Mono', monospace; color: rgba(230,150,130,.9); margin-bottom: 20px; line-height: 1.5; }
  .form { display: flex; flex-direction: column; gap: 20px; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field-label { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: rgba(210,140,40,.6); }
  .input-wrap { border-bottom: 1.5px solid rgba(210,140,40,.28); transition: border-color .2s; }
  .input-wrap:focus-within { border-bottom-color: rgba(210,140,40,.65); }
  .field-input { width: 100%; background: transparent; border: none; outline: none; padding: 9px 0; font-size: 14.5px; font-weight: 300; font-family: 'Outfit', sans-serif; color: rgba(237,227,204,.92); caret-color: rgba(210,140,40,.85); -webkit-appearance: none; }
  .field-input::placeholder { color: rgba(210,140,40,.32); font-style: italic; }
  .submit-btn { margin-top: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 13px 20px; border-radius: 3px; border: 1px solid rgba(210,140,40,.38); background: rgba(210,140,40,.12); color: rgba(210,140,40,.95); font-size: 13.5px; font-weight: 400; font-family: 'Outfit', sans-serif; letter-spacing: .04em; cursor: pointer; transition: all .18s; }
  .submit-btn:hover:not(:disabled) { background: rgba(210,140,40,.2); border-color: rgba(210,140,40,.55); color: rgba(240,210,140,1); }
  .submit-btn:disabled { cursor: not-allowed; opacity: .45; }
  .card-footer { margin-top: 22px; text-align: center; font-size: 12px; color: rgba(210,140,40,.45); font-family: 'JetBrains Mono', monospace; letter-spacing: .03em; }
  .register-link { color: rgba(210,140,40,.75); text-decoration: none; transition: color .15s; }
  .register-link:hover { color: rgba(210,140,40,1); }
  .spin { animation: spinning .7s linear infinite; flex-shrink: 0; }
  @keyframes spinning { to { transform: rotate(360deg); } }

  @media (max-width: 860px) { .page { grid-template-columns: 1fr; gap: 40px; padding: 40px 28px; } .hero { order: 2; } .card-wrap { order: 1; } .hero-h1 { font-size: clamp(30px, 6vw, 42px); } .hero-body { max-width: 100%; } }
  @media (max-width: 480px) { .page { padding: 28px 18px; gap: 32px; } .card { padding: 26px 20px; } .hero-h1 { font-size: 32px; } .feature-tag { display: none; } }
`;
