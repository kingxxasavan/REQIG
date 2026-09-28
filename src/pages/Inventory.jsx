import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Stat, Pill, Meter, ReadOnly, Alert, Empty } from "../components/UI.jsx";
import { HBar } from "../components/Charts.jsx";
import EntityForm from "../components/EntityForm.jsx";
import { Icon } from "../components/Icons.jsx";
import { money, pct, today, uid } from "../lib/format.js";

const TABS = [
  { key: "suppliers", label: "Suppliers" },
  { key: "inventory", label: "Inventory" },
  { key: "damages", label: "Damaged products" },
  { key: "returns", label: "Returns" },
];

export default function Inventory() {
  const { state, analysis: a, currency, allowed, update } = useStore();
  const [tab, setTab] = useState("suppliers");
  const [form, setForm] = useState(null);
  const canEdit = allowed("inventory.edit");
  const { suppliers, inventory, damages, returns } = state;
  const itemById = Object.fromEntries(inventory.map((i) => [i.id, i]));
  const supplierById = Object.fromEntries(suppliers.map((s) => [s.id, s]));

  const lowStock = inventory.filter((i) => i.qty <= i.reorderAt);
  const stockValue = inventory.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const damageCost = damages.reduce((s, d) => s + d.qty * (itemById[d.itemId]?.unitCost || 0), 0);
  const refundTotal = returns.reduce((s, r) => s + (r.refund || 0), 0);

  const itemOptions = inventory.map((i) => ({ value: i.id, label: `${i.sku} · ${i.name}` }));
  const SCHEMAS = {
    suppliers: {
      noun: "supplier",
      blank: () => ({ name: "", category: "", contact: "", leadDays: 5, onTimeRate: 0.9, rating: 4 }),
      fields: [
        { key: "name", label: "Supplier name", required: true },
        { key: "category", label: "Supplies" },
        { key: "contact", label: "Contact" },
        { key: "leadDays", label: "Lead time", type: "number", suffix: "days" },
        { key: "onTimeRate", label: "On-time delivery", type: "pct" },
        { key: "rating", label: "Your rating (1–5)", type: "select", options: ["1", "2", "3", "4", "5"] },
      ],
    },
    inventory: {
      noun: "item",
      blank: () => ({ sku: `SKU-${1000 + inventory.length + 1}`, name: "", unit: "unit", supplierId: suppliers[0]?.id || "", qty: 0, received: 0, unitCost: 0, reorderAt: 10 }),
      fields: [
        { key: "sku", label: "SKU", required: true },
        { key: "name", label: "Item name", required: true },
        { key: "supplierId", label: "Supplier", type: "select", options: [{ value: "", label: "—" }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))] },
        { key: "unit", label: "Unit" },
        { key: "qty", label: "In stock", type: "number" },
        { key: "received", label: "Total received", type: "number", hint: "Used to calculate the supplier's defect rate" },
        { key: "unitCost", label: "Unit cost", type: "money" },
        { key: "reorderAt", label: "Reorder at", type: "number" },
      ],
    },
    damages: {
      noun: "damage record",
      blank: () => ({ date: today(), itemId: inventory[0]?.id || "", qty: 1, reason: "Damaged in transit", writeOff: true }),
      fields: [
        { key: "date", label: "Date", type: "date" },
        { key: "itemId", label: "Item", type: "select", options: itemOptions },
        { key: "qty", label: "Quantity damaged", type: "number" },
        { key: "reason", label: "Reason", type: "select", options: ["Damaged in transit", "Crushed in transit", "Water damage", "Wrong spec delivered", "Expired", "Handling / in-store", "Manufacturing defect"] },
        { key: "writeOff", label: "Remove from stock", type: "checkbox", checkLabel: "Deduct quantity from inventory" },
      ],
    },
    returns: {
      noun: "return",
      blank: () => ({ date: today(), itemId: inventory[0]?.id || "", qty: 1, reason: "Defective", refund: 0, restocked: false }),
      fields: [
        { key: "date", label: "Date", type: "date" },
        { key: "itemId", label: "Item", type: "select", options: itemOptions },
        { key: "qty", label: "Quantity", type: "number" },
        { key: "reason", label: "Reason", type: "select", options: ["Defective", "Damaged on arrival", "Wrong item", "Not as described", "Changed mind", "Late delivery"] },
        { key: "refund", label: "Refund amount", type: "money" },
        { key: "restocked", label: "Restocked", type: "checkbox", checkLabel: "Item went back into sellable stock" },
      ],
    },
  };

  const save = () => {
    const { kind, value } = form;
    const isNew = !value.id;
    const record = { ...value, id: value.id || uid() };
    if (kind === "suppliers") record.rating = Number(record.rating);
    update("inventory.edit", (s) => {
      if (isNew) s[kind].unshift(record);
      else s[kind] = s[kind].map((x) => (x.id === record.id ? record : x));
      // Stock follows the logs.
      const item = s.inventory.find((i) => i.id === record.itemId);
      if (isNew && item && kind === "damages" && record.writeOff) item.qty = Math.max(0, item.qty - record.qty);
      if (isNew && item && kind === "returns" && record.restocked) item.qty += record.qty;
    }, `${isNew ? "Added" : "Updated"} ${SCHEMAS[kind].noun}${record.name ? ` ${record.name}` : ""}`);
    setForm(null);
  };
  const remove = (kind, id) => update("inventory.edit", (s) => (s[kind] = s[kind].filter((x) => x.id !== id)), `Deleted ${SCHEMAS[kind].noun}`);
  const open = (kind, value) => setForm({ kind, value: value ? { ...value } : SCHEMAS[kind].blank() });

  const Actions = ({ kind, row }) =>
    canEdit ? (
      <td className="r" style={{ whiteSpace: "nowrap" }}>
        <button className="btn ghost icon-btn" onClick={() => open(kind, row)} aria-label="Edit"><Icon name="edit" size={16} /></button>
        <button className="btn ghost icon-btn" onClick={() => remove(kind, row.id)} aria-label="Delete"><Icon name="trash" size={16} /></button>
      </td>
    ) : null;

  return (
    <>
      <PageHead title="Suppliers & inventory" subtitle="Stock levels, damaged products and returns — and what each supplier is really costing you.">
        {canEdit && <button className="btn primary" onClick={() => open(tab)} disabled={(tab === "damages" || tab === "returns") && !inventory.length}><Icon name="plus" size={16} /> Add {SCHEMAS[tab].noun}</button>}
      </PageHead>
      <ReadOnly perm="inventory.edit" />

      <div className="grid g4">
        <Stat label="Stock value" value={money(stockValue, currency, { compact: true })} sub={`${inventory.length} items`} icon="inventory" />
        <Stat label="Low stock" value={lowStock.length} sub={lowStock.length ? <Pill level="warning">! Reorder soon</Pill> : "All above reorder level"} icon="bell" />
        <Stat label="Lost to damage" value={money(damageCost, currency)} sub={`${damages.reduce((s, d) => s + d.qty, 0)} units written off`} icon="x" />
        <Stat label="Refunded on returns" value={money(refundTotal, currency)} sub={`${returns.length} returns · ${returns.filter((r) => r.restocked).length} restocked`} icon="truck" />
      </div>

      {lowStock.map((i) => <Alert key={i.id} level="warning" title={`${i.name} is low: ${i.qty} ${i.unit} left`} detail={`Reorder level is ${i.reorderAt}. Supplier: ${supplierById[i.supplierId]?.name || "—"} (${supplierById[i.supplierId]?.leadDays ?? "?"}-day lead time).`} />)}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)} role="tab" aria-selected={tab === t.key}>
            {t.label} <span className="muted">({state[t.key].length})</span>
          </button>
        ))}
      </div>

      {tab === "suppliers" && (
        <div className="grid g3">
          <Card title="Supplier scorecards" subtitle="Score blends defect rate, on-time delivery and money lost" className="span2" flush tour="inv-main">
            {suppliers.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Supplier</th><th>Lead time</th><th className="r">On time</th><th className="r">Defect rate</th><th className="r">Lost ($)</th><th style={{ minWidth: 120 }}>Score</th>{canEdit && <th />}</tr></thead>
                  <tbody>
                    {a.scorecards.map((s) => (
                      <tr key={s.id}>
                        <td><b>{s.name}</b><div className="xs muted">{s.category} · {"★".repeat(s.rating || 0)}</div></td>
                        <td>{s.leadDays} days</td>
                        <td className="r">{pct(s.onTimeRate, 0)}</td>
                        <td className="r" style={{ color: s.defectRate > 0.05 ? "var(--critical-ink)" : undefined }}>{pct(s.defectRate)}</td>
                        <td className="r">{money(s.damageCost + s.returnCost, currency)}</td>
                        <td><div className="row" style={{ gap: 8 }}><div style={{ flex: 1, minWidth: 70 }}><Meter value={s.score} max={100} level={s.score >= 75 ? "good" : s.score >= 60 ? "warning" : "critical"} /></div><b className="small tabnum">{s.score}</b></div></td>
                        <Actions kind="suppliers" row={s} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty title="No suppliers yet">Add the companies you buy from to track their reliability.</Empty>}
          </Card>
          <Card title="Money lost by supplier" subtitle="Damaged stock + refunds">
            {a.scorecards.length ? <HBar items={a.scorecards.map((s) => ({ label: s.name, value: s.damageCost + s.returnCost })).sort((x, y) => y.value - x.value)} label="Lost" currency={currency} slot={1} /> : <p className="muted small">No data yet.</p>}
          </Card>
        </div>
      )}

      {tab === "inventory" && (
        <Card flush>
          {inventory.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>SKU</th><th>Item</th><th>Supplier</th><th className="r">In stock</th><th className="r">Reorder at</th><th className="r">Unit cost</th><th className="r">Value</th><th>Status</th>{canEdit && <th />}</tr></thead>
                <tbody>
                  {inventory.map((i) => (
                    <tr key={i.id}>
                      <td className="muted">{i.sku}</td>
                      <td><b>{i.name}</b><div className="xs muted">per {i.unit}</div></td>
                      <td>{supplierById[i.supplierId]?.name || "—"}</td>
                      <td className="r">{i.qty}</td>
                      <td className="r muted">{i.reorderAt}</td>
                      <td className="r">{money(i.unitCost, currency, { cents: true })}</td>
                      <td className="r">{money(i.qty * i.unitCost, currency)}</td>
                      <td>{i.qty <= i.reorderAt ? <Pill level="warning">! Low</Pill> : <Pill level="good">✓ OK</Pill>}</td>
                      <Actions kind="inventory" row={i} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="No inventory yet">Add the items you keep in stock.</Empty>}
        </Card>
      )}

      {tab === "damages" && (
        <Card flush>
          {damages.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Date</th><th>Item</th><th>Supplier</th><th>Reason</th><th className="r">Qty</th><th className="r">Cost</th>{canEdit && <th />}</tr></thead>
                <tbody>
                  {damages.map((d) => {
                    const it = itemById[d.itemId];
                    return (
                      <tr key={d.id}>
                        <td>{d.date}</td>
                        <td>{it?.name || "Deleted item"}</td>
                        <td className="muted">{supplierById[it?.supplierId]?.name || "—"}</td>
                        <td><Pill>{d.reason}</Pill></td>
                        <td className="r">{d.qty}</td>
                        <td className="r">{money(d.qty * (it?.unitCost || 0), currency)}</td>
                        <Actions kind="damages" row={d} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <Empty title="No damaged products logged">Log damaged or spoiled stock to see what it costs and which supplier it came from.</Empty>}
        </Card>
      )}

      {tab === "returns" && (
        <Card flush>
          {returns.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Date</th><th>Item</th><th>Reason</th><th className="r">Qty</th><th className="r">Refund</th><th>Restocked</th>{canEdit && <th />}</tr></thead>
                <tbody>
                  {returns.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{itemById[r.itemId]?.name || "Deleted item"}</td>
                      <td><Pill>{r.reason}</Pill></td>
                      <td className="r">{r.qty}</td>
                      <td className="r">{money(r.refund, currency)}</td>
                      <td>{r.restocked ? <Pill level="good">✓ Yes</Pill> : <Pill level="warning">Written off</Pill>}</td>
                      <Actions kind="returns" row={r} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="No returns logged">Record customer returns and refunds to see the true cost of quality problems.</Empty>}
        </Card>
      )}

      {form && <EntityForm title={`${form.value.id ? "Edit" : "Add"} ${SCHEMAS[form.kind].noun}`} fields={SCHEMAS[form.kind].fields} value={form.value} onChange={(v) => setForm({ ...form, value: v })} onSave={save} onClose={() => setForm(null)} currency={currency} />}
    </>
  );
}
