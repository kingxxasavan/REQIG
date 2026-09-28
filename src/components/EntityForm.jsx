import { Modal, Field, NumInput } from "./UI.jsx";

// A small schema-driven form so each log (suppliers, damages, returns,
// complaints…) doesn't need its own hand-written modal.
export default function EntityForm({ title, fields, value, onChange, onSave, onClose, currency }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const missing = fields.some((f) => f.required && !String(value[f.key] ?? "").trim());
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={missing} onClick={onSave}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            {f.type === "select" ? (
              <select className="input" value={value[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}>
                {f.options.map((o) => (typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            ) : f.type === "number" || f.type === "money" || f.type === "pct" ? (
              <NumInput
                value={f.type === "pct" ? Math.round((value[f.key] ?? 0) * 1000) / 10 : value[f.key] ?? 0}
                onChange={(v) => set(f.key, f.type === "pct" ? v / 100 : v)}
                min={0}
                prefix={f.type === "money" ? currency : undefined}
                suffix={f.type === "pct" ? "%" : f.suffix}
              />
            ) : f.type === "checkbox" ? (
              <label className="row small" style={{ gap: 8, padding: "8px 0" }}>
                <input type="checkbox" checked={!!value[f.key]} onChange={(e) => set(f.key, e.target.checked)} /> {f.checkLabel || "Yes"}
              </label>
            ) : f.type === "textarea" ? (
              <textarea className="input" rows={3} value={value[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            ) : (
              <input className="input" type={f.type || "text"} value={value[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            )}
          </Field>
        ))}
      </div>
    </Modal>
  );
}
