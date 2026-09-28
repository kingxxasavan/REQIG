// Industry profiles drive three things: the benchmark ranges the advisor
// compares against, the material presets in the Pricing Studio, and the
// advertising budget guidance in the Planner. Benchmarks are typical ranges
// for small businesses and are meant as a starting point, not an audit.

export const EXPENSE_CATEGORIES = [
  { key: "production", label: "Production", hint: "Materials, inventory, cost of goods sold" },
  { key: "operations", label: "Operations", hint: "Rent, utilities, software, logistics, insurance" },
  { key: "payroll", label: "Payroll", hint: "Salaries, wages, benefits, contractors" },
  { key: "marketing", label: "Marketing", hint: "Ads, promotions, sponsorships" },
  { key: "other", label: "Other", hint: "Fees, repairs, anything else" },
];

export const INDUSTRIES = {
  technology: {
    label: "Technology / SaaS",
    icon: "💻",
    benchmarks: { production: [0.1, 0.25], operations: [0.1, 0.2], payroll: [0.3, 0.45], marketing: [0.08, 0.2], netMargin: [0.1, 0.25] },
    adBudget: [0.08, 0.15],
    b2bDefault: true,
    tools: ["Subscription MRR tracking", "Cloud cost per customer", "Churn impact on revenue"],
    materials: [
      { name: "Cloud hosting", unit: "per user / mo", price: 1.8 },
      { name: "Third-party API usage", unit: "per 1k calls", price: 0.6 },
      { name: "Software licenses", unit: "per seat / mo", price: 12 },
      { name: "Developer time", unit: "hour", price: 55 },
      { name: "Customer support time", unit: "hour", price: 28 },
      { name: "Hardware component", unit: "unit", price: 45 },
      { name: "Domain & SSL", unit: "per year", price: 25 },
    ],
    feePct: [{ name: "Payment processing", pct: 0.029 }],
  },
  ecommerce: {
    label: "E-commerce",
    icon: "🛒",
    benchmarks: { production: [0.35, 0.5], operations: [0.1, 0.18], payroll: [0.1, 0.2], marketing: [0.08, 0.15], netMargin: [0.05, 0.15] },
    adBudget: [0.08, 0.15],
    tools: ["Landed cost per SKU", "Return-rate impact", "Marketplace fee calculator"],
    materials: [
      { name: "Product unit (wholesale)", unit: "unit", price: 8.5 },
      { name: "Packaging / mailer", unit: "unit", price: 0.65 },
      { name: "Shipping label", unit: "order", price: 5.4 },
      { name: "Pick & pack fulfilment", unit: "order", price: 2.1 },
      { name: "Branded insert / sticker", unit: "unit", price: 0.12 },
      { name: "Inbound freight", unit: "unit", price: 0.45 },
    ],
    feePct: [
      { name: "Payment processing", pct: 0.029 },
      { name: "Marketplace fee", pct: 0.08 },
      { name: "Returns allowance", pct: 0.03 },
    ],
  },
  restaurant: {
    label: "Restaurant / Food",
    icon: "🍽️",
    benchmarks: { production: [0.28, 0.35], operations: [0.12, 0.2], payroll: [0.25, 0.35], marketing: [0.02, 0.06], netMargin: [0.03, 0.1] },
    adBudget: [0.03, 0.06],
    tools: ["Plate / recipe costing", "Food-cost % tracker", "Waste & spoilage log"],
    materials: [
      { name: "Flour", unit: "kg", price: 1.1 },
      { name: "Sugar", unit: "kg", price: 1.3 },
      { name: "Butter", unit: "kg", price: 9.5 },
      { name: "Eggs", unit: "each", price: 0.35 },
      { name: "Milk", unit: "litre", price: 1.2 },
      { name: "Coffee beans", unit: "kg", price: 18 },
      { name: "Chicken", unit: "kg", price: 7.8 },
      { name: "Fresh produce", unit: "kg", price: 3.2 },
      { name: "Cooking oil", unit: "litre", price: 2.6 },
      { name: "Takeaway packaging", unit: "unit", price: 0.3 },
    ],
    feePct: [
      { name: "Card processing", pct: 0.026 },
      { name: "Delivery app commission", pct: 0.15 },
    ],
  },
  retail: {
    label: "Retail store",
    icon: "🏬",
    benchmarks: { production: [0.45, 0.6], operations: [0.12, 0.2], payroll: [0.1, 0.18], marketing: [0.03, 0.07], netMargin: [0.02, 0.08] },
    adBudget: [0.03, 0.07],
    tools: ["Keystone / markup pricing", "Shrinkage tracker", "Sell-through rate"],
    materials: [
      { name: "Wholesale item", unit: "unit", price: 12 },
      { name: "Freight in", unit: "unit", price: 0.8 },
      { name: "Shopping bag", unit: "unit", price: 0.15 },
      { name: "Price tag / label", unit: "unit", price: 0.05 },
      { name: "Display allocation", unit: "unit", price: 0.4 },
    ],
    feePct: [{ name: "Card processing", pct: 0.026 }],
  },
  manufacturing: {
    label: "Manufacturing",
    icon: "🏭",
    benchmarks: { production: [0.4, 0.55], operations: [0.12, 0.2], payroll: [0.15, 0.25], marketing: [0.02, 0.05], netMargin: [0.05, 0.12] },
    adBudget: [0.02, 0.05],
    tools: ["Bill of materials costing", "Machine-hour rate", "Scrap & defect cost"],
    materials: [
      { name: "Steel sheet", unit: "kg", price: 1.4 },
      { name: "Aluminium", unit: "kg", price: 2.9 },
      { name: "Plastic resin", unit: "kg", price: 1.8 },
      { name: "Fasteners", unit: "pack", price: 3.5 },
      { name: "Machine time", unit: "hour", price: 42 },
      { name: "Assembly labour", unit: "hour", price: 24 },
      { name: "Energy", unit: "kWh", price: 0.16 },
      { name: "Packaging crate", unit: "unit", price: 6 },
    ],
    feePct: [{ name: "Distributor margin", pct: 0.1 }],
  },
  construction: {
    label: "Construction / Trades",
    icon: "🏗️",
    benchmarks: { production: [0.35, 0.5], operations: [0.08, 0.15], payroll: [0.25, 0.35], marketing: [0.02, 0.05], netMargin: [0.05, 0.12] },
    adBudget: [0.02, 0.05],
    tools: ["Job / bid estimator", "Materials take-off", "Change-order tracking"],
    materials: [
      { name: "Lumber (2x4)", unit: "piece", price: 4.2 },
      { name: "Concrete", unit: "m³", price: 145 },
      { name: "Drywall sheet", unit: "sheet", price: 14 },
      { name: "Paint", unit: "gallon", price: 38 },
      { name: "Skilled labour", unit: "hour", price: 48 },
      { name: "Equipment rental", unit: "day", price: 180 },
      { name: "Permit", unit: "job", price: 350 },
    ],
    feePct: [{ name: "Contingency", pct: 0.1 }],
  },
  services: {
    label: "Professional services",
    icon: "💼",
    benchmarks: { production: [0.05, 0.15], operations: [0.1, 0.2], payroll: [0.4, 0.55], marketing: [0.04, 0.1], netMargin: [0.1, 0.25] },
    adBudget: [0.04, 0.1],
    tools: ["Billable-hour pricing", "Utilisation rate", "Retainer calculator"],
    materials: [
      { name: "Consultant time", unit: "hour", price: 60 },
      { name: "Junior staff time", unit: "hour", price: 30 },
      { name: "Software tools", unit: "per month", price: 90 },
      { name: "Travel", unit: "trip", price: 220 },
      { name: "Printed materials", unit: "set", price: 18 },
    ],
    feePct: [{ name: "Invoice / payment fees", pct: 0.03 }],
  },
};

