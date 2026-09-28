import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { advisorSummary } from "../lib/analytics.js";
import { localAnswer } from "../lib/advisor.js";
import { Icon } from "./Icons.jsx";

// Which page the owner is on, so the advisor knows what "this" means.
export const PAGES = {
  "/app": { key: "dashboard", label: "Dashboard", asks: ["How did we do last month?", "What should I worry about?", "What does the next quarter look like?"] },
  "/app/reports": { key: "reports", label: "Monthly reports", asks: ["Why was this month different from last?", "Which cost grew the most?", "Explain my profit margin simply"] },
  "/app/budget": { key: "budget", label: "Budget & spending", asks: ["Where can I cut costs?", "Is marketing over budget?", "Will we finish the year on budget?"] },
  "/app/data": { key: "data", label: "Data & uploads", asks: ["How did we do last month?", "Does anything in my numbers look unusual?"] },
  "/app/payroll": { key: "payroll", label: "Payroll", asks: ["Can I afford to hire someone?", "Is our labour cost too high?"] },
  "/app/inventory": { key: "inventory", label: "Suppliers & inventory", asks: ["Which supplier is costing us the most?", "What's damaged stock costing us?"] },
  "/app/complaints": { key: "complaints", label: "Complaints", asks: ["What are complaints costing us?", "Which complaint type should I fix first?"] },
  "/app/pricing": { key: "pricing", label: "Pricing studio", asks: ["Should I raise my prices?", "Is my margin healthy for my industry?"] },
  "/app/planner": { key: "planner", label: "Spending planner", asks: ["What does the next quarter look like?", "Is our marketing spend too high?"] },
  "/app/team": { key: "team", label: "Team & roles", asks: ["How did we do last month?"] },
  "/app/settings": { key: "settings", label: "Security & settings", asks: ["How did we do last month?"] },
};
export const pageFor = (path) => PAGES[path] || PAGES["/app"];

const Ctx = createContext(null);
export const useAdvisor = () => useContext(Ctx);

export function AdvisorProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [autoAsk, setAutoAsk] = useState(null);
  const ask = useCallback((q, { auto = false } = {}) => {
    setOpen(true);
    if (auto) setAutoAsk({ q, n: Date.now() });
    else setDraft(q || "");
  }, []);
  return <Ctx.Provider value={{ open, setOpen, draft, setDraft, ask, autoAsk }}>{children}</Ctx.Provider>;
}

