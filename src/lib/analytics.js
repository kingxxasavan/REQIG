// The analytics engine. Pure functions from workspace data to numbers,
// alerts and plain-English insights — no UI, so it can be unit-tested and
// its output handed to the AI advisor as a compact summary.

import { EXPENSE_CATEGORIES, getIndustry } from "./industries.js";
import { addMonths, monthLabel, clamp } from "./format.js";

export const CAT_KEYS = EXPENSE_CATEGORIES.map((c) => c.key);
const catLabel = (k) => EXPENSE_CATEGORIES.find((c) => c.key === k)?.label || k;

const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
const mean = (arr) => (arr.length ? sum(arr) / arr.length : 0);
const std = (arr) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(sum(arr.map((x) => (x - m) ** 2)) / (arr.length - 1));
};
const safeDiv = (a, b) => (b ? a / b : null);

export const expensesOf = (m) => sum(CAT_KEYS.map((k) => m[k]));

export function enrich(months) {
  return [...months]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => {
      const expenses = expensesOf(m);
      const profit = (m.revenue || 0) - expenses;
      return { ...m, expenses, profit, margin: safeDiv(profit, m.revenue) };
    });
}

// Least-squares line through (i, y).
export function linearFit(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 };
  const xs = ys.map((_, i) => i);
  const mx = mean(xs), my = mean(ys);
  const num = sum(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const den = sum(xs.map((x) => (x - mx) ** 2));
  const slope = den ? num / den : 0;
  return { slope, intercept: my - slope * mx };
}

// Trend × damped seasonal index. With a single year of history the seasonal
// index is estimated from how far each calendar month sat from the trend,
// pulled halfway back toward 1 so one odd month doesn't dominate.
export function forecastSeries(rows, field, horizon = 3) {
  const ys = rows.map((r) => r[field] || 0);
  const { slope, intercept } = linearFit(ys);
  const seasonal = {};
  rows.forEach((r, i) => {
    const trend = intercept + slope * i;
    const idx = trend > 0 ? ys[i] / trend : 1;
    seasonal[r.month.slice(5)] = 1 + (idx - 1) * 0.5;
  });
  const last = rows[rows.length - 1]?.month;
  const out = [];
  for (let k = 1; k <= horizon; k++) {
    const month = addMonths(last, k);
    const trend = intercept + slope * (ys.length - 1 + k);
    out.push({ month, value: Math.max(0, trend * (seasonal[month.slice(5)] ?? 1)) });
  }
  return out;
}

export function forecast(rows, horizon = 3) {
  if (rows.length < 3) return [];
  const rev = forecastSeries(rows, "revenue", horizon);
  const exp = forecastSeries(rows, "expenses", horizon);
  return rev.map((r, i) => ({ month: r.month, revenue: r.value, expenses: exp[i].value, profit: r.value - exp[i].value }));
}

// Latest month vs. the months before it, per category. A spike needs both a
// meaningful jump and to sit well outside normal variation.
export function detectAnomalies(rows, lookback = 6) {
  if (rows.length < 4) return [];
  const latest = rows[rows.length - 1];
  const history = rows.slice(-1 - lookback, -1);
  const found = [];
  for (const k of [...CAT_KEYS, "revenue"]) {
    const hist = history.map((r) => r[k] || 0);
    const avg = mean(hist);
    if (!avg) continue;
    const sd = std(hist) || avg * 0.05;
    const change = (latest[k] - avg) / avg;
    const z = (latest[k] - avg) / sd;
    if (k === "revenue") {
      if (change < -0.15 && z < -1.5) found.push({ key: k, label: "Revenue", change, z, value: latest[k], avg, direction: "down" });
    } else if (change > 0.2 && z > 1.5) {
      found.push({ key: k, label: catLabel(k), change, z, value: latest[k], avg, direction: "up" });
    }
  }
  return found;
}

// Months of the current fiscal year that have data, given the first month.
export function fiscalYearRows(rows, fiscalStartMonth = 1) {
  if (!rows.length) return [];
  const last = rows[rows.length - 1].month;
  let [y, m] = last.split("-").map(Number);
  if (m < fiscalStartMonth) y -= 1;
  const start = `${y}-${String(fiscalStartMonth).padStart(2, "0")}`;
  return rows.filter((r) => r.month >= start && r.month <= last);
}

export function budgetStatus(rows, budgets = {}, fiscalStartMonth = 1) {
  const fy = fiscalYearRows(rows, fiscalStartMonth);
  const elapsed = fy.length;
  return CAT_KEYS.map((k) => {
    const annual = Number(budgets[k]) || 0;
    const actual = sum(fy.map((r) => r[k]));
    const prorated = (annual / 12) * elapsed;
    const pace = safeDiv(actual, prorated);
    const projected = elapsed ? (actual / elapsed) * 12 : 0;
    let status = "none";
    if (annual) status = pace > 1.1 ? "over" : pace > 1.0 ? "watch" : "ok";
    return { key: k, label: catLabel(k), annual, actual, prorated, pace, projected, remaining: annual - actual, status, elapsed };
  });
}