export const industryList = Object.entries(INDUSTRIES).map(([key, v]) => ({ key, ...v }));

export const getIndustry = (key) => INDUSTRIES[key] || INDUSTRIES.services;

// Channel reach by audience. Weights are relative, and turn a customer
// age mix into a suggested split of the ad budget.
export const AD_CHANNELS = {
  social_short: { label: "TikTok / Reels", ages: { "18-24": 5, "25-34": 3, "35-44": 1, "45-54": 0.5, "55+": 0.2 }, b2b: 0.2 },
  instagram: { label: "Instagram", ages: { "18-24": 4, "25-34": 4, "35-44": 2, "45-54": 1, "55+": 0.5 }, b2b: 0.4 },
  facebook: { label: "Facebook", ages: { "18-24": 0.8, "25-34": 2, "35-44": 3.5, "45-54": 4, "55+": 4 }, b2b: 0.6 },
  search: { label: "Google Search", ages: { "18-24": 2, "25-34": 3, "35-44": 3.5, "45-54": 3.5, "55+": 3 }, b2b: 3 },
  linkedin: { label: "LinkedIn", ages: { "18-24": 0.5, "25-34": 1.5, "35-44": 2, "45-54": 2, "55+": 1 }, b2b: 5 },
  email: { label: "Email & loyalty", ages: { "18-24": 0.8, "25-34": 1.5, "35-44": 2.5, "45-54": 3, "55+": 3.5 }, b2b: 2.5 },
  local: { label: "Local print / radio / events", ages: { "18-24": 0.3, "25-34": 0.8, "35-44": 1.5, "45-54": 2.5, "55+": 4 }, b2b: 1 },
};

export const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"];
