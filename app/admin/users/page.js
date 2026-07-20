"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";

const ERR = {
  cannot_remove_self: "You cannot remove your own access.",
  cannot_change_owner: "The owner role cannot be changed from here.",
  owner_not_assignable: "The owner role cannot be assigned.",
  not_owner: "Only the owner can manage admin roles.",
  not_admin: "Only administrators can change roles.",
  last_admin: "You cannot remove the last administrator.",
};

const ROLE_STYLE = {
  owner: "bg-teal/20 text-teal",
  admin: "bg-amber/15 text-amber",
  moderator: "bg-white/10 text-slate2",
};

export default function AdminUsersPage() {
  const { user, isOwner } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(null);

  const reload = useCallback(async () => setRows(await api.adminListUsers()), []);
  useEffect(() => { reload(); }, [reload]);

  async function setAdmin(id, make, role = "admin") {
    setBusy(id);
    try {
      await api.adminSetAdmin(id, make, role);
      setFlash(make ? `${role[0].toUpperCase()}${role.slice(1)} access granted.` : "Access removed.");
      await reload();
    } catch (e) {
      const key = String(e?.message || "").match(/cannot_remove_self|cannot_change_owner|owner_not_assignable|not_owner|not_admin|last_admin/)?.[0];
      setFlash(ERR[key] || "Could not update role.");
    } finally { setBusy(null); }
  }

  const filtered = q.trim()
    ? rows.filter((r) => `${r.email || ""} ${r.first_name || ""} ${r.area || ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    : rows;
  const staff = rows.filter((r) => r.is_admin);

  return (
    <AdminShell title="Users" subtitle="Accounts and roles. Owner > Admin > Moderator > Member. New staff are added by invitation, not by hand.">
      <Flash msg={flash} />

      <Panel
        title={`Team (${staff.length})`}
        action={<Link href="/admin/invitations" className="text-[12px] text-amber underline">Invite someone</Link>}
      >
        {!staff.length ? <div className="text-[13px] text-muted">No team members found.</div> : (
          <div className="space-y-1.5">
            {staff.map((a) => {
              const role = a.role || "admin";
              return (
                <div key={a.id} className="bg-surface border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
                  <span className="text-[13px] text-ink flex-1 truncate">{a.email}{a.id === user?.id ? " (you)" : ""}</span>
                  <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${ROLE_STYLE[role] || ""}`}>{role}</span>
                  {role !== "owner" && isOwner && a.id !== user?.id ? (
                    <button disabled={busy === a.id} onClick={() => setAdmin(a.id, false)} className="text-[11px] text-err underline disabled:opacity-50">Remove</button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {!isOwner ? <p className="text-[11px] text-muted mt-2">Only the owner can change admin roles.</p> : null}
      </Panel>

      <Panel title={`All users (${rows.length})`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email, name or area" className={inputCls} />
        <div className="mt-2 space-y-1.5">
          {filtered.slice(0, 100).map((r) => {
            const role = r.is_admin ? (r.role || "admin") : null;
            return (
              <div key={r.id} className="bg-surface border border-white/10 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-ink flex-1 truncate">{r.email}</span>
                  {role ? <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${ROLE_STYLE[role] || ""}`}>{role}</span> : null}
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {r.first_name ? `${r.first_name}${r.area ? `, ${r.area}` : ""}` : "No profile yet"}
                  {r.created_at ? ` · joined ${String(r.created_at).slice(0, 10)}` : ""}
                </div>
                {isOwner && role !== "owner" ? (
                  <div className="mt-1.5 flex gap-2">
                    {role ? (
                      r.id !== user?.id ? (
                        <button disabled={busy === r.id} onClick={() => setAdmin(r.id, false)} className="px-3 py-1 rounded-full border border-err/40 text-err text-[11px] disabled:opacity-50">Remove {role}</button>
                      ) : null
                    ) : (
                      <>
                        <button disabled={busy === r.id} onClick={() => setAdmin(r.id, true, "admin")} className="px-3 py-1 rounded-full border border-white/15 text-ink text-[11px] disabled:opacity-50">Make admin</button>
                        <button disabled={busy === r.id} onClick={() => setAdmin(r.id, true, "moderator")} className="px-3 py-1 rounded-full border border-white/15 text-ink text-[11px] disabled:opacity-50">Make moderator</button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
          {filtered.length > 100 ? <div className="text-[12px] text-muted">Showing first 100 of {filtered.length}.</div> : null}
        </div>
      </Panel>
    </AdminShell>
  );
}