export function benchmarkCompare(rows, industryKey) {
  const ind = getIndustry(industryKey);
  const recent = rows.slice(-3);
  const rev = sum(recent.map((r) => r.revenue));
  return CAT_KEYS.filter((k) => ind.benchmarks[k]).map((k) => {
    const share = safeDiv(sum(recent.map((r) => r[k])), rev);
    const [lo, hi] = ind.benchmarks[k];
    const status = share == null ? "none" : share > hi ? "over" : share < lo ? "under" : "within";
    return { key: k, label: catLabel(k), share, lo, hi, status };
  });
}

export function supplierScorecards(state) {
  const { suppliers = [], inventory = [], damages = [], returns = [] } = state;
  return suppliers.map((s) => {
    const items = inventory.filter((i) => i.supplierId === s.id);
    const itemIds = new Set(items.map((i) => i.id));
    const dmg = damages.filter((d) => itemIds.has(d.itemId));
    const ret = returns.filter((r) => itemIds.has(r.itemId));
    const damagedUnits = sum(dmg.map((d) => d.qty));
    const damageCost = sum(dmg.map((d) => d.qty * (items.find((i) => i.id === d.itemId)?.unitCost || 0)));
    const returnCost = sum(ret.map((r) => r.refund));
    const received = sum(items.map((i) => i.received || i.qty));
    const defectRate = safeDiv(damagedUnits, received) ?? 0;
    const onTime = Number(s.onTimeRate ?? 0.9);
    const score = Math.round(clamp(100 - defectRate * 400 - (1 - onTime) * 80 - (returnCost + damageCost) / 200, 0, 100));
    return { ...s, items: items.length, damagedUnits, damageCost, returnCost, defectRate, score };
  });
}

export function complaintStats(complaints = []) {
  const byCat = {};
  for (const c of complaints) {
    byCat[c.category] = byCat[c.category] || { count: 0, cost: 0 };
    byCat[c.category].count++;
    byCat[c.category].cost += Number(c.cost) || 0;
  }
  const resolved = complaints.filter((c) => c.status === "resolved");
  const days = resolved.filter((c) => c.resolvedOn).map((c) => (new Date(c.resolvedOn) - new Date(c.date)) / 86_400_000);
  return {
    total: complaints.length,
    open: complaints.filter((c) => c.status !== "resolved").length,
    cost: sum(complaints.map((c) => c.cost)),
    avgDays: days.length ? mean(days) : null,
    byCat: Object.entries(byCat).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.cost - a.cost),
  };
}

// The full picture. Everything the dashboard, reports and advisor show comes
// out of this one call.
export function analyze(state) {
  const company = state.company || {};
  const rows = enrich(state.months || []);
  const cur = company.currency || "USD";
  if (!rows.length) return { rows, empty: true, alerts: [], insights: [], health: null };

  const last12 = rows.slice(-12);
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const totals = {
    revenue: sum(last12.map((r) => r.revenue)),
    expenses: sum(last12.map((r) => r.expenses)),
  };
  totals.profit = totals.revenue - totals.expenses;
  totals.margin = safeDiv(totals.profit, totals.revenue);
  const mom = prev
    ? {
        revenue: safeDiv(latest.revenue - prev.revenue, prev.revenue),
        expenses: safeDiv(latest.expenses - prev.expenses, prev.expenses),
        profit: prev.profit ? (latest.profit - prev.profit) / Math.abs(prev.profit) : null,
      }
    : {};

  const r3 = rows.slice(-3), p3 = rows.slice(-6, -3);
  const growth3 = p3.length === 3 ? safeDiv(sum(r3.map((r) => r.revenue)) - sum(p3.map((r) => r.revenue)), sum(p3.map((r) => r.revenue))) : null;

  const anomalies = detectAnomalies(rows);
  const budgets = budgetStatus(rows, state.budgets, company.fiscalStart || 1);
  const bench = benchmarkCompare(rows, company.industry);
  const fc = forecast(last12, 3);
  const ind = getIndustry(company.industry);

  const avgNet3 = mean(r3.map((r) => r.profit));
  const cash = Number(company.cashOnHand) || 0;
  const runway = cash && avgNet3 < 0 ? cash / -avgNet3 : null;

  const scorecards = supplierScorecards(state);
  const cstats = complaintStats(state.complaints);
  const qualityCost = sum(scorecards.map((s) => s.damageCost + s.returnCost)) + cstats.cost;

  // Health score: five weighted components, each 0..1.
  const [mLo, mHi] = ind.benchmarks.netMargin;
  const comp = {
    profitability: clamp(((totals.margin ?? 0) - (mLo - 0.1)) / (mHi - (mLo - 0.1)), 0, 1),
    growth: growth3 == null ? 0.6 : clamp(0.5 + growth3 * 3, 0, 1),
    spending: 1 - bench.filter((b) => b.status === "over").length / Math.max(1, bench.length),
    budget: budgets.some((b) => b.annual) ? 1 - budgets.filter((b) => b.status === "over").length / budgets.filter((b) => b.annual).length : 0.7,
    stability: clamp(1 - std(last12.map((r) => r.profit)) / Math.max(1, mean(last12.map((r) => r.revenue))) * 2, 0, 1),
  };
  const weights = { profitability: 0.3, growth: 0.2, spending: 0.2, budget: 0.15, stability: 0.15 };
  const score = Math.round(100 * sum(Object.keys(weights).map((k) => comp[k] * weights[k])));
  const health = {
    score,
    grade: score >= 80 ? "Excellent" : score >= 65 ? "Healthy" : score >= 50 ? "Needs attention" : "At risk",
    level: score >= 65 ? "good" : score >= 50 ? "warning" : "critical",
    components: comp,
  };

  const alerts = buildAlerts({ latest, prev, mom, anomalies, budgets, bench, runway, fc, totals, cstats, scorecards, cur, ind });
  const insights = buildInsights({ latest, prev, totals, growth3, bench, fc, anomalies, budgets, ind, qualityCost, cur });

  return { rows, last12, latest, prev, totals, mom, growth3, anomalies, budgets, bench, forecast: fc, runway, health, alerts, insights, scorecards, cstats, qualityCost, empty: false };
}

