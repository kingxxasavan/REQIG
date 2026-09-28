// Realistic sample workspaces, one per industry, so the product can be shown
// without anyone's real books. Seeded, so the same industry always produces
// the same company — handy when demoing the same story twice.

import { getIndustry } from "./industries.js";
import { addMonths, uid } from "./format.js";
import { CAT_KEYS } from "./analytics.js";

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PROFILES = {
  restaurant: { name: "Harbor Street Bakery & Café", employees: 14, monthly: 62000, season: [0.85, 0.82, 0.92, 0.98, 1.05, 1.12, 1.18, 1.15, 1.02, 0.98, 1.0, 1.22] },
  ecommerce: { name: "Northwind Home Goods", employees: 9, monthly: 88000, season: [0.8, 0.78, 0.88, 0.92, 0.95, 0.93, 0.9, 0.94, 0.98, 1.08, 1.35, 1.5] },
  technology: { name: "Brightline Software", employees: 18, monthly: 145000, season: [0.95, 0.97, 1.0, 1.0, 1.01, 0.98, 0.95, 0.96, 1.02, 1.04, 1.05, 1.07] },
  retail: { name: "Maple & Main Outfitters", employees: 11, monthly: 71000, season: [0.78, 0.8, 0.92, 0.98, 1.02, 1.0, 0.98, 1.08, 1.02, 1.0, 1.15, 1.4] },
  manufacturing: { name: "Ridgeway Precision Parts", employees: 26, monthly: 210000, season: [0.92, 0.96, 1.05, 1.06, 1.04, 1.0, 0.9, 0.95, 1.05, 1.06, 1.02, 0.95] },
  construction: { name: "Summit Renovation Co.", employees: 16, monthly: 128000, season: [0.7, 0.72, 0.9, 1.08, 1.18, 1.22, 1.2, 1.18, 1.1, 1.0, 0.85, 0.7] },
  services: { name: "Clearpath Consulting Group", employees: 8, monthly: 76000, season: [0.9, 1.0, 1.05, 1.02, 1.0, 0.95, 0.85, 0.88, 1.05, 1.1, 1.08, 0.92] },
};

export const DEMO_INDUSTRIES = Object.keys(PROFILES);

const FIRST = ["Maya", "Jordan", "Priya", "Luis", "Aisha", "Tom", "Grace", "Omar", "Elena", "Sam", "Nina", "Kofi", "Hannah", "Ravi", "Chloe", "Marcus", "Zoe", "Ben", "Leah", "Dev", "Ivy", "Noah", "Tara", "Felix", "Rosa", "Kai"];
const LAST = ["Chen", "Rivera", "Patel", "Okafor", "Nguyen", "Brooks", "Silva", "Hassan", "Kim", "Murphy", "Lopez", "Mensah", "Walsh", "Iyer", "Dubois", "Grant"];

export function lastCompleteMonth(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function generateMonths(industryKey, { endMonth = lastCompleteMonth(), count = 12, seed = 7, monthly, season } = {}) {
  const prof = PROFILES[industryKey] || PROFILES.services;
  const ind = getIndustry(industryKey);
  const r = rng(seed + industryKey.length * 101);
  const base = monthly ?? prof.monthly;
  const seas = season ?? prof.season;
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const month = addMonths(endMonth, -i);
    const t = count - 1 - i;
    const mi = Number(month.slice(5)) - 1;
    const revenue = base * seas[mi] * (1 + t * 0.006) * (0.96 + r() * 0.08);
    const row = { month, revenue: Math.round(revenue) };
    for (const k of CAT_KEYS) {
      const [lo, hi] = ind.benchmarks[k] || [0.02, 0.04];
      let share = lo + (hi - lo) * (0.35 + r() * 0.3);
      if (k === "other") share = 0.02 + r() * 0.015;
      // Fixed costs don't flex with seasonal revenue.
      const basis = k === "operations" || k === "payroll" ? base * (1 + t * 0.004) : revenue;
      row[k] = Math.round(basis * share);
    }
    months.push(row);
  }
  // Calibrate so the year lands in the middle of the industry's typical net
  // margin (a little above, since the story beats below eat into it).
  const [mlo, mhi] = ind.benchmarks.netMargin;
  const target = (mlo + mhi) / 2 + 0.02;
  const rev = months.reduce((s, m) => s + m.revenue, 0);
  const exp = months.reduce((s, m) => s + CAT_KEYS.reduce((t, k) => t + m[k], 0), 0);
  const scale = ((1 - target) * rev) / exp;
  months.forEach((m) => CAT_KEYS.forEach((k) => (m[k] = Math.round(m[k] * scale))));
  // Story beats for the demo: a marketing overspend in the latest month and
  // production creeping up over the last quarter.
  const last = months[months.length - 1];
  last.marketing = Math.round(last.marketing * 1.55);
  months.slice(-3).forEach((m, i) => (m.production = Math.round(m.production * (1.06 + i * 0.05))));
  return months;
}

