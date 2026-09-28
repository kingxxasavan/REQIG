import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHead, Card, Pill, ReadOnly } from "../components/UI.jsx";
import EntityForm from "../components/EntityForm.jsx";
import { Icon } from "../components/Icons.jsx";
import { ROLES, PERMISSIONS, can, DEPARTMENTS } from "../lib/rbac.js";

const ROLE_LEVEL = { owner: "info", finance: "good", department: "warning", viewer: "" };

export default function Team() {
  const { state, user, allowed, update, switchUser, toast } = useStore();
  const [form, setForm] = useState(null);
  const canManage = allowed("team.manage");
  const owners = state.team.filter((m) => m.role === "owner").length;

  const save = () => {
    const isNew = !form.id;
    if (!isNew && form.role !== "owner" && state.team.find((m) => m.id === form.id)?.role === "owner" && owners <= 1) {
      toast("There must always be at least one owner.", "critical");
      return;
    }
    update("team.manage", (s) => {
      if (isNew) s.team.push({ ...form, id: "u-" + Math.random().toString(36).slice(2, 9) });
      else s.team = s.team.map((m) => (m.id === form.id ? form : m));
    }, `${isNew ? "Invited" : "Updated"} ${form.name} as ${ROLES[form.role].label}`);
    setForm(null);
  };
  const remove = (m) => {
    if (m.id === user.id) return toast("You can't remove yourself.", "critical");
    if (m.role === "owner" && owners <= 1) return toast("There must always be at least one owner.", "critical");
    update("team.manage", (s) => (s.team = s.team.filter((x) => x.id !== m.id)), `Removed ${m.name}`);
  };
  const viewAs = (m) => {
    switchUser(m.id);
    update(null, () => {}, `Switched view to ${m.name} (${ROLES[m.role].label})`);
    toast(`Now viewing as ${m.name} · ${ROLES[m.role].short}`);
  };

  const fields = [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", type: "email" },
    { key: "role", label: "Role", type: "select", options: Object.entries(ROLES).map(([k, r]) => ({ value: k, label: r.label })) },
    { key: "dept", label: "Department", type: "select", options: DEPARTMENTS, hint: "Department heads only see this department" },
  ];

  return (
    <>
      <PageHead title="Team & roles" subtitle="Who can see and change what. Every change is recorded in the audit log.">
        {canManage && <button className="btn primary" onClick={() => setForm({ name: "", email: "", role: "finance", dept: "Finance" })}><Icon name="plus" size={16} /> Invite member</button>}
      </PageHead>
      <ReadOnly perm="team.manage" />

      <Card title="Members" subtitle="Use “View as” to see the app exactly as that person would" flush>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th /></tr></thead>
            <tbody>
              {state.team.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.name}</b> {m.id === user.id && <Pill level="info">You</Pill>}<div className="xs muted">{m.email}</div></td>
                  <td><Pill level={ROLE_LEVEL[m.role]}>{ROLES[m.role].label}</Pill></td>
                  <td>{m.dept}</td>
                  <td className="r" style={{ whiteSpace: "nowrap" }}>
                    {m.id !== user.id && <button className="btn sm" onClick={() => viewAs(m)}><Icon name="eye" size={14} /> View as</button>}
                    {canManage && <button className="btn ghost icon-btn" onClick={() => setForm({ ...m })} aria-label={`Edit ${m.name}`}><Icon name="edit" size={16} /></button>}
                    {canManage && <button className="btn ghost icon-btn" onClick={() => remove(m)} aria-label={`Remove ${m.name}`}><Icon name="trash" size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Permissions by role" flush tour="team-perms">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Permission</th>{Object.entries(ROLES).map(([k, r]) => <th key={k} style={{ textAlign: "center" }}>{r.short}</th>)}</tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSIONS).map(([p, label]) => (
                <tr key={p}>
                  <td>{label}</td>
                  {Object.keys(ROLES).map((r) => (
                    <td key={r} style={{ textAlign: "center" }}>
                      {can(r, p) ? <span style={{ color: "var(--good-ink)" }} aria-label="Allowed"><Icon name="check" size={17} strokeWidth={2.6} /></span> : <span className="muted" aria-label="Not allowed">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {allowed("audit.view") && (
        <Card title="Audit log" subtitle={`Last ${Math.min(50, state.audit?.length || 0)} of ${state.audit?.length || 0} events`} flush>
          <div className="table-wrap" style={{ maxHeight: 420 }}>
            <table className="table">
              <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
              <tbody>
                {(state.audit || []).slice(0, 50).map((e) => (
                  <tr key={e.id}>
                    <td className="muted small" style={{ whiteSpace: "nowrap" }}>{new Date(e.at).toLocaleString()}</td>
                    <td className="small"><b>{e.user}</b>{e.role && <div className="xs muted">{ROLES[e.role]?.short}</div>}</td>
                    <td className="small">{e.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {form && <EntityForm title={form.id ? "Edit member" : "Invite member"} fields={fields} value={form} onChange={setForm} onSave={save} onClose={() => setForm(null)} />}
    </>
  );
}