const fmt = (n, cur) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(Math.round(n));
const p = (n) => `${Math.round(n * 100)}%`;

function buildAlerts({ latest, mom, anomalies, budgets, bench, runway, fc, cstats, scorecards, cur }) {
  const a = [];
  const mName = monthLabel(latest.month, "long");
  if (latest.profit < 0) {
    a.push({ level: "critical", title: `Loss in ${mName}`, detail: `Expenses exceeded revenue by ${fmt(-latest.profit, cur)}.` });
  }
  if (runway != null && runway < 6) {
    a.push({ level: "critical", title: `Cash runway: ${runway.toFixed(1)} months`, detail: "At the current burn rate, cash on hand runs out soon. Cut discretionary spend or arrange financing now." });
  }
  for (const b of budgets.filter((b) => b.status === "over")) {
    a.push({ level: "warning", title: `${b.label} is ${p(b.pace - 1)} over budget`, detail: `${fmt(b.actual, cur)} spent vs ${fmt(b.prorated, cur)} planned so far this fiscal year. On pace for ${fmt(b.projected, cur)} against a ${fmt(b.annual, cur)} budget.` });
  }
  for (const x of anomalies) {
    if (x.direction === "up") {
      a.push({ level: "warning", title: `${x.label} spending jumped ${p(x.change)}`, detail: `${fmt(x.value, cur)} in ${mName} vs a ${fmt(x.avg, cur)} monthly average.` });
    } else {
      a.push({ level: "critical", title: `Revenue dropped ${p(-x.change)}`, detail: `${fmt(x.value, cur)} in ${mName} vs a ${fmt(x.avg, cur)} monthly average.` });
    }
  }
  for (const b of bench.filter((b) => b.status === "over")) {
    a.push({ level: "warning", title: `${b.label} is ${p(b.share)} of revenue`, detail: `Typical range for your industry is ${p(b.lo)}–${p(b.hi)}.` });
  }
  if (fc.some((f) => f.profit < 0) && latest.profit >= 0) {
    const f = fc.find((f) => f.profit < 0);
    a.push({ level: "warning", title: `Forecast: possible loss in ${monthLabel(f.month, "long")}`, detail: `Projected revenue ${fmt(f.revenue, cur)} vs expenses ${fmt(f.expenses, cur)}. Plan ahead for the seasonal dip.` });
  }
  const badSupplier = scorecards.filter((s) => s.score < 60).sort((x, y) => x.score - y.score)[0];
  if (badSupplier) {
    a.push({ level: "warning", title: `Supplier risk: ${badSupplier.name}`, detail: `${p(badSupplier.defectRate)} defect rate; ${fmt(badSupplier.damageCost + badSupplier.returnCost, cur)} lost to damages and returns.` });
  }
  if (cstats.open >= 3) {
    a.push({ level: "info", title: `${cstats.open} open customer complaints`, detail: `Complaints have cost ${fmt(cstats.cost, cur)} to resolve so far.` });
  }
  if (mom.revenue > 0.05 && latest.profit > 0) {
    a.push({ level: "good", title: `Revenue up ${p(mom.revenue)} month over month`, detail: `${mName} closed with ${fmt(latest.profit, cur)} profit.` });
  }
  if (!a.some((x) => x.level !== "good" && x.level !== "info")) {
    a.push({ level: "good", title: "No spending problems detected", detail: "Every category is within budget and industry range." });
  }
  const order = { critical: 0, warning: 1, info: 2, good: 3 };
  return a.sort((x, y) => order[x.level] - order[y.level]);
}

