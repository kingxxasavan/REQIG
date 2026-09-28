import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Stat, Pill, Meter, NumInput, ReadOnly, Alert } from "../components/UI.jsx";
import { MultiLine } from "../components/Charts.jsx";
import { Icon } from "../components/Icons.jsx";
import { EXPENSE_CATEGORIES } from "../lib/industries.js";
import { fiscalYearRows } from "../lib/analytics.js";
import { money, pct, monthLabel } from "../lib/format.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Budget() {
  const { state, analysis: a, currency, allowed, update, toast } = useStore();
  const canEdit = allowed("budget.edit");
  const [draft, setDraft] = useState(null);
  const [focus, setFocus] = useState("marketing");
  const budgets = draft || state.budgets || {};
  const fyStart = state.company.fiscalStart || 1;
  const fy = fiscalYearRows(a.rows, fyStart);

  const totalBudget = Object.values(state.budgets || {}).reduce((s, v) => s + (v || 0), 0);
  const totalActual = a.budgets.reduce((s, b) => s + b.actual, 0);
  const totalProjected = a.budgets.reduce((s, b) => s + b.projected, 0);

  const save = () => {
    update("budget.edit", (s) => (s.budgets = draft), "Updated annual budgets");
    setDraft(null);
    toast("Budgets saved", "good");
  };
  const suggest = () => {
    const last = a.last12;
    setDraft(Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.key, Math.round((last.reduce((s, r) => s + r[c.key], 0) / last.length) * 12)])));
  };

  const cat = EXPENSE_CATEGORIES.find((c) => c.key === focus);
  const monthlyBudget = (state.budgets?.[focus] || 0) / 12;
  let cum = 0;

  return (
    <>
      <PageHead title="Budget & spending" subtitle={`Annual budgets against actual spending for the fiscal year starting ${MONTHS[fyStart - 1]} (${fy.length} of 12 months in).`}>
        {canEdit && !draft && <button className="btn" onClick={() => setDraft({ ...(state.budgets || {}) })}><Icon name="edit" size={16} /> Edit budgets</button>}
        {canEdit && draft && (
          <>
            <button className="btn ghost" onClick={suggest}>Suggest from last 12 months</button>
            <button className="btn" onClick={() => setDraft(null)}>Cancel</button>
            <button className="btn primary" onClick={save}>Save budgets</button>
          </>
        )}
      </PageHead>
      <ReadOnly perm="budget.edit" />

      <div className="grid g4">
        <Stat label="Annual budget" value={money(totalBudget, currency, { compact: true })} sub="all categories" />
        <Stat label="Spent so far" value={money(totalActual, currency, { compact: true })} sub={`${pct(totalBudget ? totalActual / totalBudget : 0, 0)} of annual budget`} />
        <Stat label="Projected year-end" value={money(totalProjected, currency, { compact: true })} sub={totalProjected > totalBudget ? <Pill level="critical">! {money(totalProjected - totalBudget, currency, { compact: true })} over</Pill> : <Pill level="good">✓ Within budget</Pill>} />
        <Stat label="Fiscal year elapsed" value={`${fy.length} / 12`} sub={<Meter value={fy.length} max={12} />} />
      </div>

      {a.budgets.filter((b) => b.status === "over").map((b) => (
        <Alert key={b.key} level="warning" title={`${b.label} is running ${pct(b.pace - 1, 0)} ahead of budget`} detail={`At this pace you'll spend ${money(b.projected, currency)} against ${money(b.annual, currency)} — ${money(b.projected - b.annual, currency)} over. Remaining this year: ${money(Math.max(0, b.remaining), currency)}.`} />
      ))}

      <Card title="Budget vs actual" subtitle="The marker shows where spending should be by now" flush tour="budget-table">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="r">Annual budget</th>
                <th className="r">Spent (YTD)</th>
                <th style={{ minWidth: 180 }}>Pace</th>
                <th className="r">Projected</th>
                <th className="r">Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {a.budgets.map((b) => (
                <tr key={b.key} onClick={() => setFocus(b.key)} style={{ cursor: "pointer", background: focus === b.key ? "var(--accent-soft)" : undefined }}>
                  <td><b>{b.label}</b></td>
                  <td className="r">
                    {draft ? <NumInput value={budgets[b.key] || 0} onChange={(v) => setDraft({ ...draft, [b.key]: v })} min={0} style={{ width: 120 }} onClick={(e) => e.stopPropagation()} aria-label={`${b.label} budget`} /> : b.annual ? money(b.annual, currency) : "—"}
                  </td>
                  <td className="r">{money(b.actual, currency)}</td>
                  <td>{b.annual ? <Meter value={b.actual} max={b.annual} mark={b.prorated} level={b.status === "over" ? "critical" : b.status === "watch" ? "warning" : "good"} /> : <span className="xs muted">Set a budget</span>}</td>
                  <td className="r">{money(b.projected, currency)}</td>
                  <td className="r" style={{ color: b.remaining < 0 ? "var(--critical-ink)" : undefined }}>{b.annual ? money(b.remaining, currency) : "—"}</td>
                  <td>
                    {b.status === "over" && <Pill level="critical">! Over pace</Pill>}
                    {b.status === "watch" && <Pill level="warning">! Watch</Pill>}
                    {b.status === "ok" && <Pill level="good">✓ On track</Pill>}
                    {b.status === "none" && <span className="xs muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`${cat.label}: cumulative spend vs budget`} subtitle="Click a row above to switch category">
        <MultiLine
          currency={currency}
          labels={fy.map((r) => monthLabel(r.month))}
          series={[
            { label: "Actual (cumulative)", data: fy.map((r) => (cum += r[focus] || 0)), slot: 0 },
            { label: "Budget (cumulative)", data: fy.map((_, i) => monthlyBudget * (i + 1)), slot: 1 },
          ]}
          dashedIndex={[1]}
        />
      </Card>
    </>
  );
}
