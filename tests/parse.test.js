import { test } from "node:test";
import assert from "node:assert/strict";
import { rowsToMonths, toMonthKey, toNumber, csvSafe, matchField, rowsToEmployees } from "../src/lib/parse.js";

test("month keys from many date formats", () => {
  assert.equal(toMonthKey("2025-03"), "2025-03");
  assert.equal(toMonthKey("2025-03-14"), "2025-03");
  assert.equal(toMonthKey("3/14/2025"), "2025-03");
  assert.equal(toMonthKey("03/2025"), "2025-03");
  assert.equal(toMonthKey("Mar 2025"), "2025-03");
  assert.equal(toMonthKey("September-25"), "2025-09");
  assert.equal(toMonthKey(45731), "2025-03"); // Excel serial
  assert.equal(toMonthKey("not a date"), null);
});

test("money strings become numbers", () => {
  assert.equal(toNumber("$1,234.50"), 1234.5);
  assert.equal(toNumber("(300)"), -300);
  assert.equal(toNumber(""), 0);
});

test("column aliases map onto categories", () => {
  assert.equal(matchField("Sales"), "revenue");
  assert.equal(matchField("COGS"), "production");
  assert.equal(matchField("Wages"), "payroll");
  assert.equal(matchField("Ad Spend"), "marketing");
});

test("wide monthly sheet with extra operations columns rolls them up", () => {
  const { months } = rowsToMonths([
    { Month: "2026-01", Sales: "10,000", COGS: 3000, Rent: 1000, Utilities: 200, Wages: 2500, Advertising: 400 },
  ]);
  assert.equal(months[0].revenue, 10000);
  assert.equal(months[0].operations, 1200);
  assert.equal(months[0].payroll, 2500);
});

test("long transaction list is aggregated per month", () => {
  const { months, mode } = rowsToMonths([
    { Date: "2026-01-03", Category: "Sales", Amount: "500" },
    { Date: "2026-01-09", Category: "Sales", Amount: "700" },
    { Date: "2026-01-10", Category: "Rent", Amount: "-900" },
    { Date: "2026-02-01", Category: "Facebook advertising", Amount: "120" },
  ]);
  assert.equal(mode, "transactions");
  assert.equal(months[0].revenue, 1200);
  assert.equal(months[0].operations, 900);
  assert.equal(months[1].marketing, 120);
});

test("employee rows", () => {
  const e = rowsToEmployees([{ Name: "A B", Salary: "$52,000", Department: "Production" }]);
  assert.deepEqual(e[0], { name: "A B", salary: 52000, dept: "Production", title: "", type: "Full-time" });
});

test("csv export neutralises formula injection", () => {
  assert.equal(csvSafe("=HYPERLINK(\"x\")"), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvSafe("+1"), "'+1");
  assert.equal(csvSafe("plain"), "plain");
});
