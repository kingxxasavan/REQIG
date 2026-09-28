import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo, Icon } from "../components/Icons.jsx";
import { ThemeButton } from "../components/Layout.jsx";
import { Field, NumInput, Alert, Pill, Meter } from "../components/UI.jsx";
import FileDrop from "../components/FileDrop.jsx";
import { HealthRing } from "../components/Charts.jsx";
import { useStore } from "../lib/store.jsx";
import { industryList, AGE_GROUPS, EXPENSE_CATEGORIES } from "../lib/industries.js";
import { ROLES, DEPARTMENTS } from "../lib/rbac.js";
import { readFileRows, rowsToMonths, rowsToEmployees } from "../lib/parse.js";
import { generateMonths, lastCompleteMonth } from "../lib/demo.js";
import { analyze, CAT_KEYS } from "../lib/analytics.js";
import { passphraseStrength } from "../lib/crypto.js";
import { money, monthLabel, uid, addMonths } from "../lib/format.js";
import { DemoPicker } from "./Landing.jsx";

const STEPS = ["Company", "Team & roles", "Financial history", "Customers", "Security", "Baseline"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function blankMonths() {
  const end = lastCompleteMonth();
  return Array.from({ length: 12 }, (_, i) => ({ month: addMonths(end, i - 11), revenue: 0, ...Object.fromEntries(CAT_KEYS.map((k) => [k, 0])) }));
}

export default function Onboarding() {
  const nav = useNavigate();
  const { replaceState, enableEncryption, state: existing } = useStore();
  const [step, setStep] = useState(0);
  const [demo, setDemo] = useState(false);

  const [company, setCompany] = useState({ name: "", industry: "", employees: 5, currency: "USD", fiscalStart: 1, location: "", cashOnHand: 0 });
  const [owner, setOwner] = useState({ name: "", email: "" });
  const [members, setMembers] = useState([]);
  const [months, setMonths] = useState([]);
  const [dataMode, setDataMode] = useState("upload");
  const [importInfo, setImportInfo] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [demographics, setDemographics] = useState({ customerType: "B2C", reach: "Local", ages: { "18-24": 15, "25-34": 30, "35-44": 25, "45-54": 18, "55+": 12 } });
  const [pass, setPass] = useState({ p1: "", p2: "", skip: false });
  const [err, setErr] = useState("");

  const valid = [
    company.name.trim() && company.industry && company.employees > 0,
    owner.name.trim(),
    months.length > 0 && months.some((m) => m.revenue > 0),
    true,
    pass.skip || (pass.p1.length >= 10 && pass.p1 === pass.p2),
    true,
  ];

  const next = () => {
    setErr("");
    if (!valid[step]) {
      setErr(["Add a company name, industry and team size.", "Add the owner's name.", "Add at least one month with revenue.", "", "Passphrase must be 10+ characters and match — or choose to skip.", ""][step]);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const workspace = useMemo(() => {
    const ownerId = "u-" + uid();
    const avg = (k) => (months.length ? months.reduce((a, m) => a + (m[k] || 0), 0) / months.length : 0);
    return {
      version: 1,
      onboarded: true,
      demo: false,
      company: { ...company, name: company.name.trim() },
      demographics,
      months,
      budgets: Object.fromEntries(CAT_KEYS.map((k) => [k, Math.round(avg(k) * 12)])),
      employees: employees.map((e) => ({ id: uid(), ...e })),
      team: [{ id: ownerId, name: owner.name.trim(), email: owner.email, role: "owner", dept: "Management" }, ...members.filter((m) => m.name.trim()).map((m) => ({ ...m, id: "u-" + uid() }))],
      currentUserId: ownerId,
      suppliers: [],
      inventory: [],
      damages: [],
      returns: [],
      complaints: [],
      products: [],
      audit: [{ id: uid(), at: new Date().toISOString(), user: owner.name.trim(), role: "owner", action: `Workspace created (${months.length} months imported)` }],
    };
  }, [company, demographics, months, employees, owner, members]);

  const finish = async () => {
    replaceState(workspace);
    if (!pass.skip && pass.p1) await enableEncryption(pass.p1, workspace);
    nav("/app");
  };

  return (
    <div className="onb">
      <div className="onb-top">
        <div className="onb-wrap row between" style={{ paddingBottom: 0 }}>
          <Link to="/" className="brand" style={{ padding: 0 }}>
            <Logo /> EPRI
          </Link>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn ghost sm" onClick={() => setDemo(true)}>Skip — use sample data</button>
            <ThemeButton />
          </div>
        </div>
      </div>
      <div className="onb-wrap">
        {existing?.onboarded && (
          <div className="readonly-banner" style={{ marginBottom: 12 }}>
            <Icon name="eye" size={16} /> You already have a workspace. Finishing this setup will replace it. <Link to="/app">Back to dashboard</Link>
          </div>
        )}
        <div className="steps" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <div key={s} className={`st ${i < step ? "done" : i === step ? "on" : ""}`}>
              <i />
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div className="card onb-card">
          {step === 0 && <StepCompany company={company} setCompany={setCompany} />}
          {step === 1 && <StepTeam owner={owner} setOwner={setOwner} members={members} setMembers={setMembers} />}
          {step === 2 && (
            <StepData
              company={company}
              months={months}
              setMonths={setMonths}
              mode={dataMode}
              setMode={setDataMode}
              importInfo={importInfo}
              setImportInfo={setImportInfo}
              employees={employees}
              setEmployees={setEmployees}
            />
          )}
          {step === 3 && <StepCustomers d={demographics} setD={setDemographics} />}
          {step === 4 && <StepSecurity pass={pass} setPass={setPass} />}
          {step === 5 && <StepBaseline workspace={workspace} encrypt={!pass.skip} />}

          {err && <div style={{ marginTop: 16 }}><Alert level="warning" title={err} /></div>}
          <div className="onb-foot">
            <button className="btn" onClick={() => (step === 0 ? nav("/") : setStep(step - 1))}>
              {step === 0 ? "Cancel" : "Back"}
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn primary" onClick={next}>
                Continue <Icon name="arrow" size={16} />
              </button>
            ) : (
              <button className="btn primary" onClick={finish}>
                Go to my dashboard <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {demo && <DemoPicker onClose={() => setDemo(false)} />}
    </div>
  );
}

function StepCompany({ company, setCompany }) {
  const set = (k) => (v) => setCompany((c) => ({ ...c, [k]: v }));
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h2>Tell us about your business</h2>
        <p className="text-2" style={{ marginTop: 4 }}>This sets your benchmarks, pricing presets and the tools you'll see.</p>
      </div>
      <div className="form-grid">
        <Field label="Company name">
          <input className="input" value={company.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Harbor Street Bakery" autoFocus />
        </Field>
        <Field label="Number of employees">
          <NumInput value={company.employees} onChange={set("employees")} min={1} step={1} />
        </Field>
        <Field label="City / area">
          <input className="input" value={company.location} onChange={(e) => set("location")(e.target.value)} placeholder="e.g. Springfield" />
        </Field>
      </div>
      <div className="field">
        <span>What kind of business is it?</span>
        <div className="pick-grid">
          {industryList.map((i) => (
            <button key={i.key} className={`pick ${company.industry === i.key ? "on" : ""}`} onClick={() => set("industry")(i.key)} aria-pressed={company.industry === i.key}>
              <span className="emoji">{i.icon}</span>
              <b className="small">{i.label}</b>
            </button>
          ))}
        </div>
        {company.industry && (
          <small>
            Specialised tools unlocked: {industryList.find((i) => i.key === company.industry).tools.join(" · ")}
          </small>
        )}
      </div>
      <div className="form-grid">
        <Field label="Currency">
          <select className="input" value={company.currency} onChange={(e) => set("currency")(e.target.value)}>
            {["USD", "CAD", "GBP", "EUR", "AUD", "INR"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Fiscal year starts in">
          <select className="input" value={company.fiscalStart} onChange={(e) => set("fiscalStart")(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Cash in the bank (optional)" hint="Used to estimate your cash runway.">
          <NumInput value={company.cashOnHand} onChange={set("cashOnHand")} min={0} prefix={company.currency} />
        </Field>
      </div>
    </div>
  );
}

function StepTeam({ owner, setOwner, members, setMembers }) {
  const add = () => setMembers((m) => [...m, { name: "", email: "", role: "finance", dept: "Finance" }]);
  const upd = (i, k, v) => setMembers((m) => m.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h2>Set up your admin and team</h2>
        <p className="text-2" style={{ marginTop: 4 }}>You're the owner. Invite a financial manager and anyone else who needs access — each role sees and edits only what it should.</p>
      </div>
      <div className="form-grid">
        <Field label="Your name (Owner / Admin)">
          <input className="input" value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Your email">
          <input className="input" type="email" value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} />
        </Field>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        {members.map((m, i) => (
          <div key={i} className="row wrap" style={{ alignItems: "flex-end", padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
            <Field label="Name"><input className="input" value={m.name} onChange={(e) => upd(i, "name", e.target.value)} /></Field>
            <Field label="Email"><input className="input" type="email" value={m.email} onChange={(e) => upd(i, "email", e.target.value)} /></Field>
            <Field label="Role">
              <select className="input" value={m.role} onChange={(e) => upd(i, "role", e.target.value)}>
                {Object.entries(ROLES).filter(([k]) => k !== "owner").map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
              </select>
            </Field>
            {m.role === "department" && (
              <Field label="Department">
                <select className="input" value={m.dept} onChange={(e) => upd(i, "dept", e.target.value)}>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
            )}
            <button className="btn ghost icon-btn" onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))} aria-label="Remove member"><Icon name="trash" /></button>
          </div>
        ))}
        <button className="btn" onClick={add} style={{ alignSelf: "flex-start" }}><Icon name="plus" size={16} /> Add team member</button>
      </div>
      <div className="grid g2">
        {Object.entries(ROLES).map(([k, r]) => (
          <div key={k} className="card" style={{ padding: 14, boxShadow: "none", background: "var(--surface-2)" }}>
            <b className="small">{r.label}</b>
            <p className="xs text-2" style={{ marginTop: 2 }}>{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepData({ company, months, setMonths, mode, setMode, importInfo, setImportInfo, employees, setEmployees }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const onFile = async (file) => {
    setBusy(true);
    setErr("");
    try {
      const rows = await readFileRows(file);
      const res = rowsToMonths(rows);
      if (!res.months.length) throw new Error(res.warnings[0] || "No usable rows found.");
      setMonths(res.months);
      setImportInfo({ file: file.name, ...res });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  const onPayroll = async (file) => {
    try {
      const e = rowsToEmployees(await readFileRows(file));
      if (!e.length) throw new Error("No employee rows found — need at least a Name column.");
      setEmployees(e);
    } catch (e) {
      setErr(e.message);
    }
  };
  const switchMode = (m) => {
    setMode(m);
    setErr("");
    if (m === "manual" && !months.length) setMonths(blankMonths());
    if (m === "sample") {
      setMonths(generateMonths(company.industry || "services", { monthly: Math.max(8000, company.employees * 6500) }));
      setImportInfo(null);
    }
  };
  const updM = (i, k, v) => setMonths((ms) => ms.map((m, j) => (j === i ? { ...m, [k]: v } : m)));

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <h2>Add your last 12 months</h2>
        <p className="text-2" style={{ marginTop: 4 }}>Revenue and spending on production, operations, payroll and marketing. This is the baseline everything else is measured against.</p>
      </div>
      <div className="seg">
        <button className={mode === "upload" ? "on" : ""} onClick={() => switchMode("upload")}>Upload a file</button>
        <button className={mode === "manual" ? "on" : ""} onClick={() => switchMode("manual")}>Type it in</button>
        <button className={mode === "sample" ? "on" : ""} onClick={() => switchMode("sample")}>Use sample numbers</button>
      </div>

      {mode === "upload" && (
        <>
          <FileDrop onFile={onFile} title={busy ? "Reading…" : "Drop your spending & revenue file"} />
          <p className="xs muted">
            Works with accounting exports and spreadsheets. One row per month (<code>month, revenue, production, operations, payroll, marketing</code>) or one row per transaction (<code>date, category, amount</code>). Get a template:{" "}
            <a href="templates/monthly-financials.csv" download>monthly</a> · <a href="templates/transactions.csv" download>transactions</a>
          </p>
        </>
      )}
      {mode === "sample" && <Alert level="info" title="Sample numbers loaded" detail={`Realistic figures for a ${industryList.find((i) => i.key === company.industry)?.label.toLowerCase() || "business"} of your size. You can replace them with real data any time from Data & uploads.`} />}
      {err && <Alert level="critical" title="Couldn't import that file" detail={err} />}
      {importInfo && mode === "upload" && (
        <Alert level="good" title={`Imported ${importInfo.months.length} month${importInfo.months.length === 1 ? "" : "s"} from ${importInfo.file}`} detail={[`Read as ${importInfo.mode === "transactions" ? "a transaction list (totalled per month)" : "monthly totals"}.`, ...importInfo.warnings].join(" ")} />
      )}

      {months.length > 0 && (
        <div className="table-wrap card flush" style={{ maxHeight: 360 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="r">Revenue</th>
                {EXPENSE_CATEGORIES.map((c) => <th key={c.key} className="r" title={c.hint}>{c.label}</th>)}
                <th className="r">Profit</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => {
                const exp = CAT_KEYS.reduce((a, k) => a + (m[k] || 0), 0);
                return (
                  <tr key={m.month}>
                    <td>{monthLabel(m.month, "short")}</td>
                    {["revenue", ...CAT_KEYS].map((k) => (
                      <td key={k} className="r">
                        {mode === "manual" ? <NumInput value={m[k]} onChange={(v) => updM(i, k, v)} min={0} style={{ width: 96 }} aria-label={`${k} ${m.month}`} /> : money(m[k], company.currency)}
                      </td>
                    ))}
                    <td className="r" style={{ color: m.revenue - exp < 0 ? "var(--critical-ink)" : undefined, fontWeight: 600 }}>{money(m.revenue - exp, company.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <details className="card" style={{ boxShadow: "none", padding: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Optional: upload employee salaries {employees.length > 0 && <Pill level="good">{employees.length} employees</Pill>}</summary>
        <div style={{ marginTop: 12 }}>
          <FileDrop onFile={onPayroll} title="Drop a payroll file" hint="Columns: name, title, department, salary (annual)" />
          <p className="xs muted" style={{ marginTop: 8 }}>Template: <a href="templates/payroll.csv" download>payroll.csv</a>. Salaries are only visible to the owner and financial manager.</p>
        </div>
      </details>
    </div>
  );
}

function StepCustomers({ d, setD }) {
  const total = AGE_GROUPS.reduce((a, g) => a + (d.ages[g] || 0), 0);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h2>Who are your customers?</h2>
        <p className="text-2" style={{ marginTop: 4 }}>Demographics shape how EPRI suggests splitting your advertising, and how it plans production and operations around demand.</p>
      </div>
      <div className="form-grid">
        <Field label="You mostly sell to">
          <select className="input" value={d.customerType} onChange={(e) => setD({ ...d, customerType: e.target.value })}>
            <option value="B2C">Consumers (B2C)</option>
            <option value="B2B">Other businesses (B2B)</option>
            <option value="Both">Both</option>
          </select>
        </Field>
        <Field label="Where your customers are">
          <select className="input" value={d.reach} onChange={(e) => setD({ ...d, reach: e.target.value })}>
            {["Local", "Regional", "National / online"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <div className="field">
        <span>Customer age mix</span>
        <div className="stack" style={{ gap: 10 }}>
          {AGE_GROUPS.map((g) => (
            <div key={g} className="row">
              <span className="small" style={{ width: 56 }}>{g}</span>
              <input type="range" min={0} max={60} value={d.ages[g]} onChange={(e) => setD({ ...d, ages: { ...d.ages, [g]: Number(e.target.value) } })} className="grow" aria-label={`Share aged ${g}`} />
              <b className="small tabnum" style={{ width: 44, textAlign: "right" }}>{total ? Math.round((d.ages[g] / total) * 100) : 0}%</b>
            </div>
          ))}
        </div>
        <small>Rough guesses are fine — shares are normalised to 100%.</small>
      </div>
    </div>
  );
}

function StepSecurity({ pass, setPass }) {
  const s = passphraseStrength(pass.p1);
  const level = s.score >= 4 ? "good" : s.score >= 2 ? "warning" : "critical";
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <h2>Protect your workspace</h2>
        <p className="text-2" style={{ marginTop: 4 }}>Choose a passphrase. It encrypts everything with AES-256-GCM on this device. We never see or store it — so keep it somewhere safe.</p>
      </div>
      <div className="form-grid">
        <Field label="Passphrase" hint="At least 10 characters. A short sentence works well.">
          <input className="input" type="password" value={pass.p1} onChange={(e) => setPass({ ...pass, p1: e.target.value, skip: false })} autoComplete="new-password" />
        </Field>
        <Field label="Confirm passphrase">
          <input className="input" type="password" value={pass.p2} onChange={(e) => setPass({ ...pass, p2: e.target.value, skip: false })} autoComplete="new-password" />
        </Field>
      </div>
      {pass.p1 && (
        <div className="stack" style={{ gap: 6 }}>
          <Meter value={s.score} max={5} level={level} />
          <span className="xs muted">Strength: {s.label}{pass.p2 && pass.p1 !== pass.p2 ? " · passphrases don't match" : ""}</span>
        </div>
      )}
      <label className="row small" style={{ gap: 8 }}>
        <input type="checkbox" checked={pass.skip} onChange={(e) => setPass({ ...pass, skip: e.target.checked })} />
        Skip for now (not recommended — you can turn it on later in Settings)
      </label>
      <div className="grid g3">
        {[
          ["AES-256-GCM", "Authenticated encryption for everything saved"],
          ["PBKDF2 · 310k rounds", "Slows down anyone trying to guess your passphrase"],
          ["Key in memory only", "Reloading the page locks the workspace"],
        ].map(([a, b]) => (
          <div key={a} className="card" style={{ padding: 14, boxShadow: "none", background: "var(--surface-2)" }}>
            <b className="small"><Icon name="shield" size={14} /> {a}</b>
            <p className="xs text-2" style={{ marginTop: 4 }}>{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepBaseline({ workspace, encrypt }) {
  const a = useMemo(() => analyze(workspace), [workspace]);
  const tasks = [
    `Validated ${workspace.months.length} months of data`,
    "Calculated monthly profit and margins",
    "Detected seasonality and trend",
    "Compared costs to industry benchmarks",
    "Set annual budgets from your history",
    encrypt ? "Encrypted workspace with AES-256-GCM" : "Workspace saved (unencrypted)",
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= tasks.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 420);
    return () => clearTimeout(t);
  }, [done, tasks.length]);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h2>Building your financial baseline</h2>
        <p className="text-2" style={{ marginTop: 4 }}>This is what EPRI will measure every future month against.</p>
      </div>
      <div className="analysis-steps">
        {tasks.map((t, i) => (
          <div key={t} className={i < done ? "done" : ""}>
            <span className="ck">{i < done ? <Icon name="check" size={14} strokeWidth={3} /> : <span className="spinner" style={{ width: 12, height: 12, color: "var(--muted)", opacity: i === done ? 1 : 0 }} />}</span>
            {t}
          </div>
        ))}
      </div>
      {done >= tasks.length && !a.empty && (
        <div className="grid g2" style={{ animation: "pop .3s ease" }}>
          <div className="card row" style={{ gap: 18 }}>
            <HealthRing score={a.health.score} level={a.health.level} />
            <div>
              <div className="small muted">Financial health</div>
              <h3 style={{ fontSize: 22 }}>{a.health.grade}</h3>
              <p className="small text-2" style={{ marginTop: 4 }}>
                {money(a.totals.revenue, workspace.company.currency, { compact: true })} revenue · {money(a.totals.profit, workspace.company.currency, { compact: true })} profit over {a.last12.length} months
              </p>
            </div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {a.alerts.slice(0, 3).map((x) => <Alert key={x.title} {...x} />)}
          </div>
        </div>
      )}
    </div>
  );
}
