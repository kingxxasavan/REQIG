import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { Icon, Logo } from "./Icons.jsx";

export default function LockScreen() {
  const { unlock, resetWorkspace } = useStore();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await unlock(pw);
    } catch {
      setErr("That passphrase didn't decrypt the workspace.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lock-screen">
      <form className="card lock-card stack" onSubmit={submit} style={{ padding: 28, gap: 16 }}>
        <div className="row">
          <Logo size={36} />
          <div>
            <h2 style={{ fontSize: 20 }}>Workspace locked</h2>
            <p className="small muted">Encrypted with AES-256-GCM on this device</p>
          </div>
        </div>
        <label className="field">
          <span>Passphrase</span>
          <input className="input" type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </label>
        {err && <div className="alert critical"><div className="ico">!</div><div><h4>{err}</h4><p>Check caps lock and try again.</p></div></div>}
        <button className="btn primary lg" disabled={!pw || busy}>
          {busy ? <span className="spinner" /> : <Icon name="lock" />} Unlock
        </button>
        <p className="xs muted">The key is derived from your passphrase with PBKDF2 (310,000 rounds) and never stored. If you forget it, the data can't be recovered — not even by us.</p>
        {confirmReset ? (
          <div className="row wrap">
            <span className="small">Erase this workspace permanently?</span>
            <button type="button" className="btn danger sm" onClick={resetWorkspace}>Erase</button>
            <button type="button" className="btn sm" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="btn ghost sm" onClick={() => setConfirmReset(true)}>Forgot passphrase? Start over</button>
        )}
      </form>
    </div>
  );
}
