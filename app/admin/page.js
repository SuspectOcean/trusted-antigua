"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CAT } from "@/lib/categories";
import { api } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";
import { TRUST } from "@/lib/trust";

function Section({ title, children }) {
  return (
    <div className="mt-5">
      <h2 className="font-display font-semibold text-[17px] text-ink mb-2">{title}</h2>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [claims, setClaims] = useState([]);
  const [cats, setCats] = useState([]);
  const [approved, setApproved] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState(null);

  const reload = useCallback(async () => {
    const [c, k, a, rv] = await Promise.all([
      api.adminClaims("pending"),
      api.adminCategoryRequests("pending"),
      api.adminClaims("approved"),
      api.adminReviews(),
    ]);
    setClaims(c); setCats(k); setApproved(a); setReviews(rv);
  }, []);

  useEffect(() => { if (isAdmin) reload(); }, [isAdmin, reload]);

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>;
  if (!user || !isAdmin) {
    return (
      <div className="py-16 text-center text-slate2">
        This area is for administrators only.
        <div className="mt-2"><Link href="/" className="text-amber underline">Go home</Link></div>
      </div>
    );
  }

  async function decideClaim(claimId, approve) {
    setBusyId(claimId);
    try { await api.adminDecideClaim(claimId, approve, note || null); setNote(""); setFlash(approve ? "Claim approved." : "Claim rejected."); await reload(); }
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
  async function decideCat(reqId, approve) {
    setBusyId(reqId);
    try { await api.adminDecideCategory(reqId, approve, null); setFlash(approve ? "Category updated." : "Request rejected."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }
  async function removeReview(id) {
    setBusyId(id);
    try { await api.adminRemoveReview(id, null); setFlash("Review removed."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }
  async function restoreReview(id) {
    setBusyId(id);
    try { await api.adminRestoreReview(id); setFlash("Review restored."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }

  return (
    <div className="pt-2">
      <h1 className="text-xl font-display font-semibold text-ink">Admin</h1>
      <p className="text-[13px] text-muted mt-0.5">Review claims and category changes. Reputation data is never editable here.</p>
      {flash ? <div className="mt-3 bg-surface2 border border-white/10 rounded-xl p-2.5 text-[13px] text-slate2">{flash}</div> : null}

      <Section title={`Pending claims (${claims.length})`}>
        {claims.length === 0 ? <div className="text-[13px] text-muted">Nothing waiting.</div> : (
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
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note applied to next decision" className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2 text-[13px]" />
          </div>
        )}
      </Section>

      <Section title={`Claimed profiles (${approved.length})`}>
        {approved.length === 0 ? <div className="text-[13px] text-muted">No approved claims yet.</div> : (
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
      </Section>

      <Section title={`Category change requests (${cats.length})`}>
        {cats.length === 0 ? <div className="text-[13px] text-muted">Nothing waiting.</div> : (
          <div className="space-y-2.5">
            {cats.map((k) => (
              <div key={k.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                <Link href={`/provider?id=${encodeURIComponent(k.provider_id)}`} className="font-display font-semibold text-ink">{k.providers?.alias || k.providers?.name}</Link>
                <div className="text-[13px] text-slate2 mt-1">{CAT[k.current_category]?.name || k.current_category} → <b>{CAT[k.requested_category]?.name || k.requested_category}</b></div>
                <div className="mt-3 flex gap-2">
                  <button disabled={busyId === k.id} onClick={() => decideCat(k.id, true)} className="flex-1 py-2 rounded-full bg-ok text-white font-semibold text-[13px] disabled:opacity-60">Approve</button>
                  <button disabled={busyId === k.id} onClick={() => decideCat(k.id, false)} className="flex-1 py-2 rounded-full border border-white/15 text-ink text-[13px] disabled:opacity-60">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Reviews (${reviews.length})`}>
        {reviews.length === 0 ? <div className="text-[13px] text-muted">No reviews yet.</div> : (
          <div className="space-y-2.5">
            {reviews.map((r) => {
              const removed = !!r.deleted_at;
              return (
                <div key={r.id} className={`bg-surface rounded-2xl p-4 shadow-card border ${removed ? "border-err/30 opacity-70" : "border-white/10"}`}>
                  <div className="flex items-center justify-between">
                    <Link href={`/provider?id=${encodeURIComponent(r.provider_id)}`} className="font-display font-semibold text-ink">{r.providers?.alias || r.providers?.name || "Provider"}</Link>
                    <span className="text-[11px] text-muted">{r.recommender_display || "A resident"}</span>
                  </div>
                  {r.reason ? <p className="text-[13px] text-slate2 mt-1">{r.reason}</p> : null}
                  {removed ? <div className="text-[11px] text-err mt-1">Removed ({r.deleted_reason || "admin"})</div> : null}
                  <div className="mt-3">
                    {removed ? (
                      <button disabled={busyId === r.id} onClick={() => restoreReview(r.id)} className="py-2 px-3 rounded-full border border-white/15 text-ink text-[13px] disabled:opacity-60">Restore</button>
                    ) : (
                      <button disabled={busyId === r.id} onClick={() => removeReview(r.id)} className="py-2 px-3 rounded-full border border-err/40 text-err text-[13px] disabled:opacity-60">Remove</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
      <div className="h-6" />
    </div>
  );
}
