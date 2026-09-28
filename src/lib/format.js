const CURRENCY_LOCALE = { USD: "en-US", CAD: "en-CA", GBP: "en-GB", EUR: "de-DE", AUD: "en-AU", INR: "en-IN" };

export function money(n, currency = "USD", opts = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  const compact = opts.compact && Math.abs(n) >= 10_000;
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] || "en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : opts.cents ? 2 : 0,
    minimumFractionDigits: opts.cents && !compact ? 2 : 0,
  }).format(n);
}

export const pct = (n, digits = 1) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(digits)}%`);
export const signedPct = (n, digits = 1) => (n == null || !Number.isFinite(n) ? "—" : `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`);
export const num = (n, digits = 0) => (n == null || Number.isNaN(n) ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: digits }));

export function monthLabel(key, style = "short") {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-US", { month: style, year: style === "long" ? "numeric" : "2-digit", timeZone: "UTC" });
}

export function addMonths(key, n) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const today = () => new Date().toISOString().slice(0, 10);
