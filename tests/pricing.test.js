import { test } from "node:test";
import assert from "node:assert/strict";
import { unitCosts, evaluate, project, compoundYears } from "../src/lib/pricing.js";
import { channelSplit } from "../src/lib/planner.js";

const base = {
  items: [{ price: 2, qty: 1.5 }, { price: 1, qty: 1 }], // $4 materials
  labourHours: 0.5, labourRate: 20, // $10 labour
  fees: [{ pct: 0.05, on: true }, { pct: 0.1, on: false }],
  fixedMonthly: 1000, unitsPerMonth: 500, // $2 overhead
  method: "markup", methodValue: 50,
  growthPct: 0, priceIncreasePct: 0, costInflationPct: 0,
};

test("unit costs add materials, labour and overhead; only enabled fees count", () => {
  const c = unitCosts(base);
  assert.equal(c.materials, 4);
  assert.equal(c.labour, 10);
  assert.equal(c.overhead, 2);
  assert.equal(c.full, 16);
  assert.equal(c.feePct, 0.05);
});

test("target-margin pricing hits the margin after fees", () => {
  const r = evaluate({ ...base, method: "margin", methodValue: 30 });
  assert.ok(Math.abs(r.margin - 0.3) < 1e-9);
});

test("markup pricing leaves the markup after fees are paid", () => {
  const r = evaluate(base);
  assert.ok(Math.abs(r.price - r.fees - 24) < 1e-9); // 16 * 1.5
});

test("break-even covers fixed costs with contribution margin", () => {
  const r = evaluate({ ...base, method: "manual", manualPrice: 20 });
  // contribution = 20 - (4 + 10) - 1 (5% fee) = 5 → 1000 / 5 = 200
  assert.equal(r.breakEven, 200);
});

test("volume growth compounds monthly", () => {
  const p = project({ ...base, growthPct: 10 }, 3);
  assert.ok(Math.abs(p[2].units - 500 * 1.1 * 1.1) < 1e-9);
});

test("compound years shrink margin when costs outpace price", () => {
  const y = compoundYears({ ...base, priceIncreasePct: 2, costInflationPct: 6 }, 3);
  assert.ok(y[2].margin < y[0].margin);
});

test("channel split sums to 1 and follows the audience", () => {
  const young = channelSplit({ customerType: "B2C", reach: "National / online", ages: { "18-24": 60, "25-34": 30, "35-44": 10, "45-54": 0, "55+": 0 } });
  const b2b = channelSplit({ customerType: "B2B", reach: "Regional", ages: { "18-24": 0, "25-34": 30, "35-44": 40, "45-54": 30, "55+": 0 } });
  assert.ok(Math.abs(young.reduce((s, c) => s + c.share, 0) - 1) < 1e-9);
  assert.deepEqual(young.slice(0, 2).map((c) => c.key).sort(), ["instagram", "social_short"]);
  assert.equal(young[young.length - 1].key, "local");
  assert.equal(b2b[0].key, "linkedin");
});

test("advisor matches topics on whole words and falls back to the page", async () => {
  const { localAnswer } = await import("../src/lib/advisor.js");
  const { generateDemo } = await import("../src/lib/demo.js");
  const { analyze } = await import("../src/lib/analytics.js");
  const s = generateDemo("restaurant");
  const a = analyze(s);
  assert.ok(!localAnswer("Is this bad?", a, s, "USD").startsWith("Marketing:"), '"bad" must not match "ad"');
  assert.ok(!localAnswer("what's my current margin?", a, s, "USD").startsWith("Operations:"), '"current" must not match "rent"');
  assert.ok(localAnswer("Is marketing too high?", a, s, "USD").startsWith("Marketing:"));
  assert.ok(localAnswer("Is this bad?", a, s, "USD", "inventory").includes("costing you the most"));
});
