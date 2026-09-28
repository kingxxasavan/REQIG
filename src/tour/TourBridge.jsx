import { useStore } from "../lib/store.jsx";
import { useTourAction } from "./TourProvider.jsx";
import { generateDemo } from "../lib/demo.js";
import { CAT_KEYS } from "../lib/analytics.js";
import { addMonths, today, uid } from "../lib/format.js";

// Store-level actions the tour can ask for. They go through update(), so
// permissions and the audit log behave exactly as for a real owner.
export default function TourBridge() {
  const { state, update, switchUser, toast } = useStore();

  // After setup: bring in the operational history a real owner would have
  // entered over time — suppliers, stock, past damages and complaints.
  useTourAction("ws-seed", () => {
    const demo = generateDemo(state?.company?.industry || "restaurant");
    update(null, (s) => {
      s.suppliers = demo.suppliers;
      s.inventory = demo.inventory;
      s.damages = demo.damages;
      s.returns = demo.returns;
      s.complaints = demo.complaints.slice(1);
      if (!s.employees?.length) s.employees = demo.employees;
      if (!s.team.some((m) => m.role === "viewer")) {
        const e = s.employees[s.employees.length - 1];
        s.team.push({ id: "u-" + uid(), name: e.name, email: "staff@harborstreetbakery.com", role: "viewer", dept: e.dept, employeeId: e.id });
      }
      if (!s.team.some((m) => m.role === "department")) {
        const e = s.employees.find((x) => x.dept === "Production") || s.employees[2];
        s.team.push({ id: "u-" + uid(), name: e.name, email: "kitchen@harborstreetbakery.com", role: "department", dept: e.dept, employeeId: e.id });
      }
    }, "Imported suppliers, inventory and complaint history");
  });

  useTourAction("ws-add-month", () => {
    const rows = [...state.months].sort((a, b) => a.month.localeCompare(b.month));
    const last = rows[rows.length - 1];
    const yearAgo = rows.find((r) => r.month === addMonths(last.month, -11)) || last;
    const next = { month: addMonths(last.month, 1) };
    next.revenue = Math.round(yearAgo.revenue * 1.06);
    for (const k of CAT_KEYS) next[k] = Math.round((last[k] * 0.6 + yearAgo[k] * 0.4) * (k === "production" ? 1.12 : 1));
    update("data.import", (s) => s.months.push(next), `Imported ${next.month} from harbor-street-${next.month}.csv`);
    toast(`Added ${next.month} — alerts and forecasts updated`, "good");
  });

  useTourAction("ws-add-damage", () => {
    const item = state.inventory[2] || state.inventory[0];
    if (!item) return;
    update("inventory.edit", (s) => {
      s.damages.unshift({ id: uid(), date: today(), itemId: item.id, qty: 22, reason: "Crushed in transit", writeOff: true });
      const it = s.inventory.find((i) => i.id === item.id);
      it.qty = Math.max(0, it.qty - 22);
    }, `Logged 22 damaged ${item.name}`);
    toast(`Logged 22 damaged ${item.name} — supplier score updated`, "good");
  });

  useTourAction("ws-add-complaint", () => {
    update("complaints.edit", (s) => {
      s.complaints.unshift({ id: uid(), date: today(), customer: "D. Okoro", channel: "Phone", category: "Product quality", severity: "high", status: "open", cost: 64, notes: "Birthday cake order arrived damaged; remade free of charge.", resolvedOn: "" });
    }, "Logged complaint from D. Okoro");
    toast("Complaint logged — $64 to resolve", "good");
  });

  useTourAction("ws-view-as", (role) => {
    const m = state.team.find((x) => x.role === role);
    if (m) switchUser(m.id);
  });

  return null;
}
