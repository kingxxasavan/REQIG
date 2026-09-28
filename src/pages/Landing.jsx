import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, Logo } from "../components/Icons.jsx";
import { Sparkline } from "../components/UI.jsx";
import { useStore, useTheme } from "../lib/store.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useTour } from "../tour/TourProvider.jsx";
import { industryList } from "../lib/industries.js";
import { generateDemo } from "../lib/demo.js";
import { analyze } from "../lib/analytics.js";
import { localAnswer } from "../lib/advisor.js";
import { evaluate } from "../lib/pricing.js";
import { money, pct, monthLabel } from "../lib/format.js";

const HelixCanvas = lazy(() => import("../components/HelixCanvas.jsx"));

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const PROOF = [
  { value: "10 min", label: "to set up from the spreadsheets you already have" },
  { value: "Monthly", label: "a plain-English report on what you made and why" },
  { value: "$49", label: "a month, less than one hour with an accountant" },
];

const PRODUCT = [
  { key: "dashboard", icon: "dashboard", title: "Know what you made", text: "Revenue, spending and profit for the month, compared with last month and the same season last year.", points: ["Profit and margin every month", "3-month forecast", "One health score out of 100"] },
  { key: "alerts", icon: "bell", title: "Get warned before you overspend", text: "EPRI checks every cost against your budget, your normal month and businesses like yours, then tells you what's wrong in plain words.", points: ["Budget pace, not just totals", "Spikes flagged the month they happen", "Industry ranges built in"] },
  { key: "advisor", icon: "ai", title: "Ask, in your own words", text: "An advisor slides out beside whatever you're looking at. Ask \"why was March weak?\" and get an answer from your own numbers.", points: ["Knows which page you're on", "Every question saved to History", "Only totals ever leave your device"] },
  { key: "pricing", icon: "pricing", title: "Price every product right", text: "Pick materials from presets for your industry, enter what you pay, and see the price you need to hit your margin.", points: ["Card & marketplace fees solved for", "Break-even volume", "5-year compound pricing"] },
  { key: "ops", icon: "inventory", title: "See what problems cost", text: "Suppliers get scored on damaged deliveries and returns, and every complaint is logged with what it cost to fix.", points: ["Supplier scorecards", "Damaged stock & returns logs", "Complaint costs by category"] },
  { key: "export", icon: "download", title: "Hand it to your accountant", text: "A 12-month profit & loss, monthly reports that print cleanly, and one-click spreadsheet exports.", points: ["CSV export of any report", "Print-ready pages", "Encrypted backups"] },
];

const HOW = [
  { icon: "file", title: "Upload a year", text: "Drop in last year's sales and spending as a spreadsheet or accounting export. Messy column names are fine." },
  { icon: "team", title: "Invite your team", text: "Add a financial manager and department heads. Each role sees only what it should." },
  { icon: "chart", title: "Get your baseline", text: "EPRI learns your seasons, your normal costs and your industry's ranges in seconds." },
  { icon: "bell", title: "Every month after", text: "Add the new month. EPRI reports, warns and suggests what to do next." },
];

const SECURITY = [
  {
    key: "signin",
    label: "Signing in",
    icon: "lock",
    title: "Accounts are protected by Google's sign-in service",
    text: "EPRI uses Google Firebase for accounts, the same service thousands of apps rely on. Your password is never stored by EPRI, and repeated wrong guesses are blocked automatically.",
    points: ["Email and password, or Google sign-in", "Password reset by email", "Suspicious sign-in attempts are slowed and blocked"],
  },
  {
    key: "data",
    label: "Your books",
    icon: "shield",
    title: "Your numbers are locked with a key only you hold",
    text: "The owner chooses a passphrase, and everything EPRI saves is encrypted with AES-256, the standard banks and governments use. Without the passphrase the data is unreadable, even to us.",
    points: ["AES-256 encryption on your device", "Tampering is detected, not just hidden", "Locks itself when you close the page"],
  },
  {
    key: "team",
    label: "Your team",
    icon: "team",
    title: "Everyone sees exactly what their job needs",
    text: "Four roles decide who can view or change what. A viewer can read the dashboard but never sees anyone else's salary, and every change is written to an audit log.",
    points: ["Owner, finance manager, department head, viewer", "Salaries visible only to owner & finance", "Who changed what, and when"],
  },
  {
    key: "ai",
    label: "The AI",
    icon: "ai",
    title: "The advisor never sees names or salaries",
    text: "All the maths is done on your device with transparent, tested formulas. When the AI advisor answers a question, it receives only monthly totals and ratios, never people, customers or suppliers.",
    points: ["Numbers calculated, never guessed by AI", "Only aggregates are shared", "Works without AI if you prefer"],
  },
];

