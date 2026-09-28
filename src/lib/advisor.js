import { EXPENSE_CATEGORIES, getIndustry } from "./industries.js";
import { money, pct, monthLabel } from "./format.js";

// The built-in advisor: deterministic answers from the analysis. Used when
// the AI endpoint isn't configured, and as a fallback if it fails.
// When a question doesn't name a topic, answer about the page it was asked
// from — "is this bad?" on the Budget page means the budget.
const PAGE_TOPIC = {
  budget: "where can I cut costs",
  inventory: "which supplier is costing us",
  complaints: "complaints",
  pricing: "pricing",
  payroll: "payroll",
  planner: "forecast next quarter",
  data: "how did we do last month",
  reports: "how did we do last month",
  dashboard: "how did we do last month",
};

export function localAnswer(q, a, state, cur, page) {
  const s = q.toLowerCase();
  const f = (n) => money(n, cur);
  const L = a.latest;
  // Whole words only: "bad" is not "ad", "current" is not "rent".
  const SYN = {
    production: /\b(production|materials?|supplies|supply|cogs|ingredients?|stock)\b/,
    operations: /\b(operations?|rent|utilit(y|ies)|overheads?|software|insurance)\b/,
    payroll: /\b(payroll|salar(y|ies)|wages?|labou?r|staff costs?)\b/,
    marketing: /\b(marketing|advertising|adverts?|ads?|promotions?)\b/,
    other: /\b(other|misc|miscellaneous)\s+(costs?|spending|expenses?)\b/,
  };
  const cat = EXPENSE_CATEGORIES.find((c) => SYN[c.key]?.test(s));

  if (/supplier|damag|return|defect/.test(s)) {
    const sc = [...a.scorecards].sort((x, y) => y.damageCost + y.returnCost - (x.damageCost + x.returnCost));
    if (!sc.length) return "You haven't added any suppliers yet. Add them under Suppliers & inventory, then log damaged stock and returns — I'll score each supplier by what they cost you.";
    const w = sc[0];
    return `${w.name} is costing you the most: ${f(w.damageCost)} in damaged stock and ${f(w.returnCost)} in refunds, with a ${pct(w.defectRate)} defect rate and ${pct(w.onTimeRate, 0)} on-time delivery (score ${w.score}/100). ${w.score < 60 ? "Worth getting quotes from an alternative — or negotiating credit for damaged deliveries." : "Not alarming yet, but keep logging damages so the trend is visible."}`;
  }
  if (/complain/.test(s)) {
    const c = a.cstats;
    if (!c.total) return "No complaints logged yet. Recording each one with what it cost to fix turns customer problems into numbers you can act on.";
    const top = c.byCat[0];
    return `You've logged ${c.total} complaints (${c.open} still open) costing ${f(c.cost)} to resolve. The most expensive category is "${top.category}" at ${f(top.cost)} across ${top.count} complaint(s)${c.avgDays != null ? `. Average time to resolve: ${c.avgDays.toFixed(1)} days` : ""}.`;
  }
  if (/hire|afford|new (employee|staff)|headcount/.test(s)) {
    const p3 = a.rows.slice(-3).reduce((t, r) => t + r.profit, 0) / 3;
    if (p3 <= 0) return `Not right now. You've averaged a ${f(p3)} monthly result over the last three months, so a new salary would deepen the loss. Fix the margin first — see "Where can I cut costs?".`;
    const safe = p3 * 0.6 * 12;
    return `You've averaged ${f(p3)} profit a month over the last three months. Keeping a 40% cushion, you could afford roughly ${f(safe)} a year in total employment cost (salary plus about 20% for taxes and benefits → a salary around ${f(safe / 1.2)}). Check the forecast first: ${a.forecast.some((x) => x.profit < 0) ? "it shows a loss month ahead, so time the hire after that." : "it stays profitable, which supports hiring."}`;
  }
  if (/forecast|next|future|predict|quarter|coming/.test(s)) {
    if (!a.forecast.length) return "I need at least three months of data to forecast.";
    return `Based on your trend and seasonality: ${a.forecast.map((x) => `${monthLabel(x.month, "long")} ≈ ${f(x.revenue)} revenue, ${f(x.profit)} ${x.profit >= 0 ? "profit" : "loss"}`).join("; ")}. Forecasts from one year of history are rough — treat them as a heads-up, not a promise.`;
  }
  if (/cut|save|saving|reduce|lower|too much|overspend/.test(s) && !cat) {
    const over = a.bench.filter((b) => b.status === "over");
    const bo = a.budgets.filter((b) => b.status === "over");
    if (!over.length && !bo.length) return "Nothing stands out — every category is within its budget and the normal range for your industry. Savings from here come from renegotiating your largest contracts (usually rent and suppliers).";
    return [
      ...over.map((b) => `${b.label} is ${pct(b.share)} of revenue vs a typical ${pct(b.lo, 0)}–${pct(b.hi, 0)}; getting to ${pct(b.hi, 0)} saves about ${f((b.share - b.hi) * a.totals.revenue / 12)} a month.`),
      ...bo.map((b) => `${b.label} is running at ${pct(b.pace, 0)} of its budget pace — on track to spend ${f(b.projected)} vs ${f(b.annual)} planned.`),
    ].join(" ");
  }
  if (cat) {
    const k = cat.key;
    const avg = a.last12.slice(0, -1).reduce((t, r) => t + r[k], 0) / Math.max(1, a.last12.length - 1);
    const b = a.bench.find((x) => x.key === k);
    const bs = a.budgets.find((x) => x.key === k);
    return `${cat.label}: ${f(L[k])} in ${monthLabel(L.month, "long")} vs a ${f(avg)} monthly average (${L[k] > avg ? "+" : ""}${pct((L[k] - avg) / avg)}). ${b ? `That's ${pct(b.share)} of revenue over the last three months; typical for your industry is ${pct(b.lo, 0)}–${pct(b.hi, 0)}${b.status === "over" ? " — you're above range" : ""}.` : ""} ${bs?.annual ? `Budget: ${f(bs.actual)} of ${f(bs.annual)} used (${pct(bs.pace, 0)} of pace).` : ""}`;
  }
  if (/profit|made|earn|how (did|are) we|last month|doing/.test(s)) {
    return `${monthLabel(L.month, "long")}: ${f(L.revenue)} revenue, ${f(L.expenses)} expenses, ${f(L.profit)} ${L.profit >= 0 ? "profit" : "loss"} (${pct(L.margin)} margin). Over 12 months you've made ${f(a.totals.profit)} on ${f(a.totals.revenue)}. Health score: ${a.health.score}/100 (${a.health.grade}).`;
  }
  if (/price|pricing|charge/.test(s)) {
    return `Your net margin is ${pct(a.totals.margin)} (typical for ${getIndustry(state.company.industry).label}: ${pct(getIndustry(state.company.industry).benchmarks.netMargin[0], 0)}–${pct(getIndustry(state.company.industry).benchmarks.netMargin[1], 0)}). Use the Pricing Studio to cost each product from its materials — a 3–5% price rise on your best sellers often does more for profit than cutting costs.`;
  }
  if (page && PAGE_TOPIC[page]) return localAnswer(PAGE_TOPIC[page], a, state, cur);
  return a.insights.slice(0, 3).join(" ");
}
