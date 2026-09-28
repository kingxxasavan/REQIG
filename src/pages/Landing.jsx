import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, Logo } from "../components/Icons.jsx";
import { ThemeButton } from "../components/Layout.jsx";
import { Modal, Sparkline } from "../components/UI.jsx";
import { useStore } from "../lib/store.jsx";
import { industryList } from "../lib/industries.js";
import { generateDemo } from "../lib/demo.js";
import { analyze } from "../lib/analytics.js";
import { money, pct } from "../lib/format.js";

const STEPS = [
  { icon: "upload", title: "Upload", text: "Drop in 12 months of sales, spending and payroll — CSV, Excel or JSON. Messy column names are fine." },
  { icon: "check", title: "Validate & map", text: "Dates, currencies and categories are recognised automatically. Anything odd is flagged before it's used." },
  { icon: "shield", title: "Encrypt", text: "Data is sealed with AES-256-GCM using a key only you hold. Roles decide who sees what." },
  { icon: "ai", title: "Analyse", text: "The engine builds your baseline: seasonality, industry benchmarks, budget pace and anomalies." },
  { icon: "chart", title: "Report", text: "Every month: profit, revenue and spending charts, and a plain-English summary of what changed." },
  { icon: "bell", title: "Warn & advise", text: "Overspending, cash crunches and bad suppliers get flagged early — with what to do about it." },
];

const FEATURES = [
  { icon: "report", title: "Monthly profit reports", text: "Know exactly how much you made each month, and why it changed from the last." },
  { icon: "bell", title: "Overspending warnings", text: "Alerts when a category runs ahead of budget or outside your industry's normal range." },
  { icon: "chart", title: "Revenue & spending charts", text: "Trend lines, profit bars and category breakdowns, with a 3-month forecast." },
  { icon: "budget", title: "Annual budget tracking", text: "Set a yearly budget per category and watch the pace month by month." },
  { icon: "inventory", title: "Suppliers & inventory", text: "Track stock, damaged products and returns — and score each supplier by what they cost you." },
  { icon: "complaints", title: "Complaint costs", text: "Log every complaint and what it cost to fix, so quality problems show up in dollars." },
  { icon: "pricing", title: "Industry pricing studio", text: "Pick materials from presets for your industry, add your prices, and get unit cost, price and margin." },
  { icon: "planner", title: "Demographic ad planner", text: "Tell us who your customers are; get a suggested ad budget split across channels." },
  { icon: "payroll", title: "Payroll & labour cost", text: "Salaries by department and labour as a share of revenue, against your industry." },
  { icon: "team", title: "Roles & permissions", text: "Owner, finance manager, department head and viewer — each sees only what they should." },
  { icon: "ai", title: "AI advisor", text: "Ask questions about your numbers in plain English. Only aggregates are ever sent." },
  { icon: "printer", title: "Export & print", text: "One-click CSV exports and print-ready monthly reports for your accountant or bank." },
];

const SECURITY = [
  { title: "AES-256-GCM encryption", text: "The same cipher banks and governments use. Authenticated, so tampering is detected, not just hidden." },
  { title: "Your key, not ours", text: "The key is derived from your passphrase (PBKDF2-SHA256, 310,000 rounds) and lives only in memory." },
  { title: "Role-based access", text: "Four roles with 13 granular permissions. Every write is checked — hiding a button isn't the only guard." },
  { title: "Audit trail", text: "Every change is logged with who, what and when — including role switches and imports." },
  { title: "Safe imports & exports", text: "File type and size checks on upload; exported spreadsheets are protected against formula injection." },
  { title: "Private AI", text: "The advisor receives totals and ratios only — never names, salaries or customer details." },
  { title: "Read-only connections", text: "Bank and POS links (on the roadmap) will use read-only tokens. EPRI can never move money." },
];

const FORMATS = [
  { name: "CSV / TSV", status: "Ready" },
  { name: "Excel (.xlsx)", status: "Ready" },
  { name: "JSON", status: "Ready" },
  { name: "Manual entry", status: "Ready" },
  { name: "QuickBooks", status: "Planned" },
  { name: "Square / Shopify", status: "Planned" },
  { name: "Bank feeds (Plaid)", status: "Planned" },
];

const PLANS = [
  { name: "Starter", price: 19, blurb: "For solo owners getting organised.", features: ["1 user", "12-month baseline & monthly reports", "Overspending alerts", "Revenue & spending charts", "CSV / Excel import"] },
  { name: "Growth", price: 49, blurb: "For small teams that want an advisor.", popular: true, features: ["Up to 5 users with roles", "Everything in Starter", "AI advisor", "Suppliers, inventory & returns", "Complaint cost tracking", "Pricing studio"] },
  { name: "Pro", price: 99, blurb: "For growing businesses with more moving parts.", features: ["Up to 15 users", "Everything in Growth", "3-month forecasts & planner", "Department-level access", "Audit log export", "Priority support"] },
];

