import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Stat, Pill, Seg, Empty } from "../components/UI.jsx";
import { HBar, ProfitBars } from "../components/Charts.jsx";
import { Icon } from "../components/Icons.jsx";
import { EXPENSE_CATEGORIES } from "../lib/industries.js";
import { money, pct, signedPct, monthLabel } from "../lib/format.js";
import { toCSV, download } from "../lib/parse.js";

export default function Reports() {
  const { state, analysis: a, currency, allowed } = useStore();
  const [view, setView] = useState("month");
  const [sel, setSel] = useState(a.rows[a.rows.length - 1]?.month);
  if (a.empty) return <Card><Empty title="No data yet">Upload data to generate reports.</Empty></Card>;

  return (
    <>
      <PageHead title="Reports" subtitle="Monthly profit reports and a 12-month profit & loss statement.">
        <Seg value={view} onChange={setView} options={[{ value: "month", label: "Monthly report" }, { value: "pl", label: "12-month P&L" }]} />
        <button className="btn" onClick={() => window.print()}><Icon name="printer" size={16} /> Print</button>
      </PageHead>
      {view === "month" ? <MonthReport a={a} state={state} sel={sel} setSel={setSel} currency={currency} canExport={allowed("data.export")} /> : <PL a={a} currency={currency} canExport={allowed("data.export")} company={state.company.name} />}
    </>
  );
}

