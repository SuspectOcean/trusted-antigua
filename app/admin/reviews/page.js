"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { Panel, Flash, inputCls } from "@/components/AdminShell";
import { api } from "@/lib/data";

const REASON_LABEL = {
  not_genuine: "Not a genuine experience",
  abusive: "Abusive / personal attack",
  personal_info: "Private personal information",
  conflict_of_interest: "Conflict of interest",
  other: "Other",
};

// Moderation only. Scores are never editable; a review is either kept or removed with a reason.
export default function AdminReviewsPage() {
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState(null);

  const reload = useCallback(async () => {
    const [rp, rv] = await Promise.all([api.adminReports(), api.adminReviews()]);
    setReports(rp); setReviews(rv);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  async function resolveReport(id, remove) {
    setBusyId(id);
    try { await api.adminResolveReport(id, remove, note || null); setNote(""); setFlash(remove ? "Review removed; report resolved." : "Review kept; report resolved."); await reload(); }
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
  async function removeReply(id) {
    setBusyId(id);
    try { await api.adminRemoveReply(id, note || null); setNote(""); setFlash("Reply removed."); await reload(); }
    catch (e) { console.error(e); setFlash("Action failed."); }
    finally { setBusyId(null); }
  }

  return (
    <AdminShell title="Reviews" subtitle="Reports, disputes and moderation. Scores are never edited, only kept or removed.">
      <Flash msg={flash} />

      <Panel title={`Reports and disputes (${reports.length})`}>
        {!reports.length ? <div className="text-[13px] text-muted">Nothing reported.</div> : (
          <div className="space-y-2.5">
            {reports.map((rp) => (
              <div key={rp.id} className={`bg-surface rounded-2xl p-4 shadow-card border ${rp.is_provider_dispute ? "border-amber/40" : "border-white/10"}`}>
                <div className="flex items-center justify-between">
                  <Link href={`/provider?id=${encodeURIComponent(rp.provider_id)}`} className="font-display font-semibold text-ink">{rp.providers?.alias || rp.providers?.name || "Provider"}</Link>
                  <span className={`text-[11px] font-semibold ${rp.is_provider_dispute ? "text-amber" : "text-muted"}`}>{rp.is_provider_dispute ? "Provider dispute" : "User report"}</span>
                </div>
                <div className="text-[12px] text-slate2 mt-1">Reason: <b>{REASON_LABEL[rp.reason] || rp.reason}</b></div>
                {rp.details ? <p className="text-[13px] text-slate2 mt-1">&ldquo;{rp.details}&rdquo;</p> : null}
                <div className="mt-2 bg-surface2 rounded-xl p-2.5">
                  <div className="text-[11px] text-muted">Reported review by {rp.recommendations?.recommender_display || "A resident"}{rp.recommendations?.deleted_at ? " (already removed)" : ""}</div>
                  {rp.recommendations?.reason ? <p className="text-[13px] text-slate2 mt-0.5">{rp.recommendations.reason}</p> : <p className="text-[12px] text-muted mt-0.5">No written text, scores and tags only.</p>}
                </div>
                <div className="mt-3 flex gap-2">
                  <button disabled={busyId === rp.id} onClick={() => resolveReport(rp.id, false)} className="flex-1 py-2 rounded-full bg-ok text-white font-semibold text-[13px] disabled:opacity-60">Keep review</button>
                  <button disabled={busyId === rp.id} onClick={() => resolveReport(rp.id, true)} className="flex-1 py-2 rounded-full border border-err/40 text-err font-semibold text-[13px] disabled:opacity-60">Remove review</button>
                </div>
              </div>
            ))}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note applied to next decision" className={inputCls} />
          </div>
        )}
      </Panel>

      <Panel title={`All reviews (${reviews.length})`}>
        {!reviews.length ? <div className="text-[13px] text-muted">No reviews yet.</div> : (
          <div className="space-y-2.5">
            {reviews.map((r) => {
              const removed = !!r.deleted_at;
              const reply = Array.isArray(r.review_replies) ? r.review_replies[0] : r.review_replies;
              return (
                <div key={r.id} className={`bg-surface rounded-2xl p-4 shadow-card border ${removed ? "border-err/30 opacity-70" : "border-white/10"}`}>
                  <div className="flex items-center justify-between">
                    <Link href={`/provider?id=${encodeURIComponent(r.provider_id)}`} className="font-display font-semibold text-ink">{r.providers?.alias || r.providers?.name || "Provider"}</Link>
                    <span className="text-[11px] text-muted">{r.recommender_display || "A resident"}</span>
                  </div>
                  {r.reason ? <p className="text-[13px] text-slate2 mt-1">{r.reason}</p> : null}
                  {removed ? <div className="text-[11px] text-err mt-1">Removed ({r.deleted_reason || "admin"})</div> : null}
                  {reply ? (
                    <div className="mt-2 ml-3 pl-3 border-l-2 border-amber/40">
                      <div className="text-[11px] text-amber font-semibold">Provider reply{reply.removed_at ? " (removed)" : ""}</div>
                      <p className="text-[12px] text-slate2 mt-0.5">{reply.body}</p>
                      {!reply.removed_at ? (
                        <button disabled={busyId === reply.id} onClick={() => removeReply(reply.id)} className="mt-1 text-[11px] text-err underline disabled:opacity-60">Remove reply</button>
                      ) : null}
                    </div>
                  ) : null}
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
      </Panel>
    </AdminShell>
  );
}
