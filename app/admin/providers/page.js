"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";
import { CAT } from "@/lib/categories";
import { TRUST } from "@/lib/trust";

// Claims and trust levels. Reputation itself is never editable here.
export default function AdminProvidersPage() {
  const [claims, setClaims] = useState([]);
  const [approved, setApproved] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState(null);

  const reload = useCallback(async () => {
    const [c, a] = await Promise.all([api.adminClaims("pending"), api.adminClaims("approved")]);
    setClaims(c); setApproved(a);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function decideClaim(id, approve) {
    setBusyId(id);
    try { await api.adminDecideClaim(id, approve, note || null); setNote(""); setFlash(approve ? "Claim approved." : "Claim rejected."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }
  async function promote(providerId, level) {
    setBusyId(providerId);
    try { await api.adminSetTrust(providerId, level); setFlash("Trust level updated."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }
  async function revoke(providerId) {
    setBusyId(providerId);
    try { await api.adminRevoke(providerId); setFlash("Claim revoked."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }

  return (
    <AdminShell title="Providers" subtitle="Claims and trust levels. Ratings and reviews can never be edited from here.">
      <Flash msg={flash} />

      <Panel title={`Pending claims (${claims.length})`}>
        {!claims.length ? <div className="text-[13px] text-muted">Nothing waiting.</div> : (
          <div className="space-y-2.5">
            {claims.map((c) => (
              <div key={c.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <Link href={`/provider?id=${encodeURIComponent(c.provider_id)}`} className="font-display font-semibold text-ink">{c.providers?.alias || c.providers?.name || "Provider"}</Link>
                  <span className="text-[11px] text-muted">{CAT[c.providers?.category_id]?.name || ""}</span>
                </div>
                {c.submitted_name ? <div className="text-[13px] text-slate2 mt-1">Name: {c.submitted_name}</div> : null}
                {c.submitted_description ? <div className="text-[13px] text-slate2">Desc: {c.submitted_description}</div> : null}
                {c.submitted_contact ? <div className="text-[13px] text-slate2">Contact: {c.submitted_contact}</div> : null}
                <div className="mt-3 flex gap-2">
                  <button disabled={busyId === c.id} onClick={() => decideClaim(c.id, true)} className="flex-1 py-2 rounded-full bg-ok text-white font-semibold text-[13px] disabled:opacity-60">Approve</button>
                  <button disabled={busyId === c.id} onClick={() => decideClaim(c.id, false)} className="flex-1 py-2 rounded-full border border-white/15 text-ink text-[13px] disabled:opacity-60">Reject</button>
                </div>
              </div>
            ))}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note applied to next decision" className={inputCls} />
          </div>
        )}
      </Panel>

      <Panel title={`Claimed profiles (${approved.length})`}>
        {!approved.length ? <div className="text-[13px] text-muted">No approved claims yet.</div> : (
          <div className="space-y-2.5">
            {approved.map((c) => {
              const lvl = c.providers?.trust_level;
              return (
                <div key={c.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <Link href={`/provider?id=${encodeURIComponent(c.provider_id)}`} className="font-display font-semibold text-ink">{c.providers?.alias || c.providers?.name}</Link>
                    <span className="text-[11px] text-slate2">{TRUST[lvl]?.label || lvl}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lvl === "claimed" ? (
                      <button disabled={busyId === c.provider_id} onClick={() => promote(c.provider_id, "verified_business")} className="py-2 px-3 rounded-full bg-amber text-navy font-semibold text-[13px] disabled:opacity-60">Promote to Verified Business</button>
                    ) : null}
                    {lvl === "verified_business" ? (
                      <button disabled={busyId === c.provider_id} onClick={() => promote(c.provider_id, "claimed")} className="py-2 px-3 rounded-full border border-white/15 text-ink text-[13px] disabled:opacity-60">Downgrade to Claimed</button>
                    ) : null}
                    <button disabled={busyId === c.provider_id} onClick={() => revoke(c.provider_id)} className="py-2 px-3 rounded-full border border-err/40 text-err text-[13px] disabled:opacity-60">Revoke claim</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
