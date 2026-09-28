import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useAdvisor } from "../components/AdvisorDock.jsx";
import { Icon } from "../components/Icons.jsx";
import { STEPS } from "./steps.js";

// The guided tour walks a visitor through the real app — sign-up, setup,
// every tool, and export — spotlighting one thing at a time. Each step can
// "do it for me", filling in sample data exactly the way an owner would.

const Ctx = createContext(null);
export const useTour = () => useContext(Ctx);

const IDX_KEY = "epri.tourStep";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Type into a React-controlled input the way a person would.
export async function typeInto(selector, text, speed = 16) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.focus();
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  for (let i = 1; i <= text.length; i++) {
    setter.call(el, text.slice(0, i));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(speed);
  }
  el.blur();
}
export const clickOn = (selector) => document.querySelector(selector)?.click();

// Pages register what "do it for me" means on them (e.g. the onboarding
// wizard's local state), so the tour never reaches into component internals.
export function useTourAction(name, fn) {
  const ctx = useContext(Ctx);
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!ctx) return;
    return ctx.register(name, (...args) => ref.current(...args));
  }, [ctx, name]);
}

export function TourProvider({ children }) {
  const { tour, startTour, endTour } = useAuth();
  const advisor = useAdvisor();
  const nav = useNavigate();
  const loc = useLocation();
  const actions = useRef(new Map());
  const [index, setIndex] = useState(() => {
    try {
      return Number(sessionStorage.getItem(IDX_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const [done, setDone] = useState({});
  const [busy, setBusy] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const register = useCallback((name, fn) => {
    actions.current.set(name, fn);
    return () => actions.current.get(name) === fn && actions.current.delete(name);
  }, []);

  const run = useCallback(async (name, ...args) => {
    // The page may still be mounting after a route change.
    for (let i = 0; i < 30 && !actions.current.has(name); i++) await sleep(100);
    const fn = actions.current.get(name);
    if (fn) return fn(...args);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(IDX_KEY, String(index));
    } catch {
      /* ignore */
    }
  }, [index]);

  const step = tour ? STEPS[index] : null;

  // Keep the visitor on the step's page.
  useEffect(() => {
    if (!step) return;
    if (step.route && loc.pathname !== step.route) nav(step.route + (step.search || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, tour]);

  const ctx = { nav, run, advisor, typeInto, clickOn, sleep };

  useEffect(() => {
    if (step?.onEnter) step.onEnter(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, tour]);

  const begin = useCallback(() => {
    try {
      localStorage.removeItem("epri.tour.workspace");
      localStorage.removeItem("epri.tour.vault");
    } catch {
      /* ignore */
    }
    setIndex(0);
    setDone({});
    setMinimized(false);
    startTour();
    nav(STEPS[0].route);
  }, [startTour, nav]);

  const finish = useCallback(
    (to = "/") => {
      advisor.setOpen(false);
      endTour();
      setIndex(0);
      nav(to);
    },
    [advisor, endTour, nav],
  );

  const doIt = async () => {
    if (!step?.do || busy) return;
    setBusy(true);
    try {
      await step.do(ctx);
      setDone((d) => ({ ...d, [index]: true }));
    } finally {
      setBusy(false);
    }
  };

  const go = async (delta) => {
    if (busy) return;
    // Advancing past an action step does it first, so the story stays intact.
    if (delta > 0 && step?.do && !done[index] && step.required) await doIt();
    const next = Math.max(0, Math.min(STEPS.length - 1, index + delta));
    if (step?.onLeave) step.onLeave(ctx);
    setIndex(next);
  };

  return (
    <Ctx.Provider value={{ register, run, begin, finish, active: !!tour }}>
      {children}
      {step && (
        <TourOverlay
          step={step}
          index={index}
          total={STEPS.length}
          done={!!done[index]}
          busy={busy}
          minimized={minimized}
          setMinimized={setMinimized}
          onDo={doIt}
          onNext={() => go(1)}
          onBack={() => go(-1)}
          onExit={() => finish("/")}
          onSignup={() => finish("/signup")}
          onStay={() => setMinimized(true)}
        />
      )}
    </Ctx.Provider>
  );
}

function useTargetRect(target, index) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    let scrolled = false;
    let raf;
    // Pick a copy of the target that's actually showing: on phones the
    // sidebar is slid off-screen, so its buttons can't be spotlighted.
    const find = () => {
      const vw = window.innerWidth;
      return [...document.querySelectorAll(`[data-tour="${target}"]`)].find((el) => {
        if (!el.getClientRects().length) return false;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && r.right > 0 && r.left < vw && cs.visibility !== "hidden";
      });
    };
    const measure = () => {
      const el = find();
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          scrolled = true;
        }
        const r = el.getBoundingClientRect();
        setRect((prev) => (prev && Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.left - r.left) < 0.5 && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5 ? prev : { top: r.top, left: r.left, width: r.width, height: r.height }));
      } else setRect(null);
    };
    const loop = () => {
      measure();
      raf = setTimeout(loop, 120);
    };
    loop();
    return () => clearTimeout(raf);
  }, [target, index]);
  return rect;
}

function TourOverlay({ step, index, total, done, busy, minimized, setMinimized, onDo, onNext, onBack, onExit, onSignup, onStay }) {
  const rect = useTargetRect(minimized ? null : step.target, index);
  const card = useRef();
  const [pos, setPos] = useState({ top: 0, left: 0, mode: "center" });
  const last = index === total - 1;

  useLayoutEffect(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const cw = card.current?.offsetWidth || 360, ch = card.current?.offsetHeight || 220;
    if (vw < 700) return setPos({ mode: "sheet" });
    if (!rect) return setPos({ mode: "center" });
    if (step.placement === "corner") return setPos({ mode: "corner" });
    const pad = 16;
    let top, left;
    if (rect.top + rect.height + ch + pad * 2 < vh) top = rect.top + rect.height + pad;
    else if (rect.top - ch - pad > 0) top = rect.top - ch - pad;
    else if (rect.left + rect.width + cw + pad < vw) {
      top = Math.min(vh - ch - pad, Math.max(pad, rect.top));
      left = rect.left + rect.width + pad;
    } else return setPos({ mode: "corner" });
    if (left == null) left = Math.min(vw - cw - pad, Math.max(pad, rect.left + rect.width / 2 - cw / 2));
    setPos({ top, left, mode: "float" });
  }, [rect, index, step.placement]);

  if (minimized) {
    return (
      <button className="tour-pill glass hairline" onClick={() => setMinimized(false)}>
        <Icon name="eye" size={15} /> Guided tour · step {index + 1} of {total} — resume
      </button>
    );
  }

  const style = pos.mode === "float" ? { top: pos.top, left: pos.left } : undefined;
  return (
    <>
      {rect ? (
        <div className="tour-spot" style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }} aria-hidden="true" />
      ) : (
        <div className="tour-dim" aria-hidden="true" />
      )}
      <div ref={card} className={`tour-card glass hairline ${pos.mode}`} style={style} role="dialog" aria-label={step.title} aria-live="polite">
        <div className="row between xs muted">
          <span className="tour-chapter">{step.chapter}</span>
          <span className="row" style={{ gap: 8 }}>
            {index + 1} / {total}
            <button className="tour-x" onClick={onExit} aria-label="Exit tour" title="Exit tour"><Icon name="x" size={14} /></button>
          </span>
        </div>
        <div className="tour-progress"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        {step.youDo && (
          <div className="tour-youdo">
            <b>What you'd do:</b> {step.youDo}
          </div>
        )}
        {last ? (
          <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn glow" onClick={onSignup}>Create my real account</button>
            <button className="btn" onClick={onStay}>Keep exploring the sample</button>
          </div>
        ) : (
          <div className="tour-actions">
            <div className="row" style={{ gap: 4 }}>
              <button className="btn ghost sm" onClick={onBack} disabled={index === 0 || busy}>Back</button>
              <button className="btn ghost sm" onClick={() => setMinimized(true)} title="Hide the tour and click around yourself">Hide</button>
            </div>
            <div className="tour-go">
              {step.do && !done && (
                <button className="btn sm" onClick={onDo} disabled={busy}>
                  {busy ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Icon name="ai" size={14} />} {step.doLabel || "Do it for me"}
                </button>
              )}
              <button className="btn primary sm" onClick={onNext} disabled={busy}>
                {step.do && !done && step.required ? "Do it & continue" : "Next"} <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
