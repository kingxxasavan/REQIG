import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Field, NumInput, Alert, Pill, Meter, Modal } from "../components/UI.jsx";
import { Icon } from "../components/Icons.jsx";
import { industryList } from "../lib/industries.js";
import { passphraseStrength, encryptJSON, deriveKey, newSalt, unlockEnvelope } from "../lib/crypto.js";
import { download } from "../lib/parse.js";
import DemoPicker from "../components/DemoPicker.jsx";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Settings() {
  const { state, allowed, update, encrypted, enableEncryption, disableEncryption, lock, resetWorkspace, replaceState, toast } = useStore();
  const nav = useNavigate();
  const canSec = allowed("security.manage");
  const [company, setCompany] = useState(state.company);
  const [pw, setPw] = useState({ p1: "", p2: "" });
  const [confirm, setConfirm] = useState(null);
  const [demo, setDemo] = useState(false);
  const [restore, setRestore] = useState(null);
  const fileRef = useRef();
  const s = passphraseStrength(pw.p1);
  const pwOk = pw.p1.length >= 10 && pw.p1 === pw.p2;

  const saveCompany = () => {
    update("security.manage", (st) => (st.company = { ...company, name: company.name.trim() || st.company.name }), "Updated company profile");
    toast("Company profile saved", "good");
  };
  const turnOn = async () => {
    await enableEncryption(pw.p1);
    update(null, () => {}, "Enabled AES-256-GCM encryption");
    setPw({ p1: "", p2: "" });
    toast("Workspace encrypted", "good");
  };
  const exportBackup = async () => {
    if (!pwOk) return toast("Enter a passphrase (10+ characters, matching) to encrypt the backup.", "critical");
    const salt = newSalt();
    const key = await deriveKey(pw.p1, salt);
    const env = await encryptJSON(state, key, salt);
    download(`epri-backup-${new Date().toISOString().slice(0, 10)}.epri.json`, JSON.stringify({ epriBackup: 1, ...env }), "application/json");
    update(null, () => {}, "Exported encrypted backup");
  };
  const onRestoreFile = async (file) => {
    try {
      const env = JSON.parse(await file.text());
      if (!env.ct || !env.iv || !env.salt) throw new Error();
      setRestore({ env, pass: "", err: "" });
    } catch {
      toast("That isn't an EPRI backup file.", "critical");
    }
  };
  const doRestore = async () => {
    try {
      const { data } = await unlockEnvelope(restore.env, restore.pass);
      if (!data?.company || !Array.isArray(data.months)) throw new Error();
      replaceState(data);
      setRestore(null);
      toast("Backup restored", "good");
    } catch {
      setRestore({ ...restore, err: "Wrong passphrase, or the file is damaged." });
    }
  };

  return (
    <>
      <PageHead title="Security & settings" subtitle="Company profile, encryption, backups and workspace controls." />
      {!canSec && <Alert level="info" title="Only the owner can change these settings" detail="You can see the current security status below." />}

      <div className="grid g2">
        <Card title="Encryption" subtitle="AES-256-GCM · PBKDF2-SHA256 (310,000 rounds)" action={encrypted ? <Pill level="good">✓ Encrypted</Pill> : <Pill level="critical">! Not encrypted</Pill>}>
          {encrypted ? (
            <div className="stack">
              <p className="small text-2">Everything EPRI saves on this device is encrypted. The key exists only in memory while you're signed in — locking or reloading clears it.</p>
              <div className="row wrap">
                <button className="btn" onClick={lock}><Icon name="lock" size={16} /> Lock now</button>
                {canSec && <button className="btn danger" onClick={() => setConfirm("decrypt")}>Turn off encryption</button>}
              </div>
            </div>
          ) : (
            <div className="stack">
              <p className="small text-2">Your workspace is stored in plain text on this device. Set a passphrase to seal it.</p>
              <div className="form-grid">
                <Field label="Passphrase"><input className="input" type="password" value={pw.p1} onChange={(e) => setPw({ ...pw, p1: e.target.value })} disabled={!canSec} autoComplete="new-password" /></Field>
                <Field label="Confirm"><input className="input" type="password" value={pw.p2} onChange={(e) => setPw({ ...pw, p2: e.target.value })} disabled={!canSec} autoComplete="new-password" /></Field>
              </div>
              {pw.p1 && <><Meter value={s.score} max={5} level={s.score >= 4 ? "good" : s.score >= 2 ? "warning" : "critical"} /><span className="xs muted">Strength: {s.label}</span></>}
              <button className="btn primary" style={{ alignSelf: "flex-start" }} disabled={!canSec || !pwOk} onClick={turnOn}><Icon name="shield" size={16} /> Encrypt workspace</button>
            </div>
          )}
        </Card>

        <Card title="Backups" subtitle="Encrypted backup files you can store anywhere" tour="settings-backup">
          <div className="stack">
            <p className="small text-2">Backups are always encrypted with AES-256-GCM. {encrypted ? "Enter a passphrase for the backup file:" : "Use the passphrase fields on the left for the backup."}</p>
            {encrypted && (
              <div className="form-grid">
                <Field label="Backup passphrase"><input className="input" type="password" value={pw.p1} onChange={(e) => setPw({ ...pw, p1: e.target.value })} autoComplete="new-password" /></Field>
                <Field label="Confirm"><input className="input" type="password" value={pw.p2} onChange={(e) => setPw({ ...pw, p2: e.target.value })} autoComplete="new-password" /></Field>
              </div>
            )}
            <div className="row wrap">
              <button className="btn" disabled={!allowed("data.export")} onClick={exportBackup}><Icon name="download" size={16} /> Download encrypted backup</button>
              <button className="btn" disabled={!canSec} onClick={() => fileRef.current.click()}><Icon name="upload" size={16} /> Restore</button>
              <input ref={fileRef} type="file" hidden accept=".json" onChange={(e) => { e.target.files[0] && onRestoreFile(e.target.files[0]); e.target.value = ""; }} />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Company profile" action={canSec && <button className="btn primary sm" onClick={saveCompany}>Save</button>}>
        <div className="form-grid">
          <Field label="Company name"><input className="input" value={company.name} disabled={!canSec} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></Field>
          <Field label="Industry" hint="Changes benchmarks and pricing presets">
            <select className="input" value={company.industry} disabled={!canSec} onChange={(e) => setCompany({ ...company, industry: e.target.value })}>
              {industryList.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
          </Field>
          <Field label="Employees"><NumInput value={company.employees} disabled={!canSec} onChange={(v) => setCompany({ ...company, employees: v })} min={1} /></Field>
          <Field label="Currency">
            <select className="input" value={company.currency} disabled={!canSec} onChange={(e) => setCompany({ ...company, currency: e.target.value })}>
              {["USD", "CAD", "GBP", "EUR", "AUD", "INR"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Fiscal year starts">
            <select className="input" value={company.fiscalStart} disabled={!canSec} onChange={(e) => setCompany({ ...company, fiscalStart: Number(e.target.value) })}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </Field>
          <Field label="Cash in the bank" hint="Used for the cash-runway estimate"><NumInput value={company.cashOnHand || 0} disabled={!canSec} onChange={(v) => setCompany({ ...company, cashOnHand: v })} min={0} prefix={company.currency} /></Field>
        </div>
      </Card>

      <Card title="Workspace">
        <div className="row wrap">
          <button className="btn" onClick={() => setDemo(true)} disabled={!canSec}><Icon name="eye" size={16} /> Load a different sample business</button>
          <button className="btn" onClick={() => nav("/start")} disabled={!canSec}><Icon name="plus" size={16} /> Run onboarding again</button>
          <button className="btn danger" onClick={() => setConfirm("reset")} disabled={!canSec}><Icon name="trash" size={16} /> Delete workspace</button>
        </div>
      </Card>

      {confirm && (
        <Modal
          title={confirm === "reset" ? "Delete this workspace?" : "Turn off encryption?"}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className="btn danger"
                onClick={() => {
                  if (confirm === "reset") {
                    resetWorkspace();
                    nav("/");
                  } else {
                    disableEncryption();
                    update(null, () => {}, "Disabled encryption");
                  }
                  setConfirm(null);
                }}
              >
                {confirm === "reset" ? "Delete everything" : "Turn off"}
              </button>
            </>
          }
        >
          <p className="text-2">{confirm === "reset" ? "All financial data, team members and logs on this device will be permanently erased. Download a backup first if you might need it." : "Your data will be stored unencrypted on this device. Anyone with access to this browser could read it."}</p>
        </Modal>
      )}
      {restore && (
        <Modal title="Restore backup" onClose={() => setRestore(null)} footer={<><button className="btn" onClick={() => setRestore(null)}>Cancel</button><button className="btn primary" onClick={doRestore} disabled={!restore.pass}>Restore</button></>}>
          <p className="small text-2">This replaces the current workspace with the backup.</p>
          <Field label="Backup passphrase"><input className="input" type="password" autoFocus value={restore.pass} onChange={(e) => setRestore({ ...restore, pass: e.target.value, err: "" })} /></Field>
          {restore.err && <Alert level="critical" title={restore.err} />}
        </Modal>
      )}
      {demo && <DemoPicker onClose={() => setDemo(false)} />}
    </>
  );
}
