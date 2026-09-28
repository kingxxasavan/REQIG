import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Alert, NumInput, ReadOnly, Modal, Seg, Pill } from "../components/UI.jsx";
import FileDrop from "../components/FileDrop.jsx";
import { Icon } from "../components/Icons.jsx";
import { EXPENSE_CATEGORIES } from "../lib/industries.js";
import { CAT_KEYS, expensesOf } from "../lib/analytics.js";
import { readFileRows, rowsToMonths, toCSV, download } from "../lib/parse.js";
import { money, monthLabel, addMonths } from "../lib/format.js";

export default function DataPage() {
  const { state, currency, allowed, update, toast } = useStore();
  const canEdit = allowed("finance.edit");
  const canImport = allowed("data.import");
  const [pending, setPending] = useState(null);
  const [mergeMode, setMergeMode] = useState("merge");
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const months = [...state.months].sort((a, b) => b.month.localeCompare(a.month));

  const onFile = async (file) => {
    setErr("");
    try {
      const res = rowsToMonths(await readFileRows(file));
      if (!res.months.length) throw new Error(res.warnings[0] || "No usable rows found.");
      setPending({ file: file.name, ...res });
    } catch (e) {
      setErr(e.message);
    }
  };

  const applyImport = () => {
    update(
      "data.import",
      (s) => {
        if (mergeMode === "replace") s.months = pending.months;
        else {
          const map = Object.fromEntries(s.months.map((m) => [m.month, m]));
          for (const m of pending.months) map[m.month] = m;
          s.months = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
        }
        s.demo = false;
      },
      `Imported ${pending.months.length} months from ${pending.file} (${mergeMode})`,
    );
    toast(`Imported ${pending.months.length} months`, "good");
    setPending(null);
  };

  const setCell = (month, key, v) => update("finance.edit", (s) => {
    const m = s.months.find((x) => x.month === month);
    m[key] = v;
  });
  const commitEdits = () => {
    update("finance.edit", () => {}, "Edited monthly figures");
    setEditing(false);
  };
  const addMonth = () => {
    const last = state.months.map((m) => m.month).sort().pop();
    const month = last ? addMonths(last, 1) : new Date().toISOString().slice(0, 7);
    update("finance.edit", (s) => s.months.push({ month, revenue: 0, ...Object.fromEntries(CAT_KEYS.map((k) => [k, 0])) }), `Added ${monthLabel(month, "long")}`);
    setEditing(true);
  };
  const remove = (month) => update("finance.edit", (s) => (s.months = s.months.filter((m) => m.month !== month)), `Deleted ${monthLabel(month, "long")}`);
  const exportCSV = () =>
    download(
      "epri-monthly-financials.csv",
      toCSV([...state.months].sort((a, b) => a.month.localeCompare(b.month)), [{ key: "month", label: "month" }, { key: "revenue", label: "revenue" }, ...CAT_KEYS.map((k) => ({ key: k, label: k }))]),
    );

  return (
    <>
      <PageHead title="Data & uploads" subtitle="Your monthly revenue and spending. Upload new months as they close, or edit figures directly.">
        {allowed("data.export") && <button className="btn" onClick={exportCSV}><Icon name="download" size={16} /> Export CSV</button>}
        {canEdit && <button className="btn" onClick={addMonth}><Icon name="plus" size={16} /> Add month</button>}
        {canEdit && (editing ? <button className="btn primary" onClick={commitEdits}>Done editing</button> : <button className="btn primary" onClick={() => setEditing(true)}><Icon name="edit" size={16} /> Edit figures</button>)}
      </PageHead>
      <ReadOnly perm="finance.edit" />

      <div className="grid g3">
        <Card title="Upload financial data" className="span2">
          <FileDrop onFile={onFile} disabled={!canImport} />
          {err && <div style={{ marginTop: 12 }}><Alert level="critical" title="Import failed" detail={err} /></div>}
        </Card>
        <Card title="Supported formats">
          <ul className="small text-2" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            <li><b>Monthly totals</b> — one row per month with revenue and category columns</li>
            <li><b>Transactions</b> — date, category, amount; totalled per month for you</li>
            <li>Column names are matched loosely: "Sales", "COGS", "Wages", "Rent", "Ad spend"…</li>
            <li>Dates like 2025-03, 03/2025, Mar 2025 or Excel dates</li>
          </ul>
          <div className="row wrap" style={{ marginTop: 14, gap: 8 }}>
            <a className="btn sm" href="templates/monthly-financials.csv" download><Icon name="file" size={14} /> Monthly template</a>
            <a className="btn sm" href="templates/transactions.csv" download><Icon name="file" size={14} /> Transactions template</a>
          </div>
        </Card>
      </div>

      <Card title="Monthly figures" subtitle={`${state.months.length} months on file`} flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="r">Revenue</th>
                {EXPENSE_CATEGORIES.map((c) => <th key={c.key} className="r" title={c.hint}>{c.label}</th>)}
                <th className="r">Profit</th>
                {editing && <th />}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const profit = (m.revenue || 0) - expensesOf(m);
                return (
                  <tr key={m.month}>
                    <td style={{ whiteSpace: "nowrap" }}>{monthLabel(m.month, "long")}</td>
                    {["revenue", ...CAT_KEYS].map((k) => (
                      <td key={k} className="r">{editing ? <NumInput value={m[k] || 0} min={0} onChange={(v) => setCell(m.month, k, v)} style={{ width: 104 }} aria-label={`${k} ${m.month}`} /> : money(m[k], currency)}</td>
                    ))}
                    <td className="r" style={{ fontWeight: 650, color: profit < 0 ? "var(--critical-ink)" : undefined }}>{money(profit, currency)}</td>
                    {editing && <td><button className="btn ghost icon-btn" onClick={() => remove(m.month)} aria-label={`Delete ${m.month}`}><Icon name="trash" size={16} /></button></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {pending && (
        <Modal
          title="Review import"
          onClose={() => setPending(null)}
          wide
          footer={
            <>
              <button className="btn" onClick={() => setPending(null)}>Cancel</button>
              <button className="btn primary" onClick={applyImport}>Import {pending.months.length} months</button>
            </>
          }
        >
          <p className="text-2">
            <b>{pending.file}</b> was read as {pending.mode === "transactions" ? "a transaction list (totalled per month)" : "monthly totals"}.
          </p>
          {pending.warnings.map((w) => <Alert key={w} level="warning" title={w} />)}
          <Seg value={mergeMode} onChange={setMergeMode} options={[{ value: "merge", label: "Merge — update matching months" }, { value: "replace", label: "Replace all data" }]} />
          <div className="table-wrap card flush" style={{ maxHeight: 300 }}>
            <table className="table">
              <thead>
                <tr><th>Month</th><th className="r">Revenue</th><th className="r">Expenses</th><th /></tr>
              </thead>
              <tbody>
                {pending.months.map((m) => (
                  <tr key={m.month}>
                    <td>{monthLabel(m.month, "long")}</td>
                    <td className="r">{money(m.revenue, currency)}</td>
                    <td className="r">{money(expensesOf(m), currency)}</td>
                    <td>{state.months.some((x) => x.month === m.month) ? <Pill level="warning">Updates existing</Pill> : <Pill level="good">New</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  );
}