function when(iso) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d) / 86_400_000);
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return days === 0 ? `Today ${t}` : days === 1 ? `Yesterday ${t}` : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AdvisorDock() {
  const { state, analysis: a, currency, saveAdvisor, clearAdvisor } = useStore();
  const { open, setOpen, draft, setDraft, autoAsk } = useAdvisor();
  const loc = useLocation();
  const nav = useNavigate();
  const page = pageFor(loc.pathname);
  const [tab, setTab] = useState("chat");
  const [busy, setBusy] = useState(false);
  const [sessionIds, setSessionIds] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [aiReady, setAiReady] = useState(false);
  const input = useRef();
  const end = useRef();
  const history = state?.advisor || [];
  const session = useMemo(() => history.filter((h) => sessionIds.includes(h.id)).reverse(), [history, sessionIds]);

  useEffect(() => {
    fetch("api/advisor").then((r) => r.json()).then((j) => setAiReady(!!j.configured)).catch(() => setAiReady(false));
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 150);
  }, [open]);
  useEffect(() => end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), [session.length, busy]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && open && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const send = useCallback(
    async (text) => {
      const q = (text ?? draft).trim();
      if (!q || busy || !a || a.empty) return;
      setDraft("");
      setTab("chat");
      setBusy(true);
      let answer = null, source = "local";
      if (aiReady) {
        try {
          const r = await fetch("api/advisor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q, page: page.label, summary: advisorSummary(state, a), history: session.slice(-3).flatMap((h) => [{ role: "user", text: h.q }, { role: "assistant", text: h.a }]) }),
          });
          const j = await r.json();
          if (r.ok && j.answer) {
            answer = j.answer;
            source = "ai";
          }
        } catch {
          /* fall back to the built-in advisor */
        }
      }
      if (!answer) {
        await new Promise((r) => setTimeout(r, 450));
        answer = localAnswer(q, a, state, currency, page.key);
      }
      const id = `adv-${Date.now()}`;
      saveAdvisor({ id, q, a: answer, page: loc.pathname, pageLabel: page.label, source });
      setSessionIds((ids) => [...ids, id]);
      setBusy(false);
    },
    [draft, busy, a, aiReady, page, state, session, currency, saveAdvisor, loc.pathname, setDraft],
  );

  // Programmatic asks (the guided tour, "Ask the advisor" buttons).
  useEffect(() => {
    if (autoAsk) send(autoAsk.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAsk]);

  return (
    <aside className={`advisor-dock glass ${open ? "open" : ""}`} aria-label="Advisor" aria-hidden={!open} data-tour="advisor-dock">
      <header className="dock-head">
        <div className="row" style={{ gap: 10 }}>
          <span className="dock-mark"><Icon name="ai" size={16} /></span>
          <div>
            <b>Advisor</b>
            <div className="xs muted">{aiReady ? "Claude-powered · sees totals only" : "Built-in · runs on this device"}</div>
          </div>
        </div>
        <button className="btn ghost icon-btn" onClick={() => setOpen(false)} aria-label="Close advisor"><Icon name="x" /></button>
      </header>

      <div className="dock-context">
        <Icon name="eye" size={14} />
        <span>Asking about <b>{page.label}</b></span>
      </div>

      <div className="tabs dock-tabs" role="tablist">
        <button className={tab === "chat" ? "on" : ""} onClick={() => setTab("chat")} role="tab" aria-selected={tab === "chat"}>Conversation</button>
        <button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")} role="tab" aria-selected={tab === "history"}>
          History {history.length > 0 && <span className="muted">({history.length})</span>}
        </button>
      </div>

      <div className="dock-body">
        {tab === "chat" && (
          <>
            {!session.length && !busy && (
              <div className="stack" style={{ gap: 10 }}>
                <p className="small text-2">
                  Describe what you want to know in your own words — the more specific, the better. For example, <i>"Why is marketing over budget this month?"</i> beats <i>"marketing?"</i>
                </p>
                <div className="xs muted" style={{ marginTop: 4 }}>Suggested for {page.label}</div>
                {page.asks.map((q) => (
                  <button key={q} className="dock-suggest" onClick={() => send(q)}>
                    {q} <Icon name="arrow" size={14} />
                  </button>
                ))}
                {history.length > 0 && (
                  <button className="btn ghost sm" style={{ alignSelf: "flex-start", marginTop: 6 }} onClick={() => setTab("history")}>
                    Lost your train of thought? See past questions →
                  </button>
                )}
              </div>
            )}
            {session.map((h) => (
              <div key={h.id} className="stack" style={{ gap: 8 }}>
                <div className="bubble me">{h.q}</div>
                <div className="bubble">{h.a}</div>
              </div>
            ))}
            {busy && <div className="row small muted"><span className="spinner" /> Looking at your numbers…</div>}
            <div ref={end} />
          </>
        )}
        {tab === "history" && (
          <div className="stack" style={{ gap: 8 }}>
            {!history.length && <p className="small muted">Nothing yet. Every question you ask is saved here, with the page you asked it from.</p>}
            {history.map((h) => (
              <div key={h.id} className={`hist ${expanded === h.id ? "open" : ""}`}>
                <button className="hist-q" onClick={() => setExpanded(expanded === h.id ? null : h.id)} aria-expanded={expanded === h.id}>
                  <span>{h.q}</span>
                  <span className="xs muted">{h.pageLabel} · {when(h.at)}</span>
                </button>
                {expanded === h.id && (
                  <div className="hist-a">
                    <p className="small">{h.a}</p>
                    <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                      {h.page !== loc.pathname && <button className="btn sm" onClick={() => nav(h.page)}>Go back to {h.pageLabel}</button>}
                      <button className="btn sm" onClick={() => { setDraft(`Following up on "${h.q}": `); setTab("chat"); input.current?.focus(); }}>Ask a follow-up</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {history.length > 0 && <button className="btn ghost sm danger" style={{ alignSelf: "flex-start" }} onClick={clearAdvisor}>Clear history</button>}
          </div>
        )}
      </div>

      <form
        className="dock-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={input}
          className="input"
          rows={2}
          value={draft}
          maxLength={500}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={`Ask about ${page.label.toLowerCase()}…`}
          aria-label="Ask the advisor"
          data-tour="advisor-input"
        />
        <button className="btn primary icon-btn" disabled={!draft.trim() || busy} aria-label="Send"><Icon name="send" size={16} /></button>
      </form>
    </aside>
  );
}
