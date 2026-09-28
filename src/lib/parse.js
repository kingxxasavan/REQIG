// File import. Accepts CSV, TSV, JSON and Excel (.xlsx) exports from
// whatever the business already uses, and maps loosely-named columns onto
// EPRI's categories. Two shapes are understood:
//   wide — one row per month:   month, revenue, production, payroll, ...
//   long — one row per entry:   date, category, amount   (aggregated per month)

import Papa from "papaparse";
import { CAT_KEYS } from "./analytics.js";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED = [".csv", ".tsv", ".txt", ".json", ".xlsx"];

const ALIASES = {
  month: ["month", "period", "date", "month/year", "mo"],
  revenue: ["revenue", "sales", "income", "turnover", "gross sales", "total revenue", "net sales"],
  production: ["production", "cogs", "cost of goods sold", "cost of sales", "materials", "inventory", "supplies", "ingredients", "raw materials"],
  operations: ["operations", "operating", "opex", "rent", "utilities", "software", "logistics", "insurance", "shipping", "overhead"],
  payroll: ["payroll", "salaries", "salary", "wages", "labor", "labour", "staff", "benefits"],
  marketing: ["marketing", "advertising", "ads", "promotion", "promotions", "ad spend"],
  other: ["other", "misc", "miscellaneous", "fees", "repairs", "maintenance"],
  category: ["category", "type", "account", "expense type", "description"],
  amount: ["amount", "value", "total", "cost", "sum"],
  kind: ["kind", "direction", "income/expense", "debit/credit"],
};

const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");

export function matchField(header) {
  const h = norm(header);
  for (const [field, list] of Object.entries(ALIASES)) if (list.includes(h)) return field;
  for (const [field, list] of Object.entries(ALIASES)) if (list.some((a) => a.length > 3 && h.includes(a))) return field;
  return null;
}