function buildInsights({ latest, prev, totals, growth3, bench, fc, anomalies, budgets, ind, qualityCost, cur }) {
  const out = [];
  const mName = monthLabel(latest.month, "long");
  out.push(
    `In ${mName} you made ${fmt(latest.revenue, cur)} and spent ${fmt(latest.expenses, cur)}, for a ${latest.profit >= 0 ? "profit" : "loss"} of ${fmt(Math.abs(latest.profit), cur)}${latest.margin != null ? ` (${p(latest.margin)} margin)` : ""}.` +
      (prev ? ` That's ${latest.profit >= prev.profit ? "up" : "down"} ${fmt(Math.abs(latest.profit - prev.profit), cur)} from last month.` : ""),
  );
  out.push(`Over the last 12 months: ${fmt(totals.revenue, cur)} revenue, ${fmt(totals.profit, cur)} net profit, ${p(totals.margin ?? 0)} net margin (typical for ${ind.label.toLowerCase()}: ${p(ind.benchmarks.netMargin[0])}–${p(ind.benchmarks.netMargin[1])}).`);
  if (growth3 != null) {
    out.push(growth3 >= 0 ? `Revenue for the last three months grew ${p(growth3)} over the three months before.` : `Revenue for the last three months fell ${p(-growth3)} compared with the three months before — look at what changed in sales or pricing.`);
  }
  const over = bench.filter((b) => b.status === "over").sort((a, b) => b.share - b.hi - (a.share - a.hi))[0];
  if (over) {
    const excess = (over.share - over.hi) * (totals.revenue / 4);
    out.push(`${over.label} is taking ${p(over.share)} of revenue, above the ${p(over.hi)} ceiling typical for your industry. Bringing it into range would free up roughly ${fmt(excess, cur)} per quarter.`);
  }
  const under = bench.find((b) => b.key === "marketing" && b.status === "under");
  if (under && (growth3 ?? 0) < 0.03) {
    out.push(`Marketing is only ${p(under.share)} of revenue while growth is flat. A modest increase toward ${p(under.lo)} is worth testing — see the Planner for a channel split.`);
  }
  const risky = budgets.filter((b) => b.status === "over" || b.status === "watch");
  if (risky.length) out.push(`Budgets to watch: ${risky.map((b) => `${b.label} (${p(b.pace)} of plan)`).join(", ")}.`);
  if (anomalies.length) out.push(`Unusual this month: ${anomalies.map((a) => `${a.label} ${a.direction === "up" ? "+" : "−"}${p(Math.abs(a.change))}`).join(", ")}. Check for one-off purchases or billing errors.`);
  if (fc.length) {
    const fr = sum(fc.map((f) => f.revenue)), fp = sum(fc.map((f) => f.profit));
    out.push(`Next 3 months forecast: about ${fmt(fr, cur)} revenue and ${fmt(fp, cur)} ${fp >= 0 ? "profit" : "loss"}, based on your trend and seasonality.`);
  }
  if (qualityCost > 0) out.push(`Damaged stock, returns and complaint resolution have cost ${fmt(qualityCost, cur)} — that's money a better supplier or process could keep.`);
  return out;
}

// A compact, number-only summary for the AI advisor. No names or personal
// data leave the browser — only aggregates.
export function advisorSummary(state, a) {
  if (a.empty) return null;
  return {
    industry: getIndustry(state.company?.industry).label,
    employees: state.company?.employees,
    currency: state.company?.currency || "USD",
    months: a.last12.map((r) => ({ month: r.month, revenue: Math.round(r.revenue), expenses: Math.round(r.expenses), ...Object.fromEntries(CAT_KEYS.map((k) => [k, Math.round(r[k] || 0)])) })),
    totals: { revenue: Math.round(a.totals.revenue), profit: Math.round(a.totals.profit), margin: a.totals.margin },
    benchmarks: a.bench.map(({ key, share, lo, hi, status }) => ({ key, share, lo, hi, status })),
    budgets: a.budgets.filter((b) => b.annual).map(({ key, annual, actual, pace, status }) => ({ key, annual, actual: Math.round(actual), pace, status })),
    forecast: a.forecast.map((f) => ({ month: f.month, revenue: Math.round(f.revenue), profit: Math.round(f.profit) })),
    healthScore: a.health.score,
    qualityCost: Math.round(a.qualityCost),
    complaints: { total: a.cstats.total, open: a.cstats.open, cost: Math.round(a.cstats.cost) },
  };
}
