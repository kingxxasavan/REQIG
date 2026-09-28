import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Stat, Pill, ReadOnly, Seg, Empty } from "../components/UI.jsx";
import { HBar } from "../components/Charts.jsx";
import EntityForm from "../components/EntityForm.jsx";
import { Icon } from "../components/Icons.jsx";
import { money, today, uid } from "../lib/format.js";

const CATEGORIES = ["Product quality", "Late delivery", "Customer service", "Billing error", "Wrong order", "Pricing", "Other"];
const SEVERITY_LEVEL = { high: "critical", medium: "warning", low: "info" };

const FIELDS = [
  { key: "date", label: "Date received", type: "date" },
  { key: "customer", label: "Customer", required: true },
  { key: "channel", label: "Channel", type: "select", options: ["Phone", "Email", "In person", "Social media", "Review site", "Website form"] },
  { key: "category", label: "Category", type: "select", options: CATEGORIES },
  { key: "severity", label: "Severity", type: "select", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
  { key: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }, { value: "in-progress", label: "In progress" }, { value: "resolved", label: "Resolved" }] },
  { key: "cost", label: "Cost to resolve", type: "money", hint: "Refunds, replacements, vouchers, staff time" },
  { key: "resolvedOn", label: "Resolved on", type: "date" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function Complaints() {
  const { state, analysis: a, currency, allowed, update } = useStore();
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState("all");
  const canEdit = allowed("complaints.edit");
  const c = a.cstats;
  const list = state.complaints.filter((x) => filter === "all" || (filter === "open" ? x.status !== "resolved" : x.status === "resolved"));

  const save = () => {
    const v = { ...form };
    if (v.status === "resolved" && !v.resolvedOn) v.resolvedOn = today();
    const isNew = !v.id;
    update("complaints.edit", (s) => {
      if (isNew) s.complaints.unshift({ ...v, id: uid() });
      else s.complaints = s.complaints.map((x) => (x.id === v.id ? v : x));
    }, `${isNew ? "Logged" : "Updated"} complaint from ${v.customer}`);
    setForm(null);
  };
  const resolve = (x) => update("complaints.edit", (s) => {
    const t = s.complaints.find((y) => y.id === x.id);
    t.status = "resolved";
    t.resolvedOn = today();
  }, `Resolved complaint from ${x.customer}`);

  return (
    <>
      <PageHead title="Complaints" subtitle="Every complaint, what it was about, and how much it cost to make right.">
        {canEdit && <button className="btn primary" onClick={() => setForm({ date: today(), customer: "", channel: "Phone", category: CATEGORIES[0], severity: "medium", status: "open", cost: 0, resolvedOn: "", notes: "" })}><Icon name="plus" size={16} /> Log complaint</button>}
      </PageHead>
      <ReadOnly perm="complaints.edit" />

      <div className="grid g4">
        <Stat label="Total complaints" value={c.total} sub="all time" icon="complaints" />
        <Stat label="Open" value={c.open} sub={c.open ? <Pill level="warning">! Needs follow-up</Pill> : "All resolved"} icon="bell" />
        <Stat label="Cost to resolve" value={money(c.cost, currency)} sub={c.total ? `${money(c.cost / c.total, currency)} per complaint` : ""} icon="budget" />
        <Stat label="Avg. time to resolve" value={c.avgDays != null ? `${c.avgDays.toFixed(1)} days` : "—"} sub="resolved complaints" icon="planner" />
      </div>

      <div className="grid g3">
        <Card title="Complaint log" className="span2" flush tour="complaints-log" action={<Seg value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "resolved", label: "Resolved" }]} />}>
          {list.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Date</th><th>Customer</th><th>Category</th><th>Severity</th><th>Status</th><th className="r">Cost</th>{canEdit && <th />}</tr></thead>
                <tbody>
                  {list.map((x) => (
                    <tr key={x.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{x.date}</td>
                      <td><b>{x.customer}</b><div className="xs muted">{x.channel}{x.notes ? ` · ${x.notes}` : ""}</div></td>
                      <td>{x.category}</td>
                      <td><Pill level={SEVERITY_LEVEL[x.severity]}>{x.severity}</Pill></td>
                      <td>{x.status === "resolved" ? <Pill level="good">✓ Resolved</Pill> : <Pill level="warning">{x.status === "open" ? "Open" : "In progress"}</Pill>}</td>
                      <td className="r">{money(x.cost, currency)}</td>
                      {canEdit && (
                        <td className="r" style={{ whiteSpace: "nowrap" }}>
                          {x.status !== "resolved" && <button className="btn sm" onClick={() => resolve(x)}>Resolve</button>}
                          <button className="btn ghost icon-btn" onClick={() => setForm({ ...x })} aria-label="Edit"><Icon name="edit" size={16} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="Nothing here">No complaints match this filter.</Empty>}
        </Card>
        <div className="stack" style={{ gap: 16 }}>
          <Card title="Cost by category">
            {c.byCat.length ? <HBar items={c.byCat.map((b) => ({ label: b.category, value: b.cost }))} label="Cost" currency={currency} slot={1} /> : <p className="muted small">No data yet.</p>}
          </Card>
          <Card title="Count by category">
            {c.byCat.length ? <HBar items={[...c.byCat].sort((x, y) => y.count - x.count).map((b) => ({ label: b.category, value: b.count }))} label="Complaints" format={(v) => `${v}`} /> : <p className="muted small">No data yet.</p>}
          </Card>
        </div>
      </div>

      {form && <EntityForm title={form.id ? "Edit complaint" : "Log complaint"} fields={FIELDS} value={form} onChange={setForm} onSave={save} onClose={() => setForm(null)} currency={currency} />}
    </>
  );
}
