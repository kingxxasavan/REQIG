// Pricing math for the Pricing Studio. Pure, so it's testable.
//
// Variable cost per unit = materials + labour + percentage fees on price.
// Fixed costs are monthly and spread over the month's unit volume.

export function unitCosts(p) {
  const materials = (p.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const labour = (Number(p.labourHours) || 0) * (Number(p.labourRate) || 0);
  const feePct = (p.fees || []).filter((f) => f.on).reduce((s, f) => s + (Number(f.pct) || 0), 0);
  const units = Math.max(1, Number(p.unitsPerMonth) || 1);
  const overhead = (Number(p.fixedMonthly) || 0) / units;
  return { materials, labour, feePct, overhead, direct: materials + labour, full: materials + labour + overhead };
}

// Price from the chosen method. Percentage fees are taken off the selling
// price, so they're solved for rather than simply added.
export function priceFor(p, c = unitCosts(p)) {
  const m = Number(p.methodValue) || 0;
  if (p.method === "manual") return Number(p.manualPrice) || 0;
  if (p.method === "margin") {
    const denom = 1 - m / 100 - c.feePct;
    return denom > 0 ? c.full / denom : Infinity;
  }
  // markup on full cost, then gross up for fees
  const denom = 1 - c.feePct;
  return denom > 0 ? (c.full * (1 + m / 100)) / denom : Infinity;
}

export function evaluate(p) {
  const c = unitCosts(p);
  const price = priceFor(p, c);
  const fees = price * c.feePct;
  const variable = c.direct + fees;
  const contribution = price - variable;
  const profitPerUnit = price - c.full - fees;
  const units = Number(p.unitsPerMonth) || 0;
  const fixed = Number(p.fixedMonthly) || 0;
  const breakEven = contribution > 0 ? Math.ceil(fixed / contribution) : null;
  return {
    ...c,
    price,
    fees,
    variable,
    contribution,
    profitPerUnit,
    margin: price > 0 ? profitPerUnit / price : null,
    markup: c.full > 0 ? (price - c.full) / c.full : null,
    breakEven,
    monthlyRevenue: price * units,
    monthlyProfit: contribution * units - fixed,
  };
}

// Month-by-month projection with compounding volume growth, and price and
// cost changes compounded monthly from their annual rates.
export function project(p, months = 12) {
  const base = evaluate(p);
  const g = (Number(p.growthPct) || 0) / 100;
  const pi = Math.pow(1 + (Number(p.priceIncreasePct) || 0) / 100, 1 / 12) - 1;
  const ci = Math.pow(1 + (Number(p.costInflationPct) || 0) / 100, 1 / 12) - 1;
  const fixed = Number(p.fixedMonthly) || 0;
  const out = [];
  let units = Number(p.unitsPerMonth) || 0;
  for (let i = 0; i < months; i++) {
    const price = base.price * Math.pow(1 + pi, i);
    const direct = base.direct * Math.pow(1 + ci, i);
    const revenue = price * units;
    const cost = (direct + price * base.feePct) * units + fixed * Math.pow(1 + ci, i);
    out.push({ i, units, price, revenue, cost, profit: revenue - cost });
    units *= 1 + g;
  }
  return out;
}

// Year-by-year compound view: price, unit cost and margin as each compounds.
export function compoundYears(p, years = 5) {
  const base = evaluate(p);
  const pi = (Number(p.priceIncreasePct) || 0) / 100;
  const ci = (Number(p.costInflationPct) || 0) / 100;
  const g = (Number(p.growthPct) || 0) / 100;
  const units0 = (Number(p.unitsPerMonth) || 0) * 12;
  return Array.from({ length: years }, (_, y) => {
    const price = base.price * Math.pow(1 + pi, y);
    const unitCost = base.full * Math.pow(1 + ci, y) + price * base.feePct;
    const units = units0 * Math.pow(1 + g, 12 * y);
    return { year: y + 1, price, unitCost, margin: price > 0 ? (price - unitCost) / price : null, units, revenue: price * units, profit: (price - unitCost) * units };
  });
}