const PLANS = [
  { name: "Starter", price: 19, blurb: "For owners getting organised.", features: ["1 user", "Monthly reports & alerts", "Revenue & spending charts", "Spreadsheet import & export"] },
  { name: "Growth", price: 49, blurb: "For small teams that want an advisor.", popular: true, features: ["Up to 5 users with roles", "Everything in Starter", "AI advisor", "Suppliers, returns & complaints", "Pricing studio"] },
  { name: "Pro", price: 99, blurb: "For businesses with more moving parts.", features: ["Up to 15 users", "Everything in Growth", "Forecasts & spending planner", "Department-level access", "Priority support"] },
];

const FAQ = [
  ["How is this different from QuickBooks?", "QuickBooks records what happened. EPRI reads those records and tells you what they mean: where you're overspending, whether you're on budget, and what next quarter looks like. You can import straight from a QuickBooks or spreadsheet export."],
  ["Do I need to know accounting?", "No. Everything is written in plain English: \"Marketing is 55% over last month\", not \"unfavourable opex variance\"."],
  ["What do I need to get started?", "About 12 months of sales and spending (a spreadsheet is fine), and optionally your payroll. Setup takes around ten minutes."],
  ["Does it replace my accountant?", "No. It makes your accountant's time go further. EPRI watches the numbers every month; your accountant handles taxes and filings."],
];

// ---------------------------------------------------------------------------
// Live previews: rendered from a real sample business, not screenshots.
// ---------------------------------------------------------------------------

function useSample() {
  return useMemo(() => {
    const s = generateDemo("restaurant");
    return { s, a: analyze(s) };
  }, []);
}

