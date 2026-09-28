import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Stat, Alert, Pill, Meter, Empty } from "../components/UI.jsx";
import { RevenueExpenseChart, ProfitBars, ExpenseStack, HealthRing } from "../components/Charts.jsx";
import { Icon } from "../components/Icons.jsx";
import { useAdvisor } from "../components/AdvisorDock.jsx";
import { EXPENSE_CATEGORIES, getIndustry } from "../lib/industries.js";
import { money, pct, monthLabel } from "../lib/format.js";

export default function Dashboard() {
  const { state, analysis: a, currency, user } = useStore();
  const advisor = useAdvisor();
  if (a.empty)
    return (
      <Card>
        <Empty title="No financial data yet" action={<Link className="btn primary" to="/app/data">Upload data</Link>}>
          Upload your last 12 months to see your dashboard.
        </Empty>
      </Card>
    );

  const ind = getIndustry(state.company.industry);
  const L = a.latest;
  const compLabels = { profitability: "Profitability", growth: "Growth", spending: "Spending vs industry", budget: "Budget discipline", stability: "Stability" };

  return (
    <>
      <PageHead title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user?.name?.split(" ")[0] || "there"}`} subtitle={`Here's how ${state.company.name} is doing. Latest month: ${monthLabel(L.month, "long")}.`}>
        <Link to="/app/reports" className="btn"><Icon name="report" size={16} /> Monthly report</Link>
        <button className="btn primary" onClick={() => advisor.ask("")}><Icon name="ai" size={16} /> Ask the advisor</button>
      </PageHead>

      <div className="grid g4" data-tour="dash-kpis">
        <Stat label={`Revenue · ${monthLabel(L.month)}`} value={money(L.revenue, currency, { compact: true })} delta={a.mom.revenue} spark={a.last12.map((r) => r.revenue)} icon="chart" />
        <Stat label={`Expenses · ${monthLabel(L.month)}`} value={money(L.expenses, currency, { compact: true })} delta={a.mom.expenses} invert spark={a.last12.map((r) => r.expenses)} sparkColor="var(--s2)" icon="budget" />
        <Stat
          label={`Net profit · ${monthLabel(L.month)}`}
          value={<span style={{ color: L.profit < 0 ? "var(--critical-ink)" : undefined }}>{money(L.profit, currency, { compact: true })}</span>}
          sub={<span>{pct(L.margin)} margin</span>}
          spark={a.last12.map((r) => r.profit)}
          sparkColor="var(--s3)"
          icon="dashboard"
        />
        <Stat
          label="Cash runway"
          value={a.runway != null ? `${a.runway.toFixed(1)} mo` : state.company.cashOnHand ? "Growing" : "—"}
          sub={a.runway != null ? <Pill level={a.runway < 6 ? "critical" : "warning"}>Burning cash</Pill> : state.company.cashOnHand ? <span>Profitable — cash is building</span> : <Link to="/app/settings">Add cash on hand</Link>}
          icon="shield"
        />
      </div>

      <div className="grid g3">
        <Card title="Revenue vs expenses" subtitle="Last 12 months, with a 3-month forecast" className="span2">
          <RevenueExpenseChart rows={a.last12} forecast={a.forecast} currency={currency} />
        </Card>
        <Card title="Financial health" subtitle="Weighted score from five signals" tour="dash-health">
          <div className="row" style={{ gap: 18, marginBottom: 16 }}>
            <HealthRing score={a.health.score} level={a.health.level} />
            <div>
              <h3 style={{ fontSize: 20 }}>{a.health.grade}</h3>
              <p className="small text-2">{a.totals.margin != null && `${pct(a.totals.margin)} net margin over 12 months`}</p>
            </div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {Object.entries(a.health.components).map(([k, v]) => (
              <div key={k}>
                <div className="row between xs" style={{ marginBottom: 4 }}>
                  <span className="text-2">{compLabels[k]}</span>
                  <b className="tabnum">{Math.round(v * 100)}</b>
                </div>
                <Meter value={v} level={v >= 0.65 ? "good" : v >= 0.45 ? "warning" : "critical"} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid g3">
        <Card title="Alerts" subtitle={`${a.alerts.filter((x) => x.level === "critical" || x.level === "warning").length} need attention`} className="span2" tour="dash-alerts">
          <div className="stack" style={{ gap: 10 }}>
            {a.alerts.slice(0, 6).map((x, i) => <Alert key={i} {...x} />)}
          </div>
        </Card>
        <Card title="Net profit by month" subtitle="Bars below zero are losses">
          <ProfitBars rows={a.last12} currency={currency} height="short" />
          <div className="kv" style={{ marginTop: 14 }}>
            <dt>Best month</dt>
            <dd>{(() => { const b = [...a.last12].sort((x, y) => y.profit - x.profit)[0]; return `${monthLabel(b.month)} · ${money(b.profit, currency, { compact: true })}`; })()}</dd>
            <dt>Weakest month</dt>
            <dd>{(() => { const b = [...a.last12].sort((x, y) => x.profit - y.profit)[0]; return `${monthLabel(b.month)} · ${money(b.profit, currency, { compact: true })}`; })()}</dd>
          </div>
        </Card>
      </div>

      <div className="grid g3">
        <Card title="Where the money goes" subtitle="Spending by category each month" className="span2">
          <ExpenseStack rows={a.last12} categories={EXPENSE_CATEGORIES} currency={currency} />
        </Card>
        <Card title={`vs. ${ind.label}`} subtitle="Share of revenue, last 3 months">
          <div className="stack" style={{ gap: 14 }}>
            {a.bench.map((b) => (
              <div key={b.key}>
                <div className="row between small" style={{ marginBottom: 5 }}>
                  <span>{b.label}</span>
                  <span className="row" style={{ gap: 6 }}>
                    <b className="tabnum">{pct(b.share)}</b>
                    <Pill level={b.status === "over" ? "warning" : b.status === "within" ? "good" : "info"}>{b.status === "over" ? "High" : b.status === "within" ? "Normal" : "Low"}</Pill>
                  </span>
                </div>
                <Meter value={b.share ?? 0} max={Math.max(b.hi * 1.6, b.share ?? 0)} mark={b.hi} level={b.status === "over" ? "warning" : "good"} />
                <div className="xs muted" style={{ marginTop: 3 }}>Typical {pct(b.lo, 0)}–{pct(b.hi, 0)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="What this means" subtitle="Plain-English summary from the advisor" action={<button className="btn sm" onClick={() => advisor.ask("")}>Ask a question</button>}>
        {a.insights.slice(0, 5).map((t, i) => (
          <div key={i} className="insight">
            <span className="n">{i + 1}</span>
            <span>{t}</span>
          </div>
        ))}
      </Card>
    </>
  );
}