const FAQ = [
  ["How is this different from QuickBooks?", "QuickBooks records what happened. EPRI reads those records and tells you what they mean — where you're overspending, whether you're on budget, what next quarter looks like. You can import straight from a QuickBooks or spreadsheet export."],
  ["Do I need to know accounting?", "No. Every alert and report is written in plain English: \"Marketing is 55% over last month\", not \"unfavourable opex variance\"."],
  ["What do I need to get started?", "About 12 months of revenue and spending (a spreadsheet or accounting export is fine), your team size, and optionally payroll. Setup takes about ten minutes."],
  ["Is my financial data safe?", "Your workspace is encrypted with AES-256-GCM using a key derived from your own passphrase. Team members only see what their role allows, and every change is logged."],
  ["Does it replace my accountant?", "No — it makes your accountant's time go further. EPRI watches the numbers every month so problems are caught early; your accountant handles taxes and filings."],
];

function HeroPreview() {
  const a = useMemo(() => analyze(generateDemo("restaurant")), []);
  const top = a.alerts.filter((x) => x.level !== "good").slice(0, 3);
  return (
    <div className="hero-preview" aria-hidden="true">
      <div className="hp-top">
        <span className="dotrow"><i /><i /><i /></span>
        <span className="xs muted">Harbor Street Bakery & Café · Dashboard</span>
      </div>
      <div className="hp-body">
        <div className="hp-kpis">
          <div>
            <small>Revenue (12 mo)</small>
            <b>{money(a.totals.revenue, "USD", { compact: true })}</b>
            <Sparkline values={a.last12.map((r) => r.revenue)} width={96} />
          </div>
          <div>
            <small>Net profit</small>
            <b>{money(a.totals.profit, "USD", { compact: true })}</b>
            <Sparkline values={a.last12.map((r) => r.profit)} color="var(--s3)" width={96} />
          </div>
          <div>
            <small>Health score</small>
            <b>{a.health.score}<span className="xs muted">/100</span></b>
            <span className={`pill ${a.health.level}`}>{a.health.grade}</span>
          </div>
        </div>
        <div className="hp-bars">
          {a.last12.map((r) => (
            <div key={r.month} className="hp-bar" title={r.month}>
              <i style={{ height: `${(r.revenue / Math.max(...a.last12.map((x) => x.revenue))) * 100}%` }} />
              <i className="e" style={{ height: `${(r.expenses / Math.max(...a.last12.map((x) => x.revenue))) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {top.map((x) => (
            <div key={x.title} className={`alert ${x.level}`} style={{ padding: "8px 10px" }}>
              <div className="ico" style={{ width: 22, height: 22, fontSize: 12 }}>!</div>
              <div><h4 style={{ fontSize: 13 }}>{x.title}</h4></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DemoPicker({ onClose }) {
  const { loadDemo } = useStore();
  const nav = useNavigate();
  return (
    <Modal title="Try EPRI with a sample business" onClose={onClose} wide>
      <p className="text-2">Pick an industry. We'll generate a realistic company with 12 months of books, a team, suppliers and complaints — nothing real, nothing saved to a server.</p>
      <div className="demo-grid">
        {industryList.map((i) => (
          <button
            key={i.key}
            className="demo-card"
            onClick={() => {
              loadDemo(i.key);
              nav("/app");
            }}
          >
            <span className="emoji">{i.icon}</span>
            <b>{i.label}</b>
            <span className="xs muted">{i.tools[0]}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default function Landing() {
  const { state } = useStore();
  const [demo, setDemo] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [faq, setFaq] = useState(0);
  const hasWorkspace = !!state?.onboarded;

  return (
    <div className="landing">
      <nav className="l-nav">
        <div className="l-wrap row between">
          <Link to="/" className="brand" style={{ padding: 0 }}>
            <Logo />
            EPRI
          </Link>
          <div className="row l-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <ThemeButton />
            {hasWorkspace ? (
              <Link to="/app" className="btn primary">Open dashboard</Link>
            ) : (
              <>
                <button className="btn hide-xs" onClick={() => setDemo(true)}>Live demo</button>
                <Link to="/start" className="btn primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="l-wrap hero-grid">
          <div>
            <span className="eyebrow"><Icon name="ai" size={14} /> Automated financial manager for local business</span>
            <h1>
              A financial advisor for your business —<span className="grad"> working every month.</span>
            </h1>
            <p className="lead">
              Upload your production, operations and payroll numbers once. Every month EPRI tells you what you made, warns you when spending drifts, and explains it all in plain English.
            </p>
            <div className="row wrap" style={{ marginTop: 28 }}>
              <Link to="/start" className="btn primary lg">Start onboarding <Icon name="arrow" /></Link>
              <button className="btn lg" onClick={() => setDemo(true)}><Icon name="eye" /> See a live demo</button>
            </div>
            <div className="hero-proof">
              <span><Icon name="shield" size={16} /> AES-256 encrypted</span>
              <span><Icon name="file" size={16} /> CSV · Excel · JSON</span>
              <span><Icon name="team" size={16} /> Role-based access</span>
            </div>
          </div>
          <HeroPreview />
        </div>
      </header>

      <section className="l-section">
        <div className="l-wrap compare">
          <div className="compare-col">
            <span className="tag">What most tools do</span>
            <h3>Record the numbers</h3>
            <ul>
              <li>Shows a ledger — you figure out what it means</li>
              <li>Needs accounting knowledge to read</li>
              <li>Problems show up at tax time</li>
              <li>Doesn't know your industry</li>
            </ul>
          </div>
          <div className="compare-col epri">
            <span className="tag">What EPRI does</span>
            <h3>Interpret and warn</h3>
            <ul>
              <li>"Supplies are 23% higher but revenue only grew 8%"</li>
              <li>Plain English, no jargon</li>
              <li>Monthly check-ups catch problems before they become crises</li>
              <li>Benchmarks against businesses like yours</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="l-section alt" id="how">
        <div className="l-wrap">
          <div className="l-head">
            <span className="eyebrow">How it works</span>
            <h2>From spreadsheet to advice in six steps</h2>
            <p>Set it up once. After that it runs every month on its own.</p>
          </div>
          <ol className="pipeline">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <div className="pipe-ico"><Icon name={s.icon} size={20} /></div>
                <span className="pipe-n">Step {i + 1}</span>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="l-section" id="features">
        <div className="l-wrap">
          <div className="l-head">
            <span className="eyebrow">Features</span>
            <h2>Everything a small business needs to stay out of the red</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature">
                <div className="f-ico"><Icon name={f.icon} /></div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-section alt">
        <div className="l-wrap">
          <div className="l-head">
            <span className="eyebrow">Built for your industry</span>
            <h2>Tell us what you do. We'll bring the right tools.</h2>
            <p>During onboarding you pick your industry. EPRI loads matching benchmarks, material presets for pricing, and specialised tools.</p>
          </div>
          <div className="industry-grid">
            {industryList.map((i) => (
              <div key={i.key} className="industry">
                <div className="row"><span className="emoji">{i.icon}</span><b>{i.label}</b></div>
                <ul>{i.tools.map((t) => <li key={t}>{t}</li>)}</ul>
                <div className="xs muted">Typical net margin {pct(i.benchmarks.netMargin[0], 0)}–{pct(i.benchmarks.netMargin[1], 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-section" id="security">
        <div className="l-wrap sec-grid">
          <div>
            <span className="eyebrow"><Icon name="shield" size={14} /> Security</span>
            <h2 style={{ marginTop: 10 }}>Bank-grade protection for your books</h2>
            <p className="lead" style={{ fontSize: 17 }}>Financial data is the most sensitive thing a business owns. Security isn't a feature we added — it's how the workspace is stored.</p>
            <div className="cipher">
              <div className="xs muted">What's actually saved on your device</div>
              <code>{`{ "alg": "AES-256-GCM", "kdf": "PBKDF2-SHA256", "iter": 310000,\n  "iv": "k3Jd9…", "ct": "q8Z1fM0pX2vR7…" }`}</code>
            </div>
            <h4 style={{ marginTop: 28, marginBottom: 12 }}>Import formats</h4>
            <div className="row wrap" style={{ gap: 8 }}>
              {FORMATS.map((f) => (
                <span key={f.name} className={`pill ${f.status === "Ready" ? "good" : ""}`}>{f.status === "Ready" ? "✓" : "◷"} {f.name}</span>
              ))}
            </div>
          </div>
          <ol className="sec-layers">
            {SECURITY.map((s, i) => (
              <li key={s.title}>
                <span className="layer-n">{i + 1}</span>
                <div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="l-section alt">
        <div className="l-wrap ai-grid">
          <div>
            <span className="eyebrow"><Icon name="ai" size={14} /> AI engine</span>
            <h2 style={{ marginTop: 10 }}>Smart where it helps. Predictable where it counts.</h2>
            <p className="lead" style={{ fontSize: 17 }}>Numbers are calculated with transparent, testable math — never guessed by a language model. AI is used for what it's good at: explaining, answering questions and suggesting next steps.</p>
          </div>
          <div className="ai-cards">
            <div><b>Anomaly detection</b><p>Flags any category that jumps well outside its normal range.</p></div>
            <div><b>Forecasting</b><p>Trend plus seasonality projects the next three months.</p></div>
            <div><b>Benchmarking</b><p>Compares every cost to typical ranges for your industry.</p></div>
            <div><b>Plain-English advisor</b><p>Ask "why was March bad?" and get an answer grounded in your data.</p></div>
          </div>
        </div>
      </section>

      <section className="l-section" id="pricing">
        <div className="l-wrap">
          <div className="l-head">
            <span className="eyebrow">Pricing</span>
            <h2>Less than one hour with an accountant</h2>
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <div className="seg">
                <button className={!annual ? "on" : ""} onClick={() => setAnnual(false)}>Monthly</button>
                <button className={annual ? "on" : ""} onClick={() => setAnnual(true)}>Annual · 2 months free</button>
              </div>
            </div>
          </div>
          <div className="plans">
            {PLANS.map((p) => (
              <div key={p.name} className={`plan ${p.popular ? "popular" : ""}`}>
                {p.popular && <span className="pop">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="small muted">{p.blurb}</p>
                <div className="price">
                  <b>${annual ? Math.round((p.price * 10) / 12) : p.price}</b>
                  <span>/ month{annual ? ", billed yearly" : ""}</span>
                </div>
                <Link to="/start" className={`btn ${p.popular ? "primary" : ""}`} style={{ width: "100%" }}>Start 30-day free trial</Link>
                <ul>{p.features.map((f) => <li key={f}><Icon name="check" size={16} /> {f}</li>)}</ul>
              </div>
            ))}
            <div className="plan chamber">
              <h3>Chamber partner</h3>
              <p className="small muted">For chambers of commerce and business associations.</p>
              <div className="price"><b>20% off</b><span>for every member business</span></div>
              <a href="#contact" className="btn" style={{ width: "100%" }}>Talk to us</a>
              <ul>
                <li><Icon name="check" size={16} /> Member discount on any plan</li>
                <li><Icon name="check" size={16} /> Free onboarding workshops</li>
                <li><Icon name="check" size={16} /> Anonymous local benchmarks</li>
              </ul>
            </div>
          </div>
          <div className="roi">
            <h4>What the same help costs elsewhere</h4>
            <div className="roi-rows">
              {[
                { label: "Fractional CFO", lo: 3000, hi: 5000 },
                { label: "Part-time bookkeeper", lo: 400, hi: 800 },
                { label: "EPRI Growth", lo: 49, hi: 49, us: true },
              ].map((r) => (
                <div key={r.label} className="roi-row">
                  <span>{r.label}</span>
                  <div className="roi-bar"><i className={r.us ? "us" : ""} style={{ width: `${Math.max(1.5, (r.hi / 5000) * 100)}%` }} /></div>
                  <b className="tabnum">{r.lo === r.hi ? `$${r.lo}` : `$${r.lo.toLocaleString()}–${r.hi.toLocaleString()}`}/mo</b>
                </div>
              ))}
            </div>
            <p className="xs muted" style={{ marginTop: 10 }}>Typical US market rates for small businesses; your local rates will vary. EPRI doesn't replace an accountant for taxes and filings.</p>
          </div>
        </div>
      </section>

      <section className="l-section alt">
        <div className="l-wrap faq-wrap">
          <div className="l-head" style={{ textAlign: "left", margin: 0 }}>
            <span className="eyebrow">FAQ</span>
            <h2>Questions business owners ask</h2>
          </div>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <div key={q} className={`faq-item ${faq === i ? "open" : ""}`}>
                <button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i}>
                  {q}
                  <Icon name="plus" />
                </button>
                {faq === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-section cta" id="contact">
        <div className="l-wrap">
          <h2>See your business the way a CFO would.</h2>
          <p>Ten minutes to set up. Free for 30 days. Your data stays encrypted and yours.</p>
          <div className="row wrap" style={{ justifyContent: "center", marginTop: 24 }}>
            <Link to="/start" className="btn primary lg">Get started free</Link>
            <button className="btn lg" onClick={() => setDemo(true)}>Try the demo</button>
          </div>
        </div>
      </section>

      <footer className="l-footer">
        <div className="l-wrap row between wrap">
          <div className="row"><Logo size={24} /><b>EPRI</b><span className="muted small">Automated financial manager & advisor</span></div>
          <span className="muted small">Figures shown in demos are generated sample data.</span>
        </div>
      </footer>

      {demo && <DemoPicker onClose={() => setDemo(false)} />}
    </div>
  );
}
