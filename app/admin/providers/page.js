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
  const [all, setAll] = useState(null);       // every listing, hidden included
  const [filter, setFilter] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const reload = useCallback(async () => {
    const [c, a] = await Promise.all([api.adminClaims("pending"), api.adminClaims("approved")]);
    setClaims(c); setApproved(a);
    try { setAll(await api.adminProviders()); } catch (e) { console.error(e); setAll([]); }
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
  async function setStatus(providerId, status) {
    setBusyId(providerId);
    try {
      await api.adminSetProviderStatus(providerId, status);
      setConfirmId(null);
      setFlash(status === "hidden" ? "Listing hidden from the directory." : "Listing restored.");
      await reload();
    } catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }
  async function revoke(providerId) {
    setBusyId(providerId);
    try { await api.adminRevoke(providerId); setFlash("Claim revoked."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }

  return (
    <AdminShell title="Providers" subtitle="Claims, trust levels and listings. Ratings and reviews can never be edited from here.">
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
      <Panel title={`All listings (${all ? all.length : "…"})`}>
        <p className="text-[12px] text-muted mb-2">
          Hide a listing that is spam, a duplicate, has a wrong number, or belongs to someone who has asked not to be listed.
          Hiding removes it from the public directory straight away. Nothing is deleted and it can be restored.
        </p>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, trade, area or number" className={inputCls} />
        {all === null ? <div className="text-[13px] text-muted mt-2">Loading…</div> : (
          <div className="space-y-2 mt-2.5">
            {all
              .filter((p) => {
                const f = filter.trim().toLowerCase();
                if (!f) return true;
                return [p.name, p.alias, p.area, p.contact, CAT[p.category_id]?.name].filter(Boolean).join(" ").toLowerCase().includes(f);
              })
              .map((p) => {
                const hidden = p.status !== "listed";
                return (
                  <div key={p.id} className={`bg-surface border rounded-2xl p-3.5 shadow-card ${hidden ? "border-err/30 opacity-80" : "border-white/10"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        {hidden
                          ? <span className="font-display font-semibold text-ink">{p.alias || p.name}</span>
                          : <Link href={`/provider/${encodeURIComponent(p.id)}`} className="font-display font-semibold text-ink">{p.alias || p.name}</Link>}
                        <div className="text-[12px] text-muted truncate">
                          {CAT[p.category_id]?.name || p.category_id}{p.area ? ` · ${p.area}` : ""}{p.contact ? ` · ${p.contact}` : ""}{p.claimed ? " · claimed" : ""}
                        </div>
                      </div>
                      {hidden ? <span className="text-[10px] uppercase tracking-wide text-err font-semibold shrink-0">Hidden</span> : null}
                    </div>
                    <div className="mt-2.5">
                      {hidden ? (
                        <button disabled={busyId === p.id} onClick={() => setStatus(p.id, "listed")} className="py-1.5 px-3 rounded-full border border-white/15 text-ink text-[12px] disabled:opacity-60">Restore listing</button>
                      ) : confirmId === p.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] text-err">Hide this listing from everyone?</span>
                          <button disabled={busyId === p.id} onClick={() => setStatus(p.id, "hidden")} className="py-1.5 px-3 rounded-full bg-err text-white font-semibold text-[12px] disabled:opacity-60">Yes, hide</button>
                          <button onClick={() => setConfirmId(null)} className="text-[12px] text-muted">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(p.id)} className="py-1.5 px-3 rounded-full border border-err/40 text-err text-[12px]">Hide listing</button>
                      )}
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
