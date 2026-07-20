"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";

const ERR = {
  not_owner: "Only the owner can manage invitations.",
  already_invited: "That email already has a pending invitation.",
  already_has_role: "That email already has a role.",
  bad_email: "That doesn't look like a valid email address.",
  bad_role: "Invalid role.",
  not_pending: "That invitation is no longer pending.",
};

const STATUS_STYLE = {
  pending: "bg-amber/15 text-amber",
  accepted: "bg-ok/15 text-ok",
  revoked: "bg-err/15 text-err",
  expired: "bg-white/10 text-muted",
};

// Invitations attach by email at sign-in, with any auth provider.
// Single-use, 7-day expiry, fully audited. No SQL, no user IDs.
export default function AdminInvitationsPage() {
  const { isOwner } = useAuth();
  const [rows, setRows] = useState([]);
  const [audit, setAudit] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("moderator");
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setRows(await api.adminInvitations());
    setAudit(await api.adminAuditLog());
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function invite(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.adminInviteRole(email.trim(), role);
      setEmail(""); setFlash(`Invitation sent. When they sign in with that email, ${role} access attaches automatically.`);
      await reload();
    } catch (err) {
      const key = String(err?.message || "").match(/not_owner|already_invited|already_has_role|bad_email|bad_role/)?.[0];
      setFlash(ERR[key] || "Could not create the invitation.");
    } finally { setBusy(false); }
  }

  async function revoke(id) {
    setBusy(true);
    try { await api.adminRevokeInvitation(id); setFlash("Invitation revoked."); await reload(); }
    catch (err) {
      const key = String(err?.message || "").match(/not_owner|not_pending/)?.[0];
      setFlash(ERR[key] || "Could not revoke.");
    } finally { setBusy(false); }
  }

  return (
    <AdminShell title="Invitations" subtitle="Invite by email. The role attaches automatically when that email signs in, whatever the sign-in method.">
      <Flash msg={flash} />

      <Panel title="Invite someone">
        {!isOwner ? (
          <p className="text-[13px] text-muted">Only the owner can send or revoke invitations. You can view them below.</p>
        ) : (
          <form onSubmit={invite} className="bg-surface border border-white/10 rounded-2xl p-3 space-y-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="their@email.com" className={inputCls} />
            <div className="flex gap-2">
              <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                <option value="moderator">Moderator (review moderation only)</option>
                <option value="admin">Admin (full control centre)</option>
              </select>
              <button disabled={busy || !email.trim()} className="shrink-0 px-4 rounded-xl bg-amber text-navy font-semibold text-[13px] disabled:opacity-50">Invite</button>
            </div>
            <p className="text-[11px] text-muted">Single use, expires in 7 days. Every invitation and role change is recorded in the audit trail.</p>
          </form>
        )}
      </Panel>

      <Panel title={`Invitations (${rows.length})`}>
        {!rows.length ? <div className="text-[13px] text-muted">No invitations yet.</div> : (
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div key={r.id} className="bg-surface border border-white/10 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-ink flex-1 truncate">{r.email}</span>
                  <span className="text-[10px] uppercase tracking-wide bg-white/10 text-slate2 px-2 py-0.5 rounded-full">{r.role}</span>
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-muted">
                    Sent {String(r.created_at).slice(0, 10)}
                    {r.status === "pending" ? ` · expires ${String(r.expires_at).slice(0, 10)}` : ""}
                    {r.accepted_at ? ` · accepted ${String(r.accepted_at).slice(0, 10)}` : ""}
                  </span>
                  {isOwner && r.status === "pending" ? (
                    <button disabled={busy} onClick={() => revoke(r.id)} className="text-[11px] text-err underline disabled:opacity-50">Revoke</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {isOwner ? (
        <Panel title={`Audit trail (${audit.length})`}>
          {!audit.length ? <div className="text-[13px] text-muted">No permission changes recorded yet.</div> : (
            <div className="space-y-1.5">
              {audit.map((a) => (
                <div key={a.id} className="bg-surface2 rounded-xl p-2.5 text-[12px] text-slate2">
                  <b className="text-ink">{a.action.replace(/_/g, " ")}</b>
                  {a.role ? ` · ${a.role}` : ""}
                  {a.target_email ? ` · ${a.target_email}` : ""}
                  <span className="text-muted"> · by {a.actor_email || "system"} · {String(a.created_at).slice(0, 16).replace("T", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : null}
    </AdminShell>
  );
}