function Preview({ tab, s, a }) {
  const cur = "USD";
  if (tab === "dashboard") {
    const max = Math.max(...a.last12.map((x) => x.revenue));
    return (
      <div className="pv">
        <div className="pv-kpis">
          <div><small>Revenue · {monthLabel(a.latest.month)}</small><b>{money(a.latest.revenue, cur, { compact: true })}</b><Sparkline values={a.last12.map((r) => r.revenue)} width={90} /></div>
          <div><small>Net profit</small><b>{money(a.latest.profit, cur, { compact: true })}</b><Sparkline values={a.last12.map((r) => r.profit)} color="var(--s3)" width={90} /></div>
          <div><small>Health</small><b>{a.health.score}<span className="xs muted">/100</span></b><span className={`pill ${a.health.level}`}>{a.health.grade}</span></div>
        </div>
        <div className="pv-bars">
          {a.last12.map((r) => (
            <div key={r.month} className="pv-bar" title={monthLabel(r.month)}>
              <i style={{ height: `${(r.revenue / max) * 100}%` }} />
              <i className="e" style={{ height: `${(r.expenses / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="legend" style={{ margin: 0 }}><span><i style={{ background: "var(--s1)" }} />Revenue</span><span><i style={{ background: "var(--s2)" }} />Expenses</span></div>
      </div>
    );
  }
  if (tab === "alerts") {
    return (
      <div className="pv stack" style={{ gap: 8 }}>
        {a.alerts.slice(0, 4).map((x) => (
          <div key={x.title} className={`alert ${x.level}`}>
            <div className="ico">{x.level === "good" ? "✓" : x.level === "info" ? "i" : "!"}</div>
            <div><h4>{x.title}</h4><p>{x.detail}</p></div>
          </div>
        ))}
      </div>
    );
  }
  if (tab === "advisor") {
    const q = "Where can I cut costs?";
    return (
      <div className="pv stack" style={{ gap: 10 }}>
        <div className="dock-context"><Icon name="eye" size={14} /> Asking about <b>Budget &amp; spending</b></div>
        <div className="bubble me">{q}</div>
        <div className="bubble">{localAnswer(q, a, s, cur, "budget")}</div>
        <div className="xs muted">Saved to History · asked from Budget &amp; spending</div>
      </div>
    );
  }
  if (tab === "pricing") {
    const p = { items: [{ price: 1.1, qty: 0.55 }, { price: 9.5, qty: 0.02 }, { price: 0.3, qty: 1 }], labourHours: 0.08, labourRate: 19, fees: [{ pct: 0.026, on: true }], fixedMonthly: 1800, unitsPerMonth: 1400, method: "margin", methodValue: 25 };
    const r = evaluate(p);
    return (
      <div className="pv">
        <div className="small muted">Sourdough loaf · Restaurant / Food presets</div>
        <div className="pv-rows">
          {[["Flour", "0.55 kg × $1.10"], ["Butter", "0.02 kg × $9.50"], ["Packaging", "1 × $0.30"], ["Labour", "5 min × $19/hr"], ["Rent & overhead share", `$1,800 ÷ 1,400 loaves`]].map(([k, v]) => (
            <div key={k} className="row between small"><span>{k}</span><span className="muted tabnum">{v}</span></div>
          ))}
        </div>
        <div className="pv-price">
          <div><small className="muted">Suggested price</small><b>{money(r.price, cur, { cents: true })}</b></div>
          <div className="stack" style={{ gap: 4, alignItems: "flex-end" }}>
            <span className="pill good">{pct(r.margin)} margin</span>
            <span className="xs muted">Break-even: {r.breakEven?.toLocaleString()} loaves / month</span>
          </div>
        </div>
      </div>
    );
  }
  if (tab === "ops") {
    return (
      <div className="pv stack" style={{ gap: 10 }}>
        {a.scorecards.map((x) => (
          <div key={x.id} className="pv-supplier">
            <div><b className="small">{x.name}</b><div className="xs muted">{pct(x.defectRate)} defects · {pct(x.onTimeRate, 0)} on time</div></div>
            <div className="meter" style={{ width: 90 }}><i style={{ width: `${x.score}%`, background: x.score >= 75 ? "var(--good)" : x.score >= 60 ? "var(--warning)" : "var(--critical)" }} /></div>
            <b className="small tabnum" style={{ width: 28, textAlign: "right" }}>{x.score}</b>
          </div>
        ))}
        <div className="pv-price" style={{ marginTop: 4 }}>
          <div><small className="muted">Complaints cost to fix</small><b>{money(a.cstats.cost, cur)}</b></div>
          <span className="pill warning">{a.cstats.open} open</span>
        </div>
      </div>
    );
  }
  const rows = a.last12.slice(-4);
  return (
    <div className="pv">
      <table className="table" style={{ fontSize: 13 }}>
        <thead><tr><th /> {rows.map((r) => <th key={r.month} className="r">{monthLabel(r.month)}</th>)}</tr></thead>
        <tbody>
          {["revenue", "expenses", "profit"].map((k) => (
            <tr key={k}><td style={{ textTransform: "capitalize", fontWeight: k === "profit" ? 700 : 400 }}>{k}</td>{rows.map((r) => <td key={r.month} className="r">{money(r[k], cur, { compact: true })}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <div className="row between" style={{ marginTop: 14 }}>
        <span className="file-chip"><Icon name="file" size={14} /> harbor-street-profit-and-loss.csv</span>
        <span className="btn sm primary" aria-hidden="true"><Icon name="download" size={14} /> Export CSV</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setShown(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { rootMargin: "-60px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}s` }}>{children}</div>;
}

function Eyebrow({ children }) {
  return (
    <span className="eyebrow-pill">
      <span className="pulse" />
      {children}
    </span>
  );
}

export default function Landing() {
  const { state } = useStore();
  const { user } = useAuth();
  const tour = useTour();
  const [theme, setTheme] = useTheme();
  const { s, a } = useSample();
  const [tab, setTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const [how, setHow] = useState("steps");
  const [ind, setInd] = useState("restaurant");
  const [sec, setSec] = useState(0);
  const [annual, setAnnual] = useState(false);
  const [faq, setFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // The product tour advances on its own until someone interacts.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setTab((i) => (i + 1) % PRODUCT.length), 7000);
    return () => clearTimeout(t);
  }, [tab, paused]);

  const signedIn = !!user;
  const P = PRODUCT[tab];
  const I = industryList.find((x) => x.key === ind);
  const S = SECURITY[sec];
  const pick = (i) => {
    setTab(i);
    setPaused(true);
  };

  return (
    <div className="landing grain">
      <header className="l-nav-wrap">
        <nav className={`l-nav ${scrolled ? "glass scrolled" : ""}`}>
          <Link to="/" className="brand" style={{ padding: 0 }}>
            <Logo /> EPRI
          </Link>
          <ul className="l-links">
            <li><a href="#product">Product</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#security">Security</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn ghost icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme"><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
            {signedIn ? (
              <Link to={state?.onboarded ? "/app" : "/start"} className="btn primary sm">Open EPRI</Link>
            ) : (
              <>
                <Link to="/signin" className="btn ghost sm hide-xs">Sign in</Link>
                <Link to="/signup" className="btn primary sm">Start free</Link>
              </>
            )}
            <button className="btn ghost icon-btn l-menu" onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu}><Icon name="menu" /></button>
          </div>
        </nav>
        {menu && (
          <div className="l-mobile glass" onClick={() => setMenu(false)}>
            <a href="#product">Product</a>
            <a href="#how">How it works</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
            {!signedIn && <Link to="/signin">Sign in</Link>}
          </div>
        )}
      </header>

      {/* ---- hero ------------------------------------------------------ */}
      <section className="hero" id="top">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="grid-lines hero-grid-lines" aria-hidden="true" />
        <Suspense fallback={null}>
          <div className="hero-canvas" aria-hidden="true"><HelixCanvas /></div>
        </Suspense>
        <div className="hero-veil" aria-hidden="true" />
        <div className="hero-inner">
          <Eyebrow>Financial manager for local business</Eyebrow>
          <h1>
            Know what you made.
            <br />
            <span className="serif text-gradient">Fix what's leaking.</span>
          </h1>
          <p className="lead">
            EPRI reads your business's numbers every month and tells you, in plain English, what you made, where the money went, and what to do before a small problem gets expensive.
          </p>
          <div className="row wrap hero-ctas">
            <button className="btn glow lg" onClick={tour.begin}>
              <Icon name="eye" size={17} /> Take the 3-minute tour
            </button>
            <Link to={signedIn ? "/app" : "/signup"} className="btn lg ghost-glass">
              {signedIn ? "Open my dashboard" : "Create a free account"} <Icon name="arrow" size={16} />
            </Link>
          </div>
          <p className="xs muted" style={{ marginTop: 14 }}>No card needed · Works with the spreadsheets you already have</p>
          <dl className="proof glass">
            {PROOF.map((p) => (
              <div key={p.label}>
                <dt className="sr-only">{p.label}</dt>
                <dd className="serif">{p.value}</dd>
                <p>{p.label}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- product: one interactive panel instead of a feature wall --- */}
      <section className="l-section" id="product">
        <div className="l-wrap">
          <Reveal className="l-head">
            <Eyebrow>The product</Eyebrow>
            <h2>
              Everything a small business needs, <span className="serif text-gradient">on one screen.</span>
            </h2>
          </Reveal>
          <Reveal>
            <div className="showcase glass hairline" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              <div className="sc-tabs" role="tablist" aria-label="Product features">
                {PRODUCT.map((p, i) => (
                  <button key={p.key} role="tab" aria-selected={tab === i} className={tab === i ? "on" : ""} onClick={() => pick(i)}>
                    <span className="sc-ico"><Icon name={p.icon} size={17} /></span>
                    <span className="grow">{p.title}</span>
                    {tab === i && !paused && <span className="sc-timer" key={tab} />}
                  </button>
                ))}
              </div>
              <div className="sc-body" role="tabpanel" aria-live="polite">
                <div className="sc-copy">
                  <h3>{P.title}</h3>
                  <p>{P.text}</p>
                  <ul>{P.points.map((x) => <li key={x}><Icon name="check" size={15} strokeWidth={2.4} /> {x}</li>)}</ul>
                </div>
                <div className="sc-screen" key={P.key}>
                  <div className="sc-chrome"><span className="dotrow"><i /><i /><i /></span><span className="xs muted">Harbor Street Bakery &amp; Café · sample data</span></div>
                  <Preview tab={P.key} s={s} a={a} />
                </div>
                <div className="sc-arrows">
                  <button className="btn ghost icon-btn" onClick={() => pick((tab + PRODUCT.length - 1) % PRODUCT.length)} aria-label="Previous"><Icon name="arrow" size={16} className="flip" /></button>
                  <span className="xs muted tabnum">{tab + 1} / {PRODUCT.length}</span>
                  <button className="btn ghost icon-btn" onClick={() => pick((tab + 1) % PRODUCT.length)} aria-label="Next"><Icon name="arrow" size={16} /></button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- how it works + industries, in one switchable panel --------- */}
      <section className="l-section" id="how">
        <div className="l-wrap">
          <Reveal className="l-head">
            <Eyebrow>How it works</Eyebrow>
            <h2>
              Set it up once. <span className="serif text-gradient">It works every month.</span>
            </h2>
            <div className="seg" style={{ marginTop: 22 }}>
              <button className={how === "steps" ? "on" : ""} onClick={() => setHow("steps")}>The four steps</button>
              <button className={how === "industry" ? "on" : ""} onClick={() => setHow("industry")}>Built for your industry</button>
            </div>
          </Reveal>
          {how === "steps" ? (
            <ol className="how" key="steps">
              {HOW.map((h, i) => (
                <li key={h.title} className="glass" style={{ animationDelay: `${i * 0.06}s` }}>
                  <span className="how-n serif">{i + 1}</span>
                  <span className="how-ico"><Icon name={h.icon} size={18} /></span>
                  <h4>{h.title}</h4>
                  <p>{h.text}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="industry glass hairline" key="industry">
              <div className="ind-list">
                {industryList.map((x) => (
                  <button key={x.key} className={ind === x.key ? "on" : ""} onClick={() => setInd(x.key)}>
                    <span className="emoji">{x.icon}</span> {x.label}
                  </button>
                ))}
              </div>
              <div className="ind-body">
                <h3>{I.icon} {I.label}</h3>
                <div className="ind-cols">
                  <div>
                    <div className="xs muted ind-label">Specialised tools</div>
                    <ul>{I.tools.map((t) => <li key={t}><Icon name="check" size={14} strokeWidth={2.4} /> {t}</li>)}</ul>
                  </div>
                  <div>
                    <div className="xs muted ind-label">Pricing presets you can pick from</div>
                    <div className="row wrap" style={{ gap: 6 }}>{I.materials.slice(0, 7).map((m) => <span key={m.name} className="chip" style={{ cursor: "default" }}>{m.name}</span>)}</div>
                  </div>
                </div>
                <div className="ind-bench">
                  {["production", "payroll", "marketing"].map((k) => (
                    <div key={k}><small className="muted" style={{ textTransform: "capitalize" }}>{k}</small><b>{pct(I.benchmarks[k][0], 0)}–{pct(I.benchmarks[k][1], 0)}</b><span className="xs muted">of revenue is typical</span></div>
                  ))}
                  <div><small className="muted">Net margin</small><b>{pct(I.benchmarks.netMargin[0], 0)}–{pct(I.benchmarks.netMargin[1], 0)}</b><span className="xs muted">is typical</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---- security, described rather than shown ---------------------- */}
      <section className="l-section" id="security">
        <div className="l-wrap">
          <Reveal className="l-head">
            <Eyebrow>Security</Eyebrow>
            <h2>
              Your books are the most private thing you own. <span className="serif text-gradient">We treat them that way.</span>
            </h2>
          </Reveal>
          <Reveal>
            <div className="security glass hairline">
              <div className="sec-tabs" role="tablist">
                {SECURITY.map((x, i) => (
                  <button key={x.key} role="tab" aria-selected={sec === i} className={sec === i ? "on" : ""} onClick={() => setSec(i)}>
                    <Icon name={x.icon} size={16} /> {x.label}
                  </button>
                ))}
              </div>
              <div className="sec-body" key={S.key}>
                <div className="sec-visual" aria-hidden="true">
                  <div className="sec-rings"><span /><span /><span /></div>
                  <div className="sec-core"><Icon name={S.icon} size={34} strokeWidth={1.5} /></div>
                </div>
                <div>
                  <h3>{S.title}</h3>
                  <p>{S.text}</p>
                  <ul>{S.points.map((x) => <li key={x}><Icon name="check" size={15} strokeWidth={2.4} /> {x}</li>)}</ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- pricing ----------------------------------------------------- */}
      <section className="l-section" id="pricing">
        <div className="l-wrap">
          <Reveal className="l-head">
            <Eyebrow>Pricing</Eyebrow>
            <h2>
              Less than one hour <span className="serif text-gradient">with an accountant.</span>
            </h2>
            <div className="seg" style={{ marginTop: 22 }}>
              <button className={!annual ? "on" : ""} onClick={() => setAnnual(false)}>Monthly</button>
              <button className={annual ? "on" : ""} onClick={() => setAnnual(true)}>Yearly · 2 months free</button>
            </div>
          </Reveal>
          <div className="plans">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.06}>
                <div className={`plan glass ${p.popular ? "popular hairline" : ""}`}>
                  {p.popular && <span className="pop">Most popular</span>}
                  <h3>{p.name}</h3>
                  <p className="small muted">{p.blurb}</p>
                  <div className="price">
                    <b className="serif">${annual ? Math.round((p.price * 10) / 12) : p.price}</b>
                    <span>/ month{annual ? ", billed yearly" : ""}</span>
                  </div>
                  <Link to="/signup" className={`btn ${p.popular ? "glow" : ""}`} style={{ width: "100%" }}>Start 30-day free trial</Link>
                  <ul>{p.features.map((f) => <li key={f}><Icon name="check" size={15} strokeWidth={2.4} /> {f}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ + final call to action, side by side -------------------- */}
      <section className="l-section" id="faq">
        <div className="l-wrap faq-wrap">
          <div className="faq">
            <h2 style={{ marginBottom: 18 }}>
              Questions <span className="serif text-gradient">owners ask.</span>
            </h2>
            {FAQ.map(([q, ans], i) => (
              <div key={q} className={`faq-item glass ${faq === i ? "open" : ""}`}>
                <button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i}>
                  {q}
                  <Icon name="plus" />
                </button>
                {faq === i && <p>{ans}</p>}
              </div>
            ))}
          </div>
          <div className="cta glass hairline">
            <div className="cta-glow" aria-hidden="true" />
            <h2>
              See it run a real business, <span className="serif text-gradient">start to finish.</span>
            </h2>
            <p>The guided tour signs up a sample bakery, uploads its books, and walks through every tool, all the way to exporting a report. It takes about three minutes.</p>
            <div className="row wrap" style={{ gap: 10, marginTop: 22 }}>
              <button className="btn glow lg" onClick={tour.begin}><Icon name="eye" size={17} /> Take the tour</button>
              <Link to="/signup" className="btn lg ghost-glass">Create an account</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="l-footer">
        <div className="l-wrap row between wrap">
          <div className="row"><Logo size={24} /><b>EPRI</b><span className="muted small">Financial manager &amp; advisor for local business</span></div>
          <span className="muted small">Figures in previews and the tour are sample data.</span>
        </div>
      </footer>
    </div>
  );
}
