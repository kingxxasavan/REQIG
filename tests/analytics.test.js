import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, enrich, linearFit, detectAnomalies, budgetStatus, forecast } from "../src/lib/analytics.js";
import { generateDemo, generateMonths, DEMO_INDUSTRIES } from "../src/lib/demo.js";

test("enrich computes expenses, profit and margin", () => {
  const [r] = enrich([{ month: "2026-01", revenue: 1000, production: 300, operations: 100, payroll: 200, marketing: 50, other: 50 }]);
  assert.equal(r.expenses, 700);
  assert.equal(r.profit, 300);
  assert.equal(r.margin, 0.3);
});

test("linearFit recovers a straight line", () => {
  const { slope, intercept } = linearFit([2, 4, 6, 8]);
  assert.ok(Math.abs(slope - 2) < 1e-9);
  assert.ok(Math.abs(intercept - 2) < 1e-9);
});

test("a spending spike in the latest month is flagged", () => {
  const months = Array.from({ length: 7 }, (_, i) => ({ month: `2026-0${i + 1}`, revenue: 10000, production: 3000, operations: 1500, payroll: 3000, marketing: 500 + (i % 2) * 20, other: 100 }));
  months[6].marketing = 1400;
  const a = detectAnomalies(enrich(months));
  assert.ok(a.some((x) => x.key === "marketing" && x.direction === "up"));
});

test("budget pace uses the fiscal year to date", () => {
  const rows = enrich(Array.from({ length: 6 }, (_, i) => ({ month: `2026-0${i + 1}`, revenue: 0, production: 0, operations: 0, payroll: 0, marketing: 1000, other: 0 })));
  const b = budgetStatus(rows, { marketing: 6000 }, 1).find((x) => x.key === "marketing");
  assert.equal(b.prorated, 3000);
  assert.equal(b.pace, 2);
  assert.equal(b.status, "over");
  assert.equal(b.projected, 12000);
});

test("forecast returns the requested horizon with consecutive months", () => {
  const fc = forecast(enrich(generateMonths("retail", { endMonth: "2026-08" })), 3);
  assert.deepEqual(fc.map((f) => f.month), ["2026-09", "2026-10", "2026-11"]);
  assert.ok(fc.every((f) => f.revenue > 0));
});

test("every demo industry produces a full analysis with alerts", () => {
  for (const k of DEMO_INDUSTRIES) {
    const a = analyze(generateDemo(k));
    assert.equal(a.rows.length, 12, k);
    assert.ok(a.health.score >= 0 && a.health.score <= 100, k);
    assert.ok(a.alerts.length > 0, k);
    assert.ok(a.insights.length > 2, k);
    assert.ok(a.alerts.some((x) => /Marketing/.test(x.title)), `${k} should flag the marketing overspend`);
  }
});
