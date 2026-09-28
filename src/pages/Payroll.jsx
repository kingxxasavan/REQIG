import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Stat, Pill, Modal, Field, NumInput, Alert, ReadOnly } from "../components/UI.jsx";
import { HBar } from "../components/Charts.jsx";
import FileDrop from "../components/FileDrop.jsx";
import { Icon } from "../components/Icons.jsx";
import { DEPARTMENTS, ROLES } from "../lib/rbac.js";
import { readFileRows, rowsToEmployees, toCSV, download } from "../lib/parse.js";
import { getIndustry } from "../lib/industries.js";
import { money, pct, uid } from "../lib/format.js";

const blank = { name: "", title: "", dept: "Operations", type: "Full-time", salary: 0 };

export default function Payroll() {
  const { state, analysis: a, currency, allowed, update, user, role, toast } = useStore();
  const [edit, setEdit] = useState(null);
  const [importing, setImporting] = useState(false);
  const [err, setErr] = useState("");
  const canEdit = allowed("payroll.edit");
  const seeAll = allowed("payroll.viewAll");

  // Row-level access: department heads see their department, viewers see themselves.
  const visible = state.employees.filter((e) => seeAll || (role === "department" && e.dept === user.dept) || e.id === user.employeeId);
  const scopeNote = seeAll ? null : role === "department" ? `Showing the ${user.dept} department only.` : "Showing your own record only.";

  const total = visible.reduce((s, e) => s + (e.salary || 0), 0);
  const byDept = {};
  visible.forEach((e) => (byDept[e.dept] = (byDept[e.dept] || 0) + (e.salary || 0)));
  const ind = getIndustry(state.company.industry);
  const labour = a.bench?.find((b) => b.key === "payroll");

  const save = () => {
    const isNew = !edit.id;
    update("payroll.edit", (s) => {
      if (isNew) s.employees.push({ ...edit, id: uid() });
      else s.employees = s.employees.map((e) => (e.id === edit.id ? edit : e));
    }, `${isNew ? "Added" : "Updated"} employee ${edit.name}`);
    setEdit(null);
  };
  const remove = (e) => update("payroll.edit", (s) => (s.employees = s.employees.filter((x) => x.id !== e.id)), `Removed employee ${e.name}`);
  const onFile = async (file) => {
    setErr("");
    try {
      const list = rowsToEmployees(await readFileRows(file));
      if (!list.length) throw new Error("No employee rows found — the file needs at least a Name column.");
      update("payroll.edit", (s) => (s.employees = list.map((e) => ({ ...e, id: uid() }))), `Imported ${list.length} employees from ${file.name}`);
      toast(`Imported ${list.length} employees`, "good");
      setImporting(false);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <>
      <PageHead title="Payroll" subtitle="Salaries by person and department, and labour cost as a share of revenue.">
        {allowed("data.export") && seeAll && <button className="btn" onClick={() => download("epri-payroll.csv", toCSV(state.employees, [{ key: "name", label: "name" }, { key: "title", label: "title" }, { key: "dept", label: "department" }, { key: "type", label: "type" }, { key: "salary", label: "salary" }]))}><Icon name="download" size={16} /> Export</button>}
        {canEdit && <button className="btn" onClick={() => setImporting(true)}><Icon name="upload" size={16} /> Import</button>}
        {canEdit && <button className="btn primary" onClick={() => setEdit({ ...blank })}><Icon name="plus" size={16} /> Add employee</button>}
      </PageHead>
      <ReadOnly perm="payroll.edit" />
      {scopeNote && <Alert level="info" title={`Access limited for ${ROLES[role].label}`} detail={scopeNote} />}

      <div className="grid g4">
        <Stat label={seeAll ? "Annual salaries" : "Visible salaries"} value={money(total, currency, { compact: true })} sub={`${visible.length} ${visible.length === 1 ? "person" : "people"}`} />
        <Stat label="Monthly payroll (books)" value={money(a.latest?.payroll, currency, { compact: true })} sub="incl. taxes & benefits" />
        <Stat label="Labour cost / revenue" value={pct(labour?.share)} sub={<Pill level={labour?.status === "over" ? "warning" : "good"}>Typical {pct(ind.benchmarks.payroll[0], 0)}–{pct(ind.benchmarks.payroll[1], 0)}</Pill>} />
        <Stat label="Average salary" value={money(visible.length ? total / visible.length : 0, currency, { compact: true })} sub="per employee" />
      </div>

      <div className="grid g3">
        <Card title="Employees" className="span2" flush tour="payroll-table">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Department</th><th>Type</th><th className="r">Annual salary</th><th className="r">Monthly</th>{canEdit && <th />}</tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id}>
                    <td><b>{e.name}</b><div className="xs muted">{e.title}</div></td>
                    <td>{e.dept}</td>
                    <td><Pill>{e.type}</Pill></td>
                    <td className="r">{money(e.salary, currency)}</td>
                    <td className="r muted">{money(e.salary / 12, currency)}</td>
                    {canEdit && (
                      <td className="r" style={{ whiteSpace: "nowrap" }}>
                        <button className="btn ghost icon-btn" onClick={() => setEdit({ ...e })} aria-label={`Edit ${e.name}`}><Icon name="edit" size={16} /></button>
                        <button className="btn ghost icon-btn" onClick={() => remove(e)} aria-label={`Remove ${e.name}`}><Icon name="trash" size={16} /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {!visible.length && <tr><td colSpan={6} className="muted" style={{ textAlign: "center", padding: 30 }}>No employees to show.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="By department" subtitle="Annual salaries">
          {Object.keys(byDept).length ? <HBar items={Object.entries(byDept).map(([label, value]) => ({ label, value })).sort((x, y) => y.value - x.value)} label="Salaries" currency={currency} /> : <p className="muted small">Nothing to chart.</p>}
        </Card>
      </div>

      {edit && (
        <Modal title={edit.id ? "Edit employee" : "Add employee"} onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary" disabled={!edit.name.trim()} onClick={save}>Save</button></>}>
          <div className="form-grid">
            <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus /></Field>
            <Field label="Job title"><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Department"><select className="input" value={edit.dept} onChange={(e) => setEdit({ ...edit, dept: e.target.value })}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Type"><select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>{["Full-time", "Part-time", "Contractor"].map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Annual salary"><NumInput value={edit.salary} onChange={(v) => setEdit({ ...edit, salary: v })} min={0} prefix={currency} /></Field>
          </div>
        </Modal>
      )}
      {importing && (
        <Modal title="Import payroll" onClose={() => setImporting(false)}>
          <p className="small text-2">Replaces the employee list. Columns: name, title, department, type, salary (annual). <a href="templates/payroll.csv" download>Download template</a></p>
          <FileDrop onFile={onFile} />
          {err && <Alert level="critical" title="Import failed" detail={err} />}
        </Modal>
      )}
    </>
  );
}