function MonthReport({ a, state, sel, setSel, currency }) {
  const idx = a.rows.findIndex((r) => r.month === sel);
  const m = a.rows[idx];
  const prev = a.rows[idx - 1];
  const hist = a.rows.slice(Math.max(0, idx - 12), idx);
  const avg = (k) => (hist.length ? hist.reduce((s, r) => s + (r[k] || 0), 0) / hist.length : null);
  const budgets = state.budgets || {};

  const lines = useMemo(
    () =>
      EXPENSE_CATEGORIES.map((c) => {
        const v = m[c.key] || 0;
        const p = prev?.[c.key];
        const monthlyBudget = budgets[c.key] ? budgets[c.key] / 12 : null;
        const vsBudget = monthlyBudget ? v / monthlyBudget - 1 : null;
        const status = vsBudget == null ? "none" : vsBudget > 0.1 ? "over" : vsBudget > 0 ? "watch" : "ok";
        return { ...c, v, p, change: p ? (v - p) / p : null, avg: avg(c.key), monthlyBudget, vsBudget, status, share: m.revenue ? v / m.revenue : null };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, state],
  );
  const overs = lines.filter((l) => l.status === "over");

  const summary = [
    `${state.company.name} ${m.profit >= 0 ? "made a profit" : "made a loss"} of ${money(Math.abs(m.profit), currency)} in ${monthLabel(m.month, "long")} on ${money(m.revenue, currency)} of revenue.`,
    prev && `Compared with ${monthLabel(prev.month, "long")}, revenue ${m.revenue >= prev.revenue ? "rose" : "fell"} ${pct(Math.abs((m.revenue - prev.revenue) / prev.revenue))} and spending ${m.expenses >= prev.expenses ? "rose" : "fell"} ${pct(Math.abs((m.expenses - prev.expenses) / prev.expenses))}.`,
    overs.length ? `Over the monthly budget: ${overs.map((o) => `${o.label} (${signedPct(o.vsBudget)})`).join(", ")}.` : "Every category came in within its monthly budget.",
  ].filter(Boolean);

  return (
    <>
      <div className="row wrap no-print">
        <label className="row small">
          <span className="muted">Month</span>
          <select className="input" style={{ width: "auto" }} value={sel} onChange={(e) => setSel(e.target.value)}>
            {[...a.rows].reverse().map((r) => <option key={r.month} value={r.month}>{monthLabel(r.month, "long")}</option>)}
          </select>
        </label>
      </div>
      <Card>
        <div className="row between wrap">
          <div>
            <div className="small muted">Monthly financial report</div>
            <h2 style={{ fontSize: 24, marginTop: 2 }}>{monthLabel(m.month, "long")}</h2>
          </div>
          <Pill level={m.profit >= 0 ? "good" : "critical"}>{m.profit >= 0 ? "✓ Profitable" : "! Loss"}</Pill>
        </div>
        <div className="stack" style={{ marginTop: 14, gap: 6 }}>
          {summary.map((s) => <p key={s} className="text-2">{s}</p>)}
        </div>
      </Card>
      <div className="grid g4">
        <Stat label="Revenue" value={money(m.revenue, currency)} delta={prev ? (m.revenue - prev.revenue) / prev.revenue : undefined} />
        <Stat label="Expenses" value={money(m.expenses, currency)} delta={prev ? (m.expenses - prev.expenses) / prev.expenses : undefined} invert />
        <Stat label="Net profit" value={money(m.profit, currency)} sub={`${pct(m.margin)} margin`} />
        <Stat label="vs 12-month average" value={avg("profit") != null ? money(m.profit - avg("profit"), currency) : "—"} sub="profit above / below average" />
      </div>
      <div className="grid g3">
        <Card title="Spending by category" subtitle="This month vs last month, average and budget" className="span2" flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="r">This month</th>
                  <th className="r">Last month</th>
                  <th className="r">Change</th>
                  <th className="r">Monthly budget</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.key}>
                    <td><b>{l.label}</b><div className="xs muted">{pct(l.share)} of revenue</div></td>
                    <td className="r">{money(l.v, currency)}</td>
                    <td className="r">{l.p != null ? money(l.p, currency) : "—"}</td>
                    <td className="r" style={{ color: l.change > 0.15 ? "var(--critical-ink)" : undefined }}>{signedPct(l.change)}</td>
                    <td className="r">{l.monthlyBudget ? money(l.monthlyBudget, currency) : "—"}</td>
                    <td>
                      {l.status === "over" && <Pill level="critical">! Over {pct(l.vsBudget, 0)}</Pill>}
                      {l.status === "watch" && <Pill level="warning">! Slightly over</Pill>}
                      {l.status === "ok" && <Pill level="good">✓ On budget</Pill>}
                      {l.status === "none" && <span className="muted xs">No budget</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="r">{money(m.expenses, currency)}</td>
                  <td className="r">{prev ? money(prev.expenses, currency) : "—"}</td>
                  <td className="r">{prev ? signedPct((m.expenses - prev.expenses) / prev.expenses) : "—"}</td>
                  <td className="r">{money(Object.values(budgets).reduce((s, b) => s + (b || 0), 0) / 12, currency)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
        <Card title="Spending mix" subtitle={monthLabel(m.month, "long")}>
          <HBar items={lines.map((l) => ({ label: l.label, value: l.v })).sort((x, y) => y.value - x.value)} label="Spent" currency={currency} />
        </Card>
      </div>
    </>
  );
}

function PL({ a, currency, canExport, company }) {
  const rows = a.last12;
  const cols = ["revenue", ...EXPENSE_CATEGORIES.map((c) => c.key), "expenses", "profit"];
  const labels = { revenue: "Revenue", expenses: "Total expenses", profit: "Net profit", ...Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.key, c.label])) };
  const exportCSV = () => {
    const csv = toCSV(rows, [{ key: "month", label: "Month" }, ...cols.map((k) => ({ key: k, label: labels[k], value: (r) => Math.round(r[k]) })), { label: "Margin", value: (r) => (r.margin * 100).toFixed(1) + "%" }]);
    download(`${company.replace(/\W+/g, "-")}-profit-and-loss.csv`, csv);
  };
  return (
    <>
      <Card title="Profit & loss — last 12 months" action={canExport && <button className="btn sm" onClick={exportCSV}><Icon name="download" size={15} /> Export CSV</button>} flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th />
                {rows.map((r) => <th key={r.month} className="r">{monthLabel(r.month)}</th>)}
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {cols.map((k) => (
                <tr key={k} style={k === "expenses" || k === "profit" ? { fontWeight: 700 } : undefined}>
                  <td style={{ whiteSpace: "nowrap", paddingLeft: EXPENSE_CATEGORIES.some((c) => c.key === k) ? 28 : 14 }}>{labels[k]}</td>
                  {rows.map((r) => (
                    <td key={r.month} className="r" style={k === "profit" && r.profit < 0 ? { color: "var(--critical-ink)" } : undefined}>
                      {money(r[k], currency, { compact: true })}
                    </td>
                  ))}
                  <td className="r"><b>{money(rows.reduce((s, r) => s + r[k], 0), currency, { compact: true })}</b></td>
                </tr>
              ))}
              <tr>
                <td>Net margin</td>
                {rows.map((r) => <td key={r.month} className="r muted">{pct(r.margin, 0)}</td>)}
                <td className="r"><b>{pct(a.totals.margin)}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Net profit by month">
        <ProfitBars rows={rows} currency={currency} />
      </Card>
    </>
  );
}
