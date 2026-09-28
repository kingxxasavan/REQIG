import { useEffect } from "react";
import { Icon } from "./Icons.jsx";
import { useStore } from "../lib/store.jsx";
import { ROLES } from "../lib/rbac.js";

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="row wrap no-print">{children}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = "", flush, tour }) {
  return (
    <section className={`card ${flush ? "flush" : ""} ${className}`} data-tour={tour}>
      {(title || action) && (
        <div className="card-head" style={flush ? { padding: "18px 20px 0" } : undefined}>
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Delta({ value, invert = false, suffix = "vs last month" }) {
  if (value == null || !Number.isFinite(value)) return null;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <>
      <span className={`delta ${good ? "up" : "down"}`}>
        {value >= 0 ? "▲" : "▼"} {Math.abs(value * 100).toFixed(1)}%
      </span>
      <span>{suffix}</span>
    </>
  );
}

export function Stat({ label, value, sub, delta, invert, icon, spark, sparkColor }) {
  return (
    <div className="card stat">
      <div className="label">
        {icon && <Icon name={icon} size={15} />}
        {label}
      </div>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="value">{value}</div>
        {spark && <Sparkline values={spark} color={sparkColor} />}
      </div>
      <div className="sub">
        {delta !== undefined && <Delta value={delta} invert={invert} />}
        {sub}
      </div>
    </div>
  );
}

export function Sparkline({ values, color = "var(--s1)", width = 84, height = 30 }) {
  if (!values?.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 3 - ((v - min) / span) * (height - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}

const LEVEL_ICON = { critical: "!", warning: "!", good: "✓", info: "i" };
const LEVEL_LABEL = { critical: "Critical", warning: "Warning", good: "Good", info: "Info" };

export function Pill({ level = "", children, dot }) {
  return (
    <span className={`pill ${level}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function StatusPill({ level }) {
  return (
    <Pill level={level}>
      <span aria-hidden="true">{LEVEL_ICON[level]}</span> {LEVEL_LABEL[level]}
    </Pill>
  );
}

export function Alert({ level, title, detail }) {
  return (
    <div className={`alert ${level}`} role={level === "critical" ? "alert" : undefined}>
      <div className="ico" aria-label={LEVEL_LABEL[level]}>
        {LEVEL_ICON[level]}
      </div>
      <div>
        <h4>{title}</h4>
        {detail && <p>{detail}</p>}
      </div>
    </div>
  );
}

export function Meter({ value, max = 1, level, mark }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`meter ${level || ""}`} role="meter" aria-valuenow={Math.round(w)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${w}%` }} />
      {mark != null && <span className="mark" style={{ left: `${Math.min(100, (mark / max) * 100)}%` }} />}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { maxWidth: 760 } : undefined}>
        <header>
          <h3>{title}</h3>
          <button className="btn ghost icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)} role="tab" aria-selected={value === o.value}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }) {
  return <button className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label} />;
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// Shown on pages the current role can see but not change.
export function ReadOnly({ perm }) {
  const { allowed, role } = useStore();
  if (allowed(perm)) return null;
  return (
    <div className="readonly-banner">
      <Icon name="eye" size={16} /> You're viewing as {ROLES[role].label} — this page is read-only for your role.
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.level}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function NumInput({ value, onChange, prefix, suffix, step = "any", min, disabled, ...rest }) {
  const input = (
    <input
      className="input num"
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      disabled={disabled}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      {...rest}
    />
  );
  if (!prefix && !suffix) return input;
  return (
    <div className="input-group">
      {prefix && <span className="addon">{prefix}</span>}
      {input}
      {suffix && <span className="addon">{suffix}</span>}
    </div>
  );
}
