import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { Icon, Logo } from "./Icons.jsx";
import { useStore, useTheme } from "../lib/store.jsx";
import { useAuth } from "../lib/auth.jsx";
import { ROLES } from "../lib/rbac.js";
import AdvisorDock, { useAdvisor } from "./AdvisorDock.jsx";

const NAV = [
  { group: "Overview", items: [
    { to: "/app", label: "Dashboard", icon: "dashboard", end: true },
    { to: "/app/reports", label: "Monthly reports", icon: "report" },
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
  const isDark = theme === "dark";
  return (
    <button className="btn ghost icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} title="Toggle theme">
      <Icon name={isDark ? "sun" : "moon"} />
    </button>
  );
}

function AdvisorButton() {
  const { open, setOpen } = useAdvisor();
  const { state } = useStore();
  return (
    <button className={`advisor-btn hairline ${open ? "on" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} data-tour="advisor-button">
      <span className="dock-mark"><Icon name="ai" size={15} /></span>
      <span className="grow" style={{ textAlign: "left" }}>
        <b>Advisor</b>
        <span className="xs muted" style={{ display: "block" }}>{state.advisor?.length ? `${state.advisor.length} saved question${state.advisor.length === 1 ? "" : "s"}` : "Ask about any page"}</span>
      </span>
      <kbd className="xs muted">A</kbd>
    </button>
  );
}

export default function Layout() {
  const { state, analysis, user: member, switchUser, encrypted, lock } = useStore();
  const { user, tour, signOut, endTour } = useAuth();
  const { open: dockOpen, setOpen: setDock } = useAdvisor();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  // "A" opens the advisor from anywhere (except while typing).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() !== "a" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/input|textarea|select/i.test(document.activeElement?.tagName)) return;
      setDock((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDock]);
  const alertCount = analysis?.alerts?.filter((a) => a.level === "critical" || a.level === "warning").length || 0;

  const leave = async () => {
    if (tour) {
      endTour();
      nav("/");
    } else {
      await signOut().catch(() => {});
      nav("/");
    }
  };

  return (
    <div className={`shell ${dockOpen ? "dock-open" : ""}`}>
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
        <Link to="/" className="brand">
          <Logo />
          <span>
            EPRI
            <small>Financial manager</small>
          </span>
        </Link>
        <AdvisorButton />
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} data-tour={`nav-${it.to.split("/")[2] || "dashboard"}`}>
                <Icon name={it.icon} />
                {it.label}
                {it.to === "/app" && alertCount > 0 && <span className="badge">{alertCount}</span>}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="grow" />
        <div className="account-card">
          <div className="row" style={{ gap: 10 }}>
            <span className="avatar">{(tour ? "T" : user?.name || "?").slice(0, 1).toUpperCase()}</span>
            <div style={{ minWidth: 0 }} className="grow">
              <b className="small ellipsis">{tour ? "Guided tour" : user?.name}</b>
              <div className="xs muted ellipsis">{tour ? "Sample data · nothing is saved online" : user?.email}</div>
            </div>
          </div>
          <div className="row small" style={{ gap: 6, marginTop: 10 }}>
            <Icon name="shield" size={14} />
            <span className={encrypted ? "" : "muted"}>{encrypted ? "Encrypted on this device" : <Link to="/app/settings">Turn on encryption</Link>}</span>
          </div>
          <button className="btn sm" style={{ width: "100%", marginTop: 10 }} onClick={leave}>{tour ? "Exit tour" : "Sign out"}</button>
        </div>
      </aside>
      <div className={`scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <AdvisorDock />
      <div className="main">
        <header className="topbar no-print">
          <button className="btn ghost icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <div className="company">{state.company.name}</div>
          {state.demo && <span className="pill info hide-sm">Sample data</span>}
          <div className="grow" />
          <label className="row small hide-sm" style={{ gap: 8 }} title="See the app the way each team member would" data-tour="view-as">
            <span className="muted">Preview as</span>
            <select className="input" style={{ width: "auto", padding: "6px 10px" }} value={member?.id} onChange={(e) => switchUser(e.target.value)}>
              {state.team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {ROLES[m.role].short}
                </option>
              ))}
            </select>
          </label>
          <button className="btn ghost icon-btn menu-btn" onClick={() => setDock(true)} aria-label="Open advisor"><Icon name="ai" /></button>
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
