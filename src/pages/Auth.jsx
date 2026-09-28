import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Icon, Logo } from "../components/Icons.jsx";
import { Alert } from "../components/UI.jsx";

const POINTS = [
  ["Know your profit every month", "A plain-English report the day your month closes."],
  ["Get warned before you overspend", "Alerts when a cost drifts past your budget or your industry's normal."],
  ["Price with confidence", "Cost every product from its materials and see the margin you'll keep."],
];

function Google() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Auth({ mode = "signin" }) {
  const { signIn, signUp, signInWithGoogle, resetPassword, tour } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    // During the guided tour no real account is created.
    if (tour) return nav("/start");
    if (mode === "signup" && f.password.length < 8) return setErr("Use at least 8 characters for your password.");
    setBusy(true);
    try {
      if (mode === "reset") {
        await resetPassword(f.email);
        setInfo("If there's an account for that email, a reset link is on its way.");
      } else if (mode === "signup") {
        await signUp(f.name, f.email, f.password);
        nav("/start");
      } else {
        await signIn(f.email, f.password);
        nav("/app");
      }
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setErr("");
    setBusy(true);
    try {
      await signInWithGoogle();
      nav(mode === "signup" ? "/start" : "/app");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const title = { signin: "Welcome back", signup: "Create your account", reset: "Reset your password" }[mode];

  return (
    <div className="auth grain">
      <div className="auth-bg" aria-hidden="true" />
      <div className="auth-grid">
        <div className="auth-side">
          <Link to="/" className="brand" style={{ padding: 0 }}>
            <Logo /> EPRI
          </Link>
          <h1>
            The financial advisor <span className="serif text-gradient">your business can afford.</span>
          </h1>
          <ul className="auth-points">
            {POINTS.map(([t, d]) => (
              <li key={t}>
                <span className="tick"><Icon name="check" size={14} strokeWidth={2.6} /></span>
                <div>
                  <b>{t}</b>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form className="auth-card glass hairline" onSubmit={submit} data-tour="signup-form">
          <div className="auth-mobile-brand"><Logo /> <b>EPRI</b></div>
          <h2>{title}</h2>
          <p className="small muted" style={{ marginTop: 4 }}>
            {mode === "signup" ? "Free for 30 days. No card needed." : mode === "signin" ? "Sign in to your workspace." : "We'll email you a link to set a new one."}
          </p>
          {tour && <div style={{ marginTop: 14 }}><Alert level="info" title="Guided tour" detail="Nothing here creates a real account — the details are sample data." /></div>}

          {mode !== "reset" && (
            <>
              <button type="button" className="btn google" onClick={google} disabled={busy || tour}>
                <Google /> Continue with Google
              </button>
              <div className="or"><span>or with email</span></div>
            </>
          )}

          <div className="stack" style={{ gap: 12 }}>
            {mode === "signup" && (
              <label className="field">
                <span>Your name</span>
                <input className="input" value={f.name} onChange={set("name")} autoComplete="name" required data-tour="signup-name" />
              </label>
            )}
            <label className="field">
              <span>Work email</span>
              <input className="input" type="email" value={f.email} onChange={set("email")} autoComplete="email" required data-tour="signup-email" />
            </label>
            {mode !== "reset" && (
              <label className="field">
                <span className="row between">
                  Password
                  {mode === "signin" && <Link to="/reset" className="xs">Forgot?</Link>}
                </span>
                <input className="input" type="password" value={f.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : undefined} data-tour="signup-password" />
              </label>
            )}
          </div>

          {err && <div style={{ marginTop: 14 }}><Alert level="critical" title={err} /></div>}
          {info && <div style={{ marginTop: 14 }}><Alert level="good" title={info} /></div>}

          <button className="btn primary lg" style={{ width: "100%", marginTop: 18 }} disabled={busy} data-tour="signup-submit">
            {busy ? <span className="spinner" /> : null}
            {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
          </button>

          <p className="small muted" style={{ marginTop: 16, textAlign: "center" }}>
            {mode === "signup" ? <>Already have an account? <Link to="/signin">Sign in</Link></> : mode === "signin" ? <>New to EPRI? <Link to="/signup">Create an account</Link></> : <Link to="/signin">Back to sign in</Link>}
          </p>
          <p className="xs muted auth-fine">
            <Icon name="shield" size={12} /> Sign-in is handled by Google Firebase: passwords are never stored by EPRI, and repeated wrong guesses are blocked automatically.
          </p>
        </form>
      </div>
    </div>
  );
}