export function generateDemo(industryKey = "restaurant") {
  const prof = PROFILES[industryKey] || PROFILES.services;
  const ind = getIndustry(industryKey);
  const r = rng(99 + industryKey.length);
  const months = generateMonths(industryKey);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];

  const avg = (k) => months.reduce((a, m) => a + m[k], 0) / months.length;
  const budgets = {
    production: Math.round(avg("production") * 12 * 0.97),
    operations: Math.round(avg("operations") * 12 * 1.04),
    payroll: Math.round(avg("payroll") * 12 * 1.02),
    marketing: Math.round(avg("marketing") * 12 * 0.9),
    other: Math.round(avg("other") * 12 * 1.1),
  };

  const depts = ["Operations", "Production", "Sales & Marketing", "Finance", "Customer Service", "Management"];
  const titles = { Operations: "Operations Associate", Production: "Production Lead", "Sales & Marketing": "Marketing Coordinator", Finance: "Bookkeeper", "Customer Service": "Customer Service Rep", Management: "General Manager" };
  const monthlyPayroll = avg("payroll");
  const employees = [];
  for (let i = 0; i < prof.employees; i++) {
    const dept = i === 0 ? "Management" : i === 1 ? "Finance" : pick(depts.slice(0, 5));
    employees.push({ id: uid(), name: `${FIRST[i % FIRST.length]} ${pick(LAST)}`, title: titles[dept], dept, type: r() > 0.8 ? "Part-time" : "Full-time", weight: dept === "Management" ? 2 : r() * 0.6 + 0.8 });
  }
  const wsum = employees.reduce((a, e) => a + e.weight, 0);
  employees.forEach((e) => {
    e.salary = Math.round(((monthlyPayroll * 12 * 0.85) * e.weight) / wsum / 100) * 100;
    delete e.weight;
  });

  const team = [
    { id: "u-owner", name: employees[0].name, email: "owner@example.com", role: "owner", dept: "Management", employeeId: employees[0].id },
    { id: "u-fin", name: employees[1].name, email: "finance@example.com", role: "finance", dept: "Finance", employeeId: employees[1].id },
    { id: "u-dept", name: employees[2].name, email: "ops@example.com", role: "department", dept: employees[2].dept, employeeId: employees[2].id },
    { id: "u-view", name: employees[3].name, email: "staff@example.com", role: "viewer", dept: employees[3].dept, employeeId: employees[3].id },
  ];

  const mats = ind.materials;
  const suppliers = [
    { id: uid(), name: "Lakeside Wholesale", category: mats[0].name, contact: "orders@lakeside.example", leadDays: 3, onTimeRate: 0.96, rating: 5 },
    { id: uid(), name: "Prime Supply Partners", category: mats[1]?.name || "General", contact: "sales@primesupply.example", leadDays: 7, onTimeRate: 0.88, rating: 4 },
    { id: uid(), name: "QuickShip Distributors", category: mats[2]?.name || "General", contact: "hello@quickship.example", leadDays: 5, onTimeRate: 0.71, rating: 2 },
  ];
  const inventory = Array.from({ length: 6 }, (_, i) => {
    const m = mats[i % mats.length];
    const qty = Math.round(40 + r() * 400);
    return { id: uid(), sku: `SKU-${1001 + i}`, name: i < mats.length ? m.name : `${m.name} (bulk)`, unit: m.unit, supplierId: suppliers[i % 3].id, qty, received: qty + Math.round(r() * 300), unitCost: m.price, reorderAt: Math.round(qty * (0.3 + r() * 0.6)) };
  });
  // QuickShip is the problem supplier in the story.
  inventory[inventory.length - 1].qty = Math.round(inventory[inventory.length - 1].reorderAt * 0.6);
  const lastM = months[months.length - 1].month;
  const day = (offsetMonths, d) => `${addMonths(lastM, offsetMonths)}-${String(d).padStart(2, "0")}`;
  const damages = [
    { id: uid(), date: day(0, 4), itemId: inventory[2].id, qty: 38, reason: "Crushed in transit" },
    { id: uid(), date: day(-1, 17), itemId: inventory[5].id, qty: 24, reason: "Water damage" },
    { id: uid(), date: day(-2, 9), itemId: inventory[2].id, qty: 15, reason: "Wrong spec delivered" },
    { id: uid(), date: day(-3, 21), itemId: inventory[0].id, qty: 4, reason: "Expired" },
  ];
  const returns = [
    { id: uid(), date: day(0, 11), itemId: inventory[2].id, qty: 6, reason: "Defective", refund: 240, restocked: false },
    { id: uid(), date: day(0, 19), itemId: inventory[1].id, qty: 2, reason: "Changed mind", refund: 60, restocked: true },
    { id: uid(), date: day(-1, 3), itemId: inventory[5].id, qty: 9, reason: "Damaged on arrival", refund: 410, restocked: false },
    { id: uid(), date: day(-2, 26), itemId: inventory[3].id, qty: 3, reason: "Wrong item", refund: 95, restocked: true },
  ];
  const complaints = [
    { id: uid(), date: day(0, 6), customer: "R. Alvarez", channel: "Phone", category: "Product quality", severity: "high", status: "open", cost: 180, notes: "Item arrived broken; replacement sent.", resolvedOn: "" },
    { id: uid(), date: day(0, 14), customer: "K. Osei", channel: "Email", category: "Late delivery", severity: "medium", status: "open", cost: 45, notes: "Refunded shipping.", resolvedOn: "" },
    { id: uid(), date: day(0, 22), customer: "J. Park", channel: "Review site", category: "Customer service", severity: "low", status: "open", cost: 0, notes: "", resolvedOn: "" },
    { id: uid(), date: day(-1, 8), customer: "M. Fischer", channel: "In person", category: "Billing error", severity: "medium", status: "resolved", cost: 120, notes: "Double charge reversed.", resolvedOn: day(-1, 10) },
    { id: uid(), date: day(-1, 20), customer: "S. Ahmed", channel: "Social media", category: "Product quality", severity: "high", status: "resolved", cost: 320, notes: "Full refund + voucher.", resolvedOn: day(-1, 27) },
    { id: uid(), date: day(-2, 12), customer: "L. Moreau", channel: "Phone", category: "Late delivery", severity: "low", status: "resolved", cost: 25, notes: "", resolvedOn: day(-2, 13) },
  ];

  const b2b = !!ind.b2bDefault || industryKey === "services" || industryKey === "manufacturing";
  return {
    version: 1,
    onboarded: true,
    demo: true,
    company: {
      name: prof.name,
      industry: industryKey,
      employees: prof.employees,
      currency: "USD",
      fiscalStart: 1,
      location: "Springfield",
      cashOnHand: Math.round(prof.monthly * 1.6),
    },
    demographics: {
      customerType: b2b ? "B2B" : "B2C",
      reach: industryKey === "ecommerce" || industryKey === "technology" ? "National / online" : "Local",
      ages: b2b ? { "18-24": 5, "25-34": 30, "35-44": 35, "45-54": 20, "55+": 10 } : { "18-24": 18, "25-34": 30, "35-44": 24, "45-54": 16, "55+": 12 },
    },
    months,
    budgets,
    employees,
    team,
    currentUserId: "u-owner",
    suppliers,
    inventory,
    damages,
    returns,
    complaints,
    products: [],
    audit: [{ id: uid(), at: new Date().toISOString(), user: team[0].name, action: "Workspace created from sample data" }],
  };
}
