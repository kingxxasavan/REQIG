// Role-based access control. Every screen and every write goes through
// can(role, permission) — the UI hides what a role cannot do, and the store
// refuses the write even if a control slipped through.

export const ROLES = {
  owner: {
    label: "Owner / Admin",
    short: "Owner",
    description: "Full control: billing, team, security settings and all financial data.",
  },
  finance: {
    label: "Financial Manager",
    short: "Finance",
    description: "Edits transactions, budgets, payroll and reports. Cannot manage the team or security.",
  },
  department: {
    label: "Department Head",
    short: "Dept. head",
    description: "Sees and edits data for their own department only.",
  },
  viewer: {
    label: "Viewer / Employee",
    short: "Viewer",
    description: "Read-only dashboards. Payroll shows their own record only.",
  },
};

export const PERMISSIONS = {
  "dashboard.view": "View dashboards & reports",
  "finance.edit": "Edit revenue & expense data",
  "budget.edit": "Set and change budgets",
  "payroll.viewAll": "See every employee's salary",
  "payroll.edit": "Edit payroll",
  "inventory.edit": "Manage suppliers, inventory, damages & returns",
  "complaints.edit": "Log and resolve complaints",
  "pricing.edit": "Save products in the Pricing Studio",
  "data.import": "Upload files",
  "data.export": "Export data",
  "team.manage": "Invite members & change roles",
  "security.manage": "Encryption, backups & workspace reset",
  "audit.view": "View the audit log",
};

const GRANTS = {
  owner: Object.keys(PERMISSIONS),
  finance: ["dashboard.view", "finance.edit", "budget.edit", "payroll.viewAll", "payroll.edit", "inventory.edit", "complaints.edit", "pricing.edit", "data.import", "data.export", "audit.view"],
  department: ["dashboard.view", "inventory.edit", "complaints.edit", "pricing.edit"],
  viewer: ["dashboard.view"],
};

export const can = (role, permission) => (GRANTS[role] || []).includes(permission);

export const DEPARTMENTS = ["Operations", "Production", "Sales & Marketing", "Finance", "Customer Service", "Management"];