// "$1,234.50", "(300)", "1 234" → numbers. Parentheses mean negative.
export function toNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  let s = String(v).trim();
  const neg = /^\(.*\)$/.test(s) || s.startsWith("-");
  s = s.replace(/[^0-9.]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Accepts 2025-03, 2025-03-14, 03/2025, 3/14/2025, Mar 2025, March-25, Excel dates.
export function toMonthKey(v) {
  if (v instanceof Date && !isNaN(v)) return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}`;
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86_400_000);
    return toMonthKey(d);
  }
  const s = String(v ?? "").trim().toLowerCase();
  let m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, "0")}`;
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) return `${m[3]}-${m[1].padStart(2, "0")}`;
  if ((m = s.match(/^(\d{1,2})[-/.](\d{4})$/))) return `${m[2]}-${m[1].padStart(2, "0")}`;
  if ((m = s.match(/^([a-z]{3})[a-z]*[\s\-/,']*(\d{2,4})$/))) {
    const mi = MONTHS.indexOf(m[1]);
    if (mi >= 0) {
      const y = m[2].length === 2 ? `20${m[2]}` : m[2];
      return `${y}-${String(mi + 1).padStart(2, "0")}`;
    }
  }
  return null;
}

function categoryFor(label) {
  const f = matchField(label);
  if (f && (CAT_KEYS.includes(f) || f === "revenue")) return f;
  return "other";
}

// rows: array of objects keyed by header.
export function rowsToMonths(rows) {
  const warnings = [];
  if (!rows.length) return { months: [], warnings: ["The file has no rows."] };
  const headers = Object.keys(rows[0]);
  const map = {};
  for (const h of headers) {
    const f = matchField(h);
    if (f && !map[f]) map[f] = h;
    else if (f && CAT_KEYS.includes(f)) (map[`${f}+`] = map[`${f}+`] || []).push(h); // extra columns that roll up
  }
  if (!map.month) return { months: [], warnings: ["Couldn't find a month or date column."] };

  const byMonth = {};
  const blank = (month) => (byMonth[month] = byMonth[month] || { month, revenue: 0, ...Object.fromEntries(CAT_KEYS.map((k) => [k, 0])) });
  let skipped = 0;

  const isLong = map.amount && map.category && !map.revenue;
  for (const row of rows) {
    const month = toMonthKey(row[map.month]);
    if (!month) {
      skipped++;
      continue;
    }
    const m = blank(month);
    if (isLong) {
      const amt = toNumber(row[map.amount]);
      const cat = categoryFor(row[map.category]);
      const kind = map.kind ? norm(row[map.kind]) : "";
      if (cat === "revenue" || kind.startsWith("inc") || kind === "credit") m.revenue += Math.abs(amt);
      else m[cat] += Math.abs(amt);
    } else {
      if (map.revenue) m.revenue += toNumber(row[map.revenue]);
      for (const k of CAT_KEYS) {
        if (map[k]) m[k] += toNumber(row[map[k]]);
        for (const extra of map[`${k}+`] || []) m[k] += toNumber(row[extra]);
      }
    }
  }
  if (skipped) warnings.push(`${skipped} row(s) skipped — the date couldn't be read.`);
  const unmapped = headers.filter((h) => !matchField(h));
  if (unmapped.length && !isLong) warnings.push(`Ignored column(s): ${unmapped.join(", ")}.`);
  const months = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  if (months.length && months.length < 12) warnings.push(`Only ${months.length} month(s) found — 12 months gives the most accurate baseline.`);
  return { months, warnings, mode: isLong ? "transactions" : "monthly" };
}

export function rowsToEmployees(rows) {
  const pickKey = (row, names) => Object.keys(row).find((k) => names.includes(norm(k)));
  return rows
    .map((row) => {
      const nameK = pickKey(row, ["name", "employee", "employee name", "full name"]);
      const salK = pickKey(row, ["salary", "annual salary", "pay", "wage", "compensation"]);
      const deptK = pickKey(row, ["department", "dept", "team"]);
      const titleK = pickKey(row, ["title", "role", "position", "job title"]);
      const typeK = pickKey(row, ["type", "employment type", "status"]);
      if (!nameK) return null;
      return { name: String(row[nameK]).trim(), salary: toNumber(row[salK]), dept: deptK ? String(row[deptK]).trim() : "Operations", title: titleK ? String(row[titleK]).trim() : "", type: typeK ? String(row[typeK]).trim() : "Full-time" };
    })
    .filter((e) => e && e.name);
}

function sheetToObjects(sheet) {
  const headerIdx = sheet.findIndex((r) => r.filter((c) => c != null && c !== "").length >= 2);
  if (headerIdx < 0) return [];
  const headers = sheet[headerIdx].map((h) => String(h ?? "").trim());
  return sheet.slice(headerIdx + 1).filter((r) => r.some((c) => c != null && c !== "")).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

export async function readFileRows(file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!ACCEPTED.includes(ext)) throw new Error(`Unsupported file type ${ext}. Use CSV, TSV, JSON or XLSX.`);
  if (file.size > MAX_FILE_BYTES) throw new Error("File is larger than 5 MB.");
  if (ext === ".xlsx") {
    const { readSheet } = await import("read-excel-file/browser");
    return sheetToObjects(await readSheet(file));
  }
  const text = await file.text();
  if (ext === ".json") {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.months || data.rows || data.data || [];
    if (!Array.isArray(arr)) throw new Error("JSON must be an array of rows.");
    return arr;
  }
  const res = Papa.parse(text.trim(), { header: true, skipEmptyLines: true, delimiter: ext === ".tsv" ? "\t" : "" });
  return res.data;
}

// Cells that start with = + - @ are executed as formulas by spreadsheet
// apps; prefix them so an exported file can't carry a formula injection.
export function csvSafe(v) {
  const s = String(v ?? "");
  const escaped = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(escaped) ? `"${escaped.replace(/"/g, '""')}"` : escaped;
}

export function toCSV(rows, columns) {
  const head = columns.map((c) => csvSafe(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvSafe(typeof c.value === "function" ? c.value(r) : r[c.key])).join(","));
  return [head, ...body].join("\n");
}

export function download(filename, content, type = "text/csv") {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
