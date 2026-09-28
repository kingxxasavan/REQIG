import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Field, NumInput, Pill, Seg, Toggle, Alert, Empty } from "../components/UI.jsx";
import { MultiLine } from "../components/Charts.jsx";
import { Icon } from "../components/Icons.jsx";
import { industryList, getIndustry } from "../lib/industries.js";
import { evaluate, project, compoundYears } from "../lib/pricing.js";
import { money, pct, uid } from "../lib/format.js";

function newProduct(industryKey, fixedMonthly) {
  const ind = getIndustry(industryKey);
  return {
    id: null,
    name: "",
    industry: industryKey,
    items: ind.materials.slice(0, 2).map((m) => ({ id: uid(), name: m.name, unit: m.unit, price: m.price, qty: 1 })),
    labourHours: 0,
    labourRate: 20,
    fees: ind.feePct.map((f) => ({ ...f, on: true })),
    fixedMonthly,
    unitsPerMonth: 500,
    method: "markup",
    methodValue: 60,
    manualPrice: 0,
    growthPct: 2,
    priceIncreasePct: 3,
    costInflationPct: 4,
  };
}

export default function PricingStudio() {
  const { state, analysis: a, currency, allowed, update, toast } = useStore();
  const canSave = allowed("pricing.edit");
  const avgOps = a.last12?.length ? Math.round(a.last12.reduce((s, r) => s + r.operations, 0) / a.last12.length / 4) : 1000;
  const [p, setP] = useState(() => newProduct(state.company.industry, avgOps));
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const ind = getIndustry(p.industry);

  const r = useMemo(() => evaluate(p), [p]);
  const proj = useMemo(() => project(p, 12), [p]);
  const years = useMemo(() => compoundYears(p, 5), [p]);
  const valid = Number.isFinite(r.price) && r.price > 0;

  const addItem = (m) => setP((x) => ({ ...x, items: [...x.items, { id: uid(), name: m.name, unit: m.unit, price: m.price, qty: 1 }] }));
  const updItem = (id, k, v) => setP((x) => ({ ...x, items: x.items.map((i) => (i.id === id ? { ...i, [k]: v } : i)) }));
  const delItem = (id) => setP((x) => ({ ...x, items: x.items.filter((i) => i.id !== id) }));
  const switchIndustry = (k) => setP({ ...newProduct(k, p.fixedMonthly), name: p.name });

  const save = () => {
    const rec = { ...p, id: p.id || uid(), name: p.name.trim() || "Untitled product", summary: { price: r.price, cost: r.full + r.fees, margin: r.margin } };
    update("pricing.edit", (s) => {
      s.products = s.products || [];
      const i = s.products.findIndex((x) => x.id === rec.id);
      if (i >= 0) s.products[i] = rec;
      else s.products.unshift(rec);
    }, `Saved product pricing: ${rec.name}`);
    setP(rec);
    toast(`Saved ${rec.name}`, "good");
  };

  const totalRev = proj.reduce((s, m) => s + m.revenue, 0);
  const totalProfit = proj.reduce((s, m) => s + m.profit, 0);

  return (
    <>
      <PageHead title="Pricing studio" subtitle="Pick the materials you use, enter your prices, and see unit cost, the right selling price, and how revenue compounds.">
        <button className="btn" onClick={() => setP(newProduct(p.industry, p.fixedMonthly))}><Icon name="plus" size={16} /> New product</button>
        {canSave && <button className="btn primary" onClick={save} disabled={!valid}><Icon name="check" size={16} /> Save product</button>}
      </PageHead>

      <div className="grid g3">
        <div className="stack span2" style={{ gap: 16 }}>
          <Card title="1 · Product" subtitle={`Specialised tools for ${ind.label}: ${ind.tools.join(" · ")}`}>
            <div className="form-grid">
              <Field label="Product or service name"><input className="input" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sourdough loaf, Pro plan, Kitchen remodel" /></Field>
              <Field label="Material presets for">
                <select className="input" value={p.industry} onChange={(e) => switchIndustry(e.target.value)}>
                  {industryList.map((i) => <option key={i.key} value={i.key}>{i.icon} {i.label}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          <Card title="2 · Materials & inputs" subtitle="Click a preset to add it, then set your price and how much goes into one unit.">
            <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}>
              {ind.materials.map((m) => (
                <button key={m.name} className="chip" onClick={() => addItem(m)}>
                  <Icon name="plus" size={13} /> {m.name}
                </button>
              ))}
              <button className="chip" onClick={() => addItem({ name: "Custom item", unit: "unit", price: 0 })}><Icon name="edit" size={13} /> Custom</button>
            </div>
            {p.items.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Item</th><th>Unit</th><th className="r">Your price</th><th className="r">Qty per product</th><th className="r">Cost</th><th /></tr></thead>
                  <tbody>
                    {p.items.map((i) => (
                      <tr key={i.id}>
                        <td><input className="input" value={i.name} onChange={(e) => updItem(i.id, "name", e.target.value)} aria-label="Item name" style={{ minWidth: 140 }} /></td>
                        <td><input className="input" value={i.unit} onChange={(e) => updItem(i.id, "unit", e.target.value)} aria-label="Unit" style={{ width: 100 }} /></td>
                        <td className="r"><NumInput value={i.price} onChange={(v) => updItem(i.id, "price", v)} min={0} style={{ width: 90 }} aria-label="Price" /></td>
                        <td className="r"><NumInput value={i.qty} onChange={(v) => updItem(i.id, "qty", v)} min={0} style={{ width: 80 }} aria-label="Quantity" /></td>
                        <td className="r"><b>{money(i.price * i.qty, currency, { cents: true })}</b></td>
                        <td><button className="btn ghost icon-btn" onClick={() => delItem(i.id)} aria-label="Remove"><Icon name="trash" size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr><td colSpan={4}>Materials per unit</td><td className="r">{money(r.materials, currency, { cents: true })}</td><td /></tr></tfoot>
                </table>
              </div>
            ) : <Empty title="No materials yet">Pick from the presets above.</Empty>}
          </Card>

          <Card title="3 · Labour, fees & overhead">
            <div className="form-grid">
              <Field label="Labour hours per unit"><NumInput value={p.labourHours} onChange={(v) => set("labourHours", v)} min={0} suffix="hrs" /></Field>
              <Field label="Hourly labour rate"><NumInput value={p.labourRate} onChange={(v) => set("labourRate", v)} min={0} prefix={currency} /></Field>
              <Field label="Fixed costs to cover each month" hint="Rent, utilities, software… share for this product"><NumInput value={p.fixedMonthly} onChange={(v) => set("fixedMonthly", v)} min={0} prefix={currency} /></Field>
              <Field label="Units sold per month"><NumInput value={p.unitsPerMonth} onChange={(v) => set("unitsPerMonth", v)} min={1} step={1} /></Field>
            </div>
            {p.fees.length > 0 && (
              <div className="stack" style={{ gap: 8, marginTop: 16 }}>
                <span className="small" style={{ fontWeight: 600, color: "var(--text-2)" }}>Fees taken from the selling price</span>
                {p.fees.map((f, idx) => (
                  <div key={f.name} className="row">
                    <Toggle on={f.on} onChange={(on) => set("fees", p.fees.map((x, j) => (j === idx ? { ...x, on } : x)))} label={f.name} />
                    <span className="grow small">{f.name}</span>
                    <div style={{ width: 120 }}><NumInput value={Math.round(f.pct * 1000) / 10} onChange={(v) => set("fees", p.fees.map((x, j) => (j === idx ? { ...x, pct: v / 100 } : x)))} suffix="%" min={0} /></div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="4 · Pricing & growth">
            <Seg value={p.method} onChange={(v) => set("method", v)} options={[{ value: "markup", label: "Markup on cost" }, { value: "margin", label: "Target profit margin" }, { value: "manual", label: "Set my own price" }]} />
            <div className="form-grid" style={{ marginTop: 14 }}>
              {p.method === "manual" ? (
                <Field label="Selling price"><NumInput value={p.manualPrice} onChange={(v) => set("manualPrice", v)} min={0} prefix={currency} /></Field>
              ) : (
                <Field label={p.method === "markup" ? "Markup" : "Target margin"} hint={p.method === "markup" ? "Added on top of full unit cost" : "Profit as a share of the selling price"}>
                  <NumInput value={p.methodValue} onChange={(v) => set("methodValue", v)} min={0} suffix="%" />
                </Field>
              )}
              <Field label="Sales growth per month" hint="Compounded"><NumInput value={p.growthPct} onChange={(v) => set("growthPct", v)} suffix="%" /></Field>
              <Field label="Price increase per year"><NumInput value={p.priceIncreasePct} onChange={(v) => set("priceIncreasePct", v)} suffix="%" /></Field>
              <Field label="Cost inflation per year"><NumInput value={p.costInflationPct} onChange={(v) => set("costInflationPct", v)} suffix="%" /></Field>
            </div>
          </Card>
        </div>

        <div className="stack" style={{ gap: 16, position: "sticky", top: 80, alignSelf: "start" }}>
          <Card title="Result">
            {!valid ? (
              <Alert level="critical" title="Price can't be calculated" detail="The margin plus fees add up to 100% or more. Lower the target margin or fees." />
            ) : (
              <>
                <div className="small muted">Suggested selling price</div>
                <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em" }}>{money(r.price, currency, { cents: true })}</div>
                <div className="row wrap" style={{ gap: 6, marginBottom: 14 }}>
                  <Pill level={r.margin >= 0.2 ? "good" : r.margin >= 0.08 ? "warning" : "critical"}>{pct(r.margin)} net margin</Pill>
                  <Pill>{pct(r.markup)} markup</Pill>
                </div>
                <dl className="kv">
                  <dt>Materials</dt><dd>{money(r.materials, currency, { cents: true })}</dd>
                  <dt>Labour</dt><dd>{money(r.labour, currency, { cents: true })}</dd>
                  <dt>Overhead share</dt><dd>{money(r.overhead, currency, { cents: true })}</dd>
                  <dt>Fees ({pct(r.feePct)})</dt><dd>{money(r.fees, currency, { cents: true })}</dd>
                  <dt className="total">Full cost per unit</dt><dd className="total">{money(r.full + r.fees, currency, { cents: true })}</dd>
                  <dt>Profit per unit</dt><dd style={{ color: r.profitPerUnit < 0 ? "var(--critical-ink)" : "var(--good-ink)" }}>{money(r.profitPerUnit, currency, { cents: true })}</dd>
                </dl>
              </>
            )}
          </Card>
          {valid && (
            <Card title="Per month">
              <dl className="kv">
                <dt>Revenue</dt><dd>{money(r.monthlyRevenue, currency)}</dd>
                <dt>Profit</dt><dd style={{ color: r.monthlyProfit < 0 ? "var(--critical-ink)" : undefined }}>{money(r.monthlyProfit, currency)}</dd>
                <dt>Break-even volume</dt><dd>{r.breakEven != null ? `${r.breakEven.toLocaleString()} units` : "Never"}</dd>
              </dl>
              {r.breakEven != null && p.unitsPerMonth < r.breakEven && <div style={{ marginTop: 12 }}><Alert level="warning" title="Below break-even" detail={`You need ${(r.breakEven - p.unitsPerMonth).toLocaleString()} more units a month to cover fixed costs.`} /></div>}
            </Card>
          )}
        </div>
      </div>

      {valid && (
        <div className="grid g2">
          <Card title="12-month projection" subtitle={`${money(totalRev, currency, { compact: true })} revenue · ${money(totalProfit, currency, { compact: true })} profit, with ${p.growthPct}% monthly growth compounded`}>
            <MultiLine
              currency={currency}
              labels={proj.map((m) => `M${m.i + 1}`)}
              series={[
                { label: "Revenue", data: proj.map((m) => m.revenue), slot: 0 },
                { label: "Total cost", data: proj.map((m) => m.cost), slot: 1 },
                { label: "Profit", data: proj.map((m) => m.profit), slot: 2 },
              ]}
            />
          </Card>
          <Card title="Compound pricing — 5 years" subtitle={`Price +${p.priceIncreasePct}%/yr vs costs +${p.costInflationPct}%/yr`} flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Year</th><th className="r">Price</th><th className="r">Unit cost</th><th className="r">Margin</th><th className="r">Units</th><th className="r">Revenue</th></tr></thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y.year}>
                      <td>Year {y.year}</td>
                      <td className="r">{money(y.price, currency, { cents: true })}</td>
                      <td className="r">{money(y.unitCost, currency, { cents: true })}</td>
                      <td className="r" style={{ color: y.margin < 0.05 ? "var(--critical-ink)" : undefined }}>{pct(y.margin)}</td>
                      <td className="r">{Math.round(y.units).toLocaleString()}</td>
                      <td className="r">{money(y.revenue, currency, { compact: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {p.costInflationPct > p.priceIncreasePct && <div style={{ padding: 16 }}><Alert level="warning" title="Margin is shrinking every year" detail="Costs are rising faster than your prices. Plan regular price reviews." /></div>}
          </Card>
        </div>
      )}

      {state.products?.length > 0 && (
        <Card title="Saved products" flush>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>Industry preset</th><th className="r">Price</th><th className="r">Full cost</th><th className="r">Margin</th><th /></tr></thead>
              <tbody>
                {state.products.map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.name}</b></td>
                    <td className="muted">{getIndustry(x.industry).label}</td>
                    <td className="r">{money(x.summary.price, currency, { cents: true })}</td>
                    <td className="r">{money(x.summary.cost, currency, { cents: true })}</td>
                    <td className="r">{pct(x.summary.margin)}</td>
                    <td className="r" style={{ whiteSpace: "nowrap" }}>
                      <button className="btn sm" onClick={() => setP(structuredClone(x))}>Open</button>
                      {canSave && <button className="btn ghost icon-btn" onClick={() => update("pricing.edit", (s) => (s.products = s.products.filter((y) => y.id !== x.id)), `Deleted product ${x.name}`)} aria-label="Delete"><Icon name="trash" size={16} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
