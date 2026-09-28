import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { Icon, Logo } from "./Icons.jsx";
import { useStore, useTheme } from "../lib/store.jsx";
import { ROLES } from "../lib/rbac.js";

const NAV = [
  { group: "Overview", items: [
    { to: "/app", label: "Dashboard", icon: "dashboard", end: true },
    { to: "/app/reports", label: "Monthly reports", icon: "report" },
    { to: "/app/advisor", label: "AI Advisor", icon: "ai" },
  ] },
  { group: "Money", items: [
    { to: "/app/budget", label: "Budget & spending", icon: "budget" },
    { to: "/app/data", label: "Data & uploads", icon: "data" },
    { to: "/app/payroll", label: "Payroll", icon: "payroll" },
  ] },
  { group: "Operations", items: [
    { to: "/app/inventory", label: "Suppliers & inventory", icon: "inventory" },
    { to: "/app/complaints", label: "Complaints", icon: "complaints" },
  ] },
  { group: "Tools", items: [
    { to: "/app/pricing", label: "Pricing studio", icon: "pricing" },
    { to: "/app/planner", label: "Spending planner", icon: "planner" },
  ] },
  { group: "Admin", items: [
    { to: "/app/team", label: "Team & roles", icon: "team" },
    { to: "/app/settings", label: "Security & settings", icon: "settings" },
  ] },
];

export function ThemeButton() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  return (
    <button className="btn ghost icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} title="Toggle theme">
      <Icon name={isDark ? "sun" : "moon"} />
    </button>
  );
}

export default function Layout() {
  const { state, analysis, user, switchUser, encrypted, lock } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  const alertCount = analysis?.alerts?.filter((a) => a.level === "critical" || a.level === "warning").length || 0;

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
        <Link to="/" className="brand">
          <Logo />
          <span>
            EPRI
            <small>Financial manager</small>
          </span>
        </Link>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Icon name={it.icon} />
                {it.label}
                {it.to === "/app" && alertCount > 0 && <span className="badge">{alertCount}</span>}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="grow" />
        <div className="card" style={{ padding: 14, marginTop: 16, boxShadow: "none", background: "var(--surface-2)" }}>
          <div className="row small" style={{ gap: 8 }}>
            <Icon name="shield" size={16} />
            <b>{encrypted ? "AES-256 encrypted" : "Not encrypted"}</b>
          </div>
          <p className="xs muted" style={{ marginTop: 4 }}>
            {encrypted ? "Your workspace is sealed on this device." : <Link to="/app/settings">Turn on encryption →</Link>}
          </p>
        </div>
      </aside>
      <div className={`scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar no-print">
          <button className="btn ghost icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <div className="company">{state.company.name}</div>
          {state.demo && <span className="pill info hide-sm">Sample data</span>}
          <div className="grow" />
          <label className="row small hide-sm" style={{ gap: 8 }} title="Switch user to see what each role can do">
            <span className="muted">Signed in as</span>
            <select className="input" style={{ width: "auto", padding: "6px 10px" }} value={user?.id} onChange={(e) => switchUser(e.target.value)}>
              {state.team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {ROLES[m.role].short}
                </option>
              ))}
            </select>
          </label>
          <ThemeButton />
          {encrypted && (
            <button className="btn ghost icon-btn" onClick={lock} title="Lock workspace" aria-label="Lock workspace">
              <Icon name="lock" />
            </button>
          )}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
