import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Stat, Seg, Pill, Field, Alert } from "../components/UI.jsx";
import { HBar, ExpenseStack } from "../components/Charts.jsx";
import { AGE_GROUPS, getIndustry, EXPENSE_CATEGORIES } from "../lib/industries.js";
import { channelSplit } from "../lib/planner.js";
import { forecast, CAT_KEYS } from "../lib/analytics.js";
import { money, pct, monthLabel } from "../lib/format.js";

const STANCES = { conservative: 0, balanced: 0.5, growth: 1 };

export default function Planner() {
  const { state, analysis: a, currency, allowed, update } = useStore();
  const [stance, setStance] = useState("balanced");
  const [horizon, setHorizon] = useState(6);
  const canEdit = allowed("budget.edit");
  const ind = getIndustry(state.company.industry);
  const demo = state.demographics || { customerType: "B2C", reach: "Local", ages: { "18-24": 20, "25-34": 20, "35-44": 20, "45-54": 20, "55+": 20 } };

  const fc = useMemo(() => forecast(a.last12, horizon), [a.last12, horizon]);
  const [lo, hi] = ind.adBudget;
  const adPct = lo + (hi - lo) * STANCES[stance];
  const fcRevenue = fc.reduce((s, f) => s + f.revenue, 0);
  const adBudget = fcRevenue * adPct;
  const currentMarketing = a.last12.slice(-horizon).reduce((s, r) => s + r.marketing, 0);
  const split = channelSplit(demo);

  // Ratios from the last 12 months drive the production & operations plan.
  const rev12 = a.totals.revenue || 1;
  const prodRatio = a.last12.reduce((s, r) => s + r.production, 0) / rev12;
  const opsAvg = a.last12.reduce((s, r) => s + r.operations, 0) / a.last12.length;
  const payAvg = a.last12.slice(-3).reduce((s, r) => s + r.payroll, 0) / 3;
  const otherRatio = a.last12.reduce((s, r) => s + r.other, 0) / rev12;
  const plan = fc.map((f) => {
    const row = { month: f.month, revenue: f.revenue, production: f.revenue * prodRatio, operations: opsAvg, payroll: payAvg, marketing: f.revenue * adPct, other: f.revenue * otherRatio };
    row.expenses = CAT_KEYS.reduce((s, k) => s + row[k], 0);
    row.profit = row.revenue - row.expenses;
    return row;
  });
  const planProfit = plan.reduce((s, r) => s + r.profit, 0);

  const setDemo = (next) => update("budget.edit", (s) => (s.demographics = next));
  const ageTotal = AGE_GROUPS.reduce((s, g) => s + (demo.ages[g] || 0), 0) || 1;

  return (
    <>
      <PageHead title="Spending planner" subtitle="Plan advertising, production and operations for the months ahead — based on your history, seasonality and who your customers are.">
        <Seg value={String(horizon)} onChange={(v) => setHorizon(Number(v))} options={[{ value: "3", label: "3 months" }, { value: "6", label: "6 months" }, { value: "12", label: "12 months" }]} />
      </PageHead>

      <div className="grid g4">
        <Stat label="Forecast revenue" value={money(fcRevenue, currency, { compact: true })} sub={`next ${horizon} months`} icon="chart" />
        <Stat label="Recommended ad budget" value={money(adBudget, currency, { compact: true })} sub={`${pct(adPct)} of revenue · ${stance}`} icon="planner" />
        <Stat label="Production budget" value={money(plan.reduce((s, r) => s + r.production, 0), currency, { compact: true })} sub={`${pct(prodRatio)} of revenue, from your history`} icon="inventory" />
        <Stat label="Planned profit" value={<span style={{ color: planProfit < 0 ? "var(--critical-ink)" : undefined }}>{money(planProfit, currency, { compact: true })}</span>} sub={`${pct(fcRevenue ? planProfit / fcRevenue : 0)} margin`} icon="budget" />
      </div>

      <div className="grid g3">
        <Card title="Your customers" subtitle="Changes update the plan instantly">
          <div className="stack" style={{ gap: 14 }}>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Sell to">
                <select className="input" disabled={!canEdit} value={demo.customerType} onChange={(e) => setDemo({ ...demo, customerType: e.target.value })}>
                  <option value="B2C">Consumers</option><option value="B2B">Businesses</option><option value="Both">Both</option>
                </select>
              </Field>
              <Field label="Reach">
                <select className="input" disabled={!canEdit} value={demo.reach} onChange={(e) => setDemo({ ...demo, reach: e.target.value })}>
                  {["Local", "Regional", "National / online"].map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            {AGE_GROUPS.map((g) => (
              <div key={g} className="row">
                <span className="small" style={{ width: 50 }}>{g}</span>
                <input type="range" className="grow" min={0} max={60} disabled={!canEdit} value={demo.ages[g]} onChange={(e) => setDemo({ ...demo, ages: { ...demo.ages, [g]: Number(e.target.value) } })} aria-label={`Share aged ${g}`} />
                <b className="small tabnum" style={{ width: 40, textAlign: "right" }}>{Math.round((demo.ages[g] / ageTotal) * 100)}%</b>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Advertising plan" subtitle="Suggested split of the ad budget by channel" className="span2" action={<Seg value={stance} onChange={setStance} options={[{ value: "conservative", label: "Conservative" }, { value: "balanced", label: "Balanced" }, { value: "growth", label: "Growth" }]} />}>
          <div className="grid g2" style={{ alignItems: "start" }}>
            <HBar items={split.map((c) => ({ label: c.label, value: (adBudget * c.share) / horizon }))} label="Per month" currency={currency} />
            <div className="stack" style={{ gap: 10 }}>
              {split.slice(0, 4).map((c, i) => (
                <div key={c.key} className="row between small">
                  <span><b>{i + 1}.</b> {c.label}</span>
                  <span className="tabnum"><b>{money((adBudget * c.share) / horizon, currency)}</b>/mo · {pct(c.share, 0)}</span>
                </div>
              ))}
              <p className="xs muted" style={{ marginTop: 6 }}>
                Industry guidance for {ind.label.toLowerCase()}: {pct(lo, 0)}–{pct(hi, 0)} of revenue on marketing. You've spent {money(currentMarketing, currency, { compact: true })} over the last {horizon} months ({pct(currentMarketing / Math.max(1, a.last12.slice(-horizon).reduce((s, r) => s + r.revenue, 0)))} of revenue).
              </p>
              {currentMarketing > adBudget * 1.2 && <Alert level="warning" title="You're spending more than the plan suggests" detail="Check which channels actually bring customers before adding more." />}
              {currentMarketing < adBudget * 0.6 && <Alert level="info" title="Room to invest in marketing" detail="You're well under the typical range for your industry." />}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Production & operations plan" subtitle="Forecast revenue × your historical cost ratios. Operations and payroll are held at recent levels.">
        <ExpenseStack rows={plan} categories={EXPENSE_CATEGORIES} currency={currency} />
      </Card>
      <Card flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Month</th><th className="r">Forecast revenue</th>{EXPENSE_CATEGORIES.map((c) => <th key={c.key} className="r">{c.label}</th>)}<th className="r">Profit</th></tr>
            </thead>
            <tbody>
              {plan.map((r) => (
                <tr key={r.month}>
                  <td>{monthLabel(r.month, "long")}</td>
                  <td className="r"><b>{money(r.revenue, currency)}</b></td>
                  {CAT_KEYS.map((k) => <td key={k} className="r">{money(r[k], currency)}</td>)}
                  <td className="r">{r.profit < 0 ? <Pill level="critical">{money(r.profit, currency)}</Pill> : <b>{money(r.profit, currency)}</b>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
