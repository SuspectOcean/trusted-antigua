"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";

const ERR = {
  cannot_remove_self: "You cannot remove your own admin access.",
  last_admin: "You cannot remove the last administrator.",
  not_admin: "Only administrators can change roles.",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(null);

  const reload = useCallback(async () => setRows(await api.adminListUsers()), []);
  useEffect(() => { reload(); }, [reload]);

  async function setAdmin(id, make, role = "admin") {
    setBusy(id);
    try { await api.adminSetAdmin(id, make, role); setFlash(make ? "Admin access granted." : "Admin access removed."); await reload(); }
    catch (e) {
      const key = String(e?.message || "").match(/cannot_remove_self|last_admin|not_admin/)?.[0];
      setFlash(ERR[key] || "Could not update role.");
    }
    finally { setBusy(null); }
  }

  const filtered = q.trim()
    ? rows.filter((r) => `${r.email || ""} ${r.first_name || ""} ${r.area || ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    : rows;
  const admins = rows.filter((r) => r.is_admin);

  return (
    <AdminShell title="Users" subtitle="Accounts and administrator access. Admin rights are an allowlist, not a public role.">
      <Flash msg={flash} />

      <Panel title={`Administrators (${admins.length})`}>
        {!admins.length ? <div className="text-[13px] text-muted">No administrators found.</div> : (
          <div className="space-y-1.5">
            {admins.map((a) => (
              <div key={a.id} className="bg-surface border border-amber/30 rounded-xl p-2.5 flex items-center gap-2">
                <span className="text-[13px] text-ink flex-1 truncate">{a.email}{a.id === user?.id ? " (you)" : ""}</span>
                <span className="text-[11px] uppercase tracking-wide bg-amber/15 text-amber px-2 py-0.5 rounded-full">{a.role || "admin"}</span>
                <button disabled={busy === a.id} onClick={() => setAdmin(a.id, false)} className="text-[11px] text-err underline disabled:opacity-50">Remove</button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={`All users (${rows.length})`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email, name or area" className={inputCls} />
        <div className="mt-2 space-y-1.5">
          {filtered.slice(0, 100).map((r) => (
            <div key={r.id} className="bg-surface border border-white/10 rounded-xl p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink flex-1 truncate">{r.email}</span>
                {r.is_admin ? <span className="text-[10px] uppercase tracking-wide bg-amber/15 text-amber px-2 py-0.5 rounded-full">{r.role || "admin"}</span> : null}
              </div>
              <div className="text-[11px] text-muted mt-0.5">
                {r.first_name ? `${r.first_name}${r.area ? `, ${r.area}` : ""}` : "No profile yet"}
                {r.created_at ? ` · joined ${String(r.created_at).slice(0, 10)}` : ""}
              </div>
              <div className="mt-1.5 flex gap-2">
                {r.is_admin ? (
                  <button disabled={busy === r.id} onClick={() => setAdmin(r.id, false)} className="px-3 py-1 rounded-full border border-err/40 text-err text-[11px] disabled:opacity-50">Remove admin</button>
                ) : (
                  <>
                    <button disabled={busy === r.id} onClick={() => setAdmin(r.id, true, "admin")} className="px-3 py-1 rounded-full border border-white/15 text-ink text-[11px] disabled:opacity-50">Make admin</button>
                    <button disabled={busy === r.id} onClick={() => setAdmin(r.id, true, "moderator")} className="px-3 py-1 rounded-full border border-white/15 text-ink text-[11px] disabled:opacity-50">Make moderator</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {filtered.length > 100 ? <div className="text-[12px] text-muted">Showing first 100 of {filtered.length}.</div> : null}
        </div>
      </Panel>
    </AdminShell>
  );
}
