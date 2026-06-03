import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const FIELDS = [
  {
    name: "full_name",
    label: "Full name",
    type: "text",
    placeholder: "Ada Lovelace",
    tag: "identity",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "ada@example.com",
    tag: "contact",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Min 8 characters",
    tag: "security",
  },
  {
    name: "confirm",
    label: "Confirm password",
    type: "password",
    placeholder: "Repeat password",
    tag: "security",
  },
];

const FEATURES = [
  { label: "Instant onboarding, no credit card", tag: "setup" },
  { label: "Secure document vault", tag: "storage" },
  { label: "Conversation memory retained", tag: "memory" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm)
      return setError("Passwords don't match.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await authAPI.register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });
      await authAPI.login(form.email, form.password);
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
      <div className="noise" />
      <div className="page">
        <section className="card-wrap">
          <div className="card">
            <div className="card-header">
              <div className="card-wm">Dispatch</div>
              <div className="card-div" />
              <p className="card-ey">Create account</p>
              <p className="card-sub">
                Start building your private AI workspace in minutes.
              </p>
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
              {FIELDS.map(({ name, label, type, placeholder, tag }) => (
                <div key={name} className="field">
                  <label className="field-label">
                    <span className="label-tag">{tag}</span>
                    {label}
                  </label>
                  <div className="input-wrap">
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      required
                      placeholder={placeholder}
                      className="field-input"
                    />
                  </div>
                </div>
              ))}
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
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
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
              Already have an account?{" "}
              <Link to="/login" className="signin-link">
                Sign in →
              </Link>
            </p>
          </div>
        </section>

        <section className="hero">
          <div className="hero-eyebrow">
            <span className="ey-dia">◆</span>
            <span>Launch in minutes</span>
          </div>
          <h1 className="hero-h1">
            Your personalized
            <br />
            AI space, <em>ready to grow.</em>
          </h1>
          <p className="hero-body">
            Connect your documents, collaborate with AI, and keep everything in
            one beautifully organized flow.
          </p>
          <div className="features">
            {FEATURES.map(({ label, tag }) => (
              <div key={label} className="feat">
                <div className="fmark">
                  <span className="fdia">◆</span>
                  <div className="fline" />
                </div>
                <div className="fcontent">
                  <span className="ftag">{tag}</span>
                  <span className="flabel">{label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hero-foot">
            <span className="hf-bar" />
            <span className="hf-txt">
              gemini-2.5-flash-lite · encrypted transit
            </span>
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
  .page { position: relative; z-index: 1; min-height: 100vh; min-height: 100dvh; max-width: 1060px; margin: 0 auto; display: grid; grid-template-columns: .85fr 1.15fr; align-items: center; gap: 64px; padding: 40px; }

  .card-wrap { display: flex; align-items: stretch; }
  .card { width: 100%; border: 1px solid rgba(210,140,40,.2); border-radius: 4px; background: rgba(18,15,10,.78); padding: 34px 30px; backdrop-filter: blur(20px); position: relative; overflow: hidden; }
  .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(210,140,40,.5), transparent); }
  .card-header { margin-bottom: 24px; }
  .card-wm { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; color: rgba(240,230,206,.6); margin-bottom: 15px; }
  .card-div { width: 100%; height: 1px; background: rgba(210,140,40,.15); margin-bottom: 15px; }
  .card-ey { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: rgba(210,140,40,.7); margin-bottom: 5px; }
  .card-sub { font-size: 12.5px; font-weight: 300; color: rgba(237,227,204,.45); line-height: 1.6; }
  .err-box { display: flex; align-items: flex-start; gap: 9px; background: rgba(200,80,60,.08); border: 1px solid rgba(200,80,60,.25); border-radius: 3px; padding: 10px 13px; font-size: 12px; font-family: 'JetBrains Mono', monospace; color: rgba(230,150,130,.9); margin-bottom: 18px; line-height: 1.55; }
  .form { display: flex; flex-direction: column; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 7px; }
  .field-label { display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: rgba(210,140,40,.6); }
  .label-tag { font-size: 8.5px; letter-spacing: .08em; color: rgba(210,140,40,.45); border: 1px solid rgba(210,140,40,.22); padding: 1px 5px; border-radius: 2px; }
  .input-wrap { border-bottom: 1.5px solid rgba(210,140,40,.25); transition: border-color .2s; }
  .input-wrap:focus-within { border-bottom-color: rgba(210,140,40,.62); }
  .field-input { width: 100%; background: transparent; border: none; outline: none; padding: 9px 0; font-size: 14px; font-weight: 300; font-family: 'Outfit', sans-serif; color: rgba(237,227,204,.92); caret-color: rgba(210,140,40,.85); -webkit-appearance: none; }
  .field-input::placeholder { color: rgba(210,140,40,.3); font-style: italic; }
  .submit-btn { margin-top: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px 20px; border-radius: 3px; border: 1px solid rgba(210,140,40,.35); background: rgba(210,140,40,.11); color: rgba(210,140,40,.95); font-size: 13.5px; font-weight: 400; font-family: 'Outfit', sans-serif; letter-spacing: .04em; cursor: pointer; transition: all .18s; }
  .submit-btn:hover:not(:disabled) { background: rgba(210,140,40,.2); border-color: rgba(210,140,40,.55); color: rgba(240,210,140,1); }
  .submit-btn:disabled { cursor: not-allowed; opacity: .45; }
  .card-footer { margin-top: 20px; text-align: center; font-size: 11.5px; color: rgba(210,140,40,.45); font-family: 'JetBrains Mono', monospace; letter-spacing: .03em; }
  .signin-link { color: rgba(210,140,40,.75); text-decoration: none; transition: color .15s; }
  .signin-link:hover { color: rgba(210,140,40,1); }

  .hero { display: flex; flex-direction: column; }
  .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: rgba(210,140,40,.7); margin-bottom: 28px; }
  .ey-dia { font-size: 7px; color: rgba(210,140,40,.85); }
  .hero-h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(34px, 3.8vw, 50px); font-weight: 400; line-height: 1.14; color: #f0e6ce; margin-bottom: 20px; }
  .hero-h1 em { font-style: italic; color: rgba(210,140,40,.9); }
  .hero-body { font-size: 14px; font-weight: 300; color: rgba(237,227,204,.55); line-height: 1.85; max-width: 380px; margin-bottom: 36px; }
  .features { display: flex; flex-direction: column; margin-bottom: 36px; }
  .feat { display: flex; gap: 0; padding: 13px 0; border-top: 1px solid rgba(210,140,40,.1); }
  .feat:last-child { border-bottom: 1px solid rgba(210,140,40,.1); }
  .fmark { width: 26px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding-top: 3px; }
  .fdia { font-size: 7px; color: rgba(210,140,40,.65); display: block; }
  .fline { width: 1px; flex: 1; margin-top: 5px; background: linear-gradient(to bottom, rgba(210,140,40,.2), transparent); min-height: 12px; }
  .fcontent { display: flex; align-items: center; gap: 12px; }
  .ftag { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: .09em; text-transform: uppercase; color: rgba(210,140,40,.58); min-width: 46px; }
  .flabel { font-size: 13px; font-weight: 300; color: rgba(237,227,204,.7); }
  .hero-foot { display: flex; align-items: center; gap: 12px; }
  .hf-bar { display: block; width: 26px; height: 1px; background: rgba(210,140,40,.38); }
  .hf-txt { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .07em; color: rgba(210,140,40,.42); }

  .spin { animation: spinning .7s linear infinite; flex-shrink: 0; }
  @keyframes spinning { to { transform: rotate(360deg); } }

  @media (max-width: 860px) { .page { grid-template-columns: 1fr; gap: 40px; padding: 36px 24px; } .card-wrap { order: 1; } .hero { order: 2; } .hero-h1 { font-size: clamp(28px, 6vw, 40px); } .hero-body { max-width: 100%; } }
  @media (max-width: 480px) { .page { padding: 24px 16px; gap: 28px; } .card { padding: 24px 18px; } .hero-h1 { font-size: 28px; } .ftag { display: none; } .label-tag { display: none; } }
`;
