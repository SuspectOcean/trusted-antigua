"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CAT } from "@/lib/categories";
import { api } from "@/lib/data";
import { pct, waLink, withTimeout } from "@/lib/helpers";
import { useAuth } from "@/components/AuthProvider";
import TrustBadge from "@/components/TrustBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { isClaimed } from "@/lib/trust";
import { CORE_DIMENSIONS, DIMENSION_THRESHOLD, RATING_CATEGORIES, timeframeLabel as tfLabel } from "@/lib/reviews";

const STAT_TAGS = [
  ["reliable_count", "Reliable"],
  ["punctual_count", "Punctual"],
  ["communication_count", "Good communication"],
  ["fair_price_count", "Fair price"],
];
const REC_TAGS = [
  ["reliable", "Reliable"],
  ["punctual", "Punctual"],
  ["communication", "Communication"],
  ["fair_price", "Fair price"],
];

function Spinner() {
  return <div className="flex justify-center py-16"><svg className="spin text-amber" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg></div>;
}

function ReplyForm({ reviewId, existing, onSaved }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(existing?.body || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  async function save() {
    const t = text.trim();
    if (!t) { setErr("Write a short reply first."); return; }
    setBusy(true); setErr(null);
    try { await api.replyToReview(reviewId, t); setOpen(false); onSaved(); }
    catch (e) {
      console.error("[reply] failed", e);
      setErr(String(e?.message || "").includes("moderation") ? "This reply was removed by moderation and can't be edited." : "Couldn't save your reply. Please try again.");
    }
    finally { setBusy(false); }
  }
  if (!open) {
    return <button onClick={() => { setText(existing?.body || ""); setOpen(true); }} className="text-[12px] text-amber font-semibold mt-2">{existing ? "Edit your reply" : "Reply publicly"}</button>;
  }
  return (
    <div className="mt-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={1000} placeholder="Your public response as the business…" className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2 text-[13px]" />
      <div className="flex gap-2 mt-1.5">
        <button disabled={busy} onClick={save} className="px-3 py-1.5 rounded-full bg-amber text-navy font-semibold text-[12px] disabled:opacity-60">{busy ? "Saving…" : "Post reply"}</button>
        <button disabled={busy} onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-full border border-white/15 text-ink text-[12px]">Cancel</button>
      </div>
      {err ? <p className="text-[12px] text-err mt-1">{err}</p> : null}
    </div>
  );
}

function RecCard({ r, providerLabel, reply, isOwner, isMine, reported, onReport, onReplySaved }) {
  const tags = REC_TAGS.filter(([k]) => r[k]).map(([, l]) => <span key={l} className="text-[11px] bg-teal/15 text-teal px-2 py-0.5 rounded-full">{l}</span>);
  const works = Array.isArray(r.work_types) ? r.work_types : [];
  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-display font-semibold text-ink">{r.recommender_display || "A resident"}</div>
        {r.rating_version === 2 && r.total_score != null ? (
          <span className="text-[12px] text-amber font-bold">{r.total_score}/100</span>
        ) : r.would_hire_again ? (
          <span className="text-[11px] text-ok font-semibold">👍 Would hire again</span>
        ) : null}
      </div>
      {r.rating_version !== 2 ? (
        <div className="text-[10px] text-muted mt-0.5">Reviewed under our previous rating system</div>
      ) : null}
      {r.rating_version !== 2 && r.score_finished != null ? <div className="text-[12px] text-amber font-semibold mt-1">Finished work {r.score_finished}/10</div> : null}
      {r.reason ? <p className="text-[14px] text-slate2 mt-1">{r.reason}</p> : null}
      {works.length ? <div className="text-[12px] text-muted mt-1">Work: {works.join(", ")}</div> : (r.job_type ? <div className="text-[12px] text-muted mt-1">Job: {r.job_type}</div> : null)}
      {r.timeframe ? <div className="text-[11px] text-muted mt-0.5">{tfLabel(r.timeframe)}</div> : null}
      {tags.length ? <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div> : null}
      {r.updated_at && r.created_at && new Date(r.updated_at) - new Date(r.created_at) > 60000 ? (
        <div className="text-[10px] text-muted mt-2">updated {new Date(r.updated_at).toLocaleDateString()}</div>
      ) : null}

      {/* Right of reply: the business's single public response */}
      {reply ? (
        <div className="mt-3 ml-3 pl-3 border-l-2 border-amber/40">
          <div className="text-[11px] font-semibold text-amber">Response from {providerLabel}</div>
          <p className="text-[13px] text-slate2 mt-0.5">{reply.body}</p>
        </div>
      ) : null}
      {isOwner ? <ReplyForm reviewId={r.id} existing={reply} onSaved={onReplySaved} /> : null}

      {/* Report / dispute — never shown on the user's own review */}
      {!isMine ? (
        <div className="mt-2 text-right">
          {reported ? (
            <span className="text-[11px] text-muted">Reported (under review)</span>
          ) : (
            <button onClick={() => onReport(r)} className="text-[11px] text-muted underline decoration-white/20">
              {isOwner ? "Dispute this review" : "Report"}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

const REPORT_REASONS = [
  ["not_genuine", "Not a genuine customer experience"],
  ["abusive", "Abusive or a personal attack"],
  ["personal_info", "Shares private personal information"],
  ["conflict_of_interest", "Conflict of interest (self/competitor review)"],
  ["other", "Something else"],
];

function ReportModal({ review, isOwner, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  async function send() {
    if (!reason) { setMsg({ ok: false, text: "Please choose a reason." }); return; }
    setBusy(true); setMsg(null);
    try {
      await api.reportReview(review.id, reason, details.trim() || null);
      setMsg({ ok: true, text: "✅ Sent to our moderation team. The review stays visible while we assess it." });
      setTimeout(() => { onDone(review.id); onClose(); }, 1600);
    } catch (e) {
      console.error("[report] failed", e);
      setMsg({ ok: false, text: "Could not send. Please try again." });
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-4 shadow-pop">
        <h3 className="font-display font-semibold text-ink">{isOwner ? "Dispute this review" : "Report this review"}</h3>
        <p className="text-[12px] text-muted mt-1">
          {isOwner
            ? "Our team will check it against the Review Guidelines. Reviews stay visible while under review. Disputes are a request for moderation, not a delete button."
            : "Tell us what's wrong and our team will take a look."}
        </p>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mt-3 rounded-xl border border-white/15 bg-surface2 text-ink px-3 py-2.5 text-[14px]">
          <option value="">Choose a reason…</option>
          {REPORT_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={2000} className="w-full mt-2 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[14px]" placeholder="Anything that helps us assess it (optional)" />
        <div className="flex gap-2 mt-3">
          <button disabled={busy} onClick={onClose} className="flex-1 py-2.5 rounded-full border border-white/15 text-ink text-[14px]">Cancel</button>
          <button disabled={busy} onClick={send} className="flex-1 py-2.5 rounded-full bg-amber text-navy font-semibold text-[14px] disabled:opacity-60">{busy ? "Sending…" : "Send"}</button>
        </div>
        {msg ? <p className={`text-center text-[13px] mt-2 ${msg.ok ? "text-ok" : "text-err"}`}>{msg.text}</p> : null}
      </div>
    </div>
  );
}

function Avatar({ src, name }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0" />;
  }
  return <div className="w-16 h-16 rounded-2xl bg-surface2 border border-white/10 flex items-center justify-center text-slate2 text-2xl font-bold shrink-0">{initial}</div>;
}

function WarningModal({ provider, onClose }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState(null);
  async function send() {
    const t = text.trim();
    if (!t) { setMsg({ ok: false, text: "Please write a short note." }); return; }
    try { await api.addWarning({ provider_id: provider.id, provider_name: provider.name, warning: t }); setMsg({ ok: true, text: "✅ Thank you. Sent privately to our team." }); setTimeout(onClose, 1400); }
    catch { setMsg({ ok: false, text: "Could not send. Please try again." }); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-4 shadow-pop">
        <h3 className="font-display font-semibold text-ink">Share a private concern</h3>
        <p className="text-[12px] text-muted mt-1">This goes only to our team for review. We never post public complaints about anyone.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full mt-3 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px]" placeholder="What happened?" />
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-white/15 text-ink text-[14px]">Cancel</button>
          <button onClick={send} className="flex-1 py-2.5 rounded-full bg-amber text-navy font-semibold text-[14px]">Send privately</button>
        </div>
        {msg ? <p className={`text-center text-[13px] mt-2 ${msg.ok ? "text-ok" : "text-err"}`}>{msg.text}</p> : null}
      </div>
    </div>
  );
}

function ProviderInner() {
  const id = useSearchParams().get("id");
  const { user, openSignIn } = useAuth();
  const [p, setP] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [ratings, setRatings] = useState(null); // ten-category aggregates (v2 reviews only)
  const [contact, setContact] = useState(null);
  const [recs, setRecs] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [myClaim, setMyClaim] = useState(null);
  const [showWarn, setShowWarn] = useState(false);
  const [err, setErr] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [replies, setReplies] = useState({});
  const [reportedIds, setReportedIds] = useState(new Set());
  const [reporting, setReporting] = useState(null); // review being reported, or null

  useEffect(() => {
    if (!id) { setP(null); return; }
    let active = true;
    setP(undefined); setErr(false);
    Promise.all([withTimeout(api.provider(id)), withTimeout(api.providerStats(id)), withTimeout(api.providerRatings(id))])
      .then(([prov, st, rt]) => {
        if (!active) return;
        setP(prov || null);
        setStats(st);
        setRatings(rt);
      })
      .catch((e) => { console.error("[provider] load failed", e); if (active) { setP(undefined); setErr(true); } });
    return () => { active = false; };
  }, [id, reloadKey]);

  useEffect(() => {
    if (!id || !user) { setContact(null); setRecs([]); setIsOwner(false); setMyClaim(null); setReplies({}); setReportedIds(new Set()); return; }
    api.providerContact(id).then(setContact);
    api.recommendations(id).then(setRecs);
    api.providerOwner(id).then((owner) => setIsOwner(!!owner && owner === user.id));
    api.myClaimForProvider(id, user.id).then(setMyClaim);
    api.repliesForProvider(id).then(setReplies);
    api.myOpenReports(user.id).then(setReportedIds);
  }, [id, user]);

  if (err) return (
    <div className="py-16 text-center">
      <div className="text-3xl mb-2">📶</div>
      <p className="text-[14px] text-slate2">Couldn&apos;t load this provider.</p>
      <button onClick={() => setReloadKey((k) => k + 1)} className="mt-3 bg-amber text-navy font-semibold text-sm px-4 py-2 rounded-full">Retry</button>
    </div>
  );
  if (p === undefined) return <Spinner />;
  if (p === null) return <div className="py-16 text-center text-slate2">Provider not found. <Link className="text-amber underline" href="/find">Back to directory</Link></div>;

  const count = stats?.rec_count || 0;
  const wha = pct(stats?.yes_count || 0, count);
  const cat = CAT[p.category_id];
  const summaryTags = STAT_TAGS.map(([k, label]) => {
    const n = stats?.[k] || 0;
    return n ? <span key={k} className="text-[12px] bg-teal/15 text-teal px-2.5 py-1 rounded-full">{label} · {n}</span> : null;
  }).filter(Boolean);
  const wa = waLink(contact);
  const claimed = isClaimed(p.trust_level);
  const pendingClaim = myClaim && myClaim.status === "pending";
  const households = stats?.households || 0;
  const scored = stats?.scored_count || 0;
  const showDimensions = scored >= DIMENSION_THRESHOLD;

  return (
    <>
      <Link href="/find" className="inline-flex items-center gap-1 text-[13px] text-slate2 mb-3">‹ Back</Link>
      <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        <div className="flex items-start gap-3">
          <Avatar src={p.photo_url} name={p.alias || p.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-semibold text-ink leading-tight">{p.alias || p.name}</h1>
              <TrustBadge level={p.trust_level} size="md" tappable />
            </div>
            {p.alias ? <div className="text-[13px] text-muted">{p.name}</div> : null}
            <div className="mt-1 flex items-center gap-1.5 text-[14px] text-slate2">
              {cat ? <CategoryIcon id={cat.id} className="w-4 h-4 shrink-0 text-muted" /> : null}
              <span>{cat ? cat.name : ""}{p.area ? ` · ${p.area}` : ""}</span>
            </div>
            {Array.isArray(p.secondary_categories) && p.secondary_categories.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.secondary_categories.map((sid) => CAT[sid] ? (
                  <span key={sid} className="text-[11px] bg-surface2 text-muted px-2 py-0.5 rounded-full border border-white/10">{CAT[sid].name}</span>
                ) : null)}
              </div>
            ) : null}
          </div>
        </div>

        {p.description ? <p className="mt-3 text-[14px] text-slate2 leading-relaxed">{p.description}</p> : null}

        {/* Trust Rating: ten-category (v2) reviews ONLY. Legacy reviews are
            shown separately below and never blended into the headline number. */}
        {ratings?.r10_count ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="bg-surface2 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-amber">{ratings.trust_pct}%</div>
                <div className="text-[10px] uppercase tracking-wide text-muted">trust rating</div>
              </div>
              <div className="bg-surface2 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-ink">{Number(ratings.avg_out_of_10).toFixed(1)}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted">avg / 10</div>
              </div>
              <div className="bg-surface2 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-ok">{ratings.r10_count}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted">rating{ratings.r10_count === 1 ? "" : "s"}</div>
              </div>
            </div>
            {ratings.r10_count < 3 ? (
              <div className="mt-2 text-[11px] text-muted text-center">Early rating, based on {ratings.r10_count} review{ratings.r10_count === 1 ? "" : "s"} so far.</div>
            ) : null}
            <div className="mt-3 grid grid-cols-1 gap-y-1.5">
              {RATING_CATEGORIES.map((c) => {
                const v = ratings[`avg_${c.key}`];
                return v != null ? (
                  <div key={c.key} className="flex items-center gap-2 text-[13px]">
                    <span className="text-slate2 flex-1">{c.label}</span>
                    <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-amber" style={{ width: `${Number(v) * 10}%` }} /></div>
                    <span className="text-ink font-semibold w-9 text-right">{Number(v).toFixed(1)}</span>
                  </div>
                ) : null;
              })}
            </div>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-surface2 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-amber">{count}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted">review{count === 1 ? "" : "s"}</div>
            </div>
            <div className="bg-surface2 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-ok">{count ? wha + "%" : "N/A"}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted">would hire again</div>
            </div>
          </div>
        )}

        {/* Legacy reviews, stated separately for transparency (never blended). */}
        {ratings?.r10_count && count > ratings.r10_count ? (
          <div className="mt-2 text-[11px] text-muted text-center">
            Plus {count - ratings.r10_count} review{count - ratings.r10_count === 1 ? "" : "s"} under our previous system ({wha}% would hire again).
          </div>
        ) : null}
        {!ratings?.r10_count && count ? (
          <div className="mt-2 text-[11px] text-muted text-center">Reviews so far use our previous rating system. New reviews use the 10-category Trust Rating.</div>
        ) : null}
        {households ? <div className="mt-2 text-[12px] text-muted text-center">{households} household{households === 1 ? "" : "s"} served</div> : null}

        {/* Legacy per-dimension averages: only when there is no v2 data yet. */}
        {!ratings?.r10_count && count && showDimensions ? (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {CORE_DIMENSIONS.map((d) => {
              const v = stats?.[`avg_${d.key}`];
              return v != null ? (
                <div key={d.key} className="flex items-center justify-between text-[13px]">
                  <span className="text-slate2">{d.label}</span>
                  <span className="text-ink font-semibold">{Number(v).toFixed(1)}/10</span>
                </div>
              ) : null;
            })}
          </div>
        ) : null}

        {summaryTags.length ? <div className="mt-3 flex flex-wrap gap-1.5">{summaryTags}</div> : null}

        {/* Contact — real buttons when signed in; gated otherwise */}
        {user && wa ? (
          <div className="mt-4 flex gap-2">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-[#25D366] text-white font-semibold text-sm py-2.5 rounded-full">WhatsApp</a>
            {contact ? <a href={`tel:${contact}`} className="flex-1 text-center bg-navy border border-white/15 text-ink font-semibold text-sm py-2.5 rounded-full">Call</a> : null}
          </div>
        ) : user && !wa ? (
          <div className="mt-4 text-center text-[13px] text-muted py-2.5">No contact on file for this provider.</div>
        ) : (
          <button onClick={() => openSignIn("Create a free profile to contact trusted tradespeople and leave recommendations.")} className="w-full mt-4 flex items-center justify-center gap-2 bg-amber text-navy font-semibold text-sm py-3 rounded-full">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            Sign in to view contact details
          </button>
        )}

        {user ? (
          <Link href={`/recommend?pid=${encodeURIComponent(p.id)}&pname=${encodeURIComponent(p.name)}&cat=${p.category_id}`} className="block text-center mt-2 text-[13px] text-amber font-semibold">★ Write / update your review</Link>
        ) : (
          <button onClick={() => openSignIn("Sign in to review this tradesperson.")} className="block w-full text-center mt-2 text-[13px] text-amber font-semibold">★ Write a review</button>
        )}
      </div>

      {/* Claim / manage strip */}
      {isOwner ? (
        <Link href={`/manage?id=${encodeURIComponent(p.id)}`} className="mt-3 block bg-surface2 border border-amber/30 rounded-2xl p-3 text-center text-[13px] text-amber font-semibold">
          You manage this profile · Edit ›
        </Link>
      ) : pendingClaim ? (
        <div className="mt-3 bg-surface border border-white/10 rounded-2xl p-3 text-center text-[13px] text-slate2">
          ⏳ Your claim for this profile is awaiting review.
        </div>
      ) : !claimed ? (
        <div className="mt-3 bg-surface border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2">
          <span className="text-[13px] text-slate2">Is this your business?</span>
          {user ? (
            <Link href={`/claim?id=${encodeURIComponent(p.id)}`} className="text-[13px] bg-amber text-navy font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">Claim this profile</Link>
          ) : (
            <button onClick={() => openSignIn("Sign in to claim your business profile.")} className="text-[13px] bg-amber text-navy font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">Claim this profile</button>
          )}
        </div>
      ) : null}

      <h2 className="font-display font-semibold text-[17px] text-ink mt-5 mb-2">Reviews</h2>
      {!user ? (
        <div className="bg-surface border border-white/10 rounded-2xl p-5 text-center shadow-card">
          <p className="text-[14px] text-slate2">{count ? `${count} review${count === 1 ? "" : "s"}. Sign in to read what people said.` : "No reviews yet."}</p>
          {count ? <button onClick={() => openSignIn("Sign in to read recommendations.")} className="mt-3 bg-amber text-navy font-semibold text-sm px-4 py-2 rounded-full">Sign in to read</button> : null}
        </div>
      ) : (
        <div className="space-y-2.5">
          {recs.length ? recs.map((r) => (
            <RecCard
              key={r.id}
              r={r}
              providerLabel={p.alias || p.name}
              reply={replies[r.id]}
              isOwner={isOwner}
              isMine={r.recommender_id === user.id}
              reported={reportedIds.has(r.id)}
              onReport={setReporting}
              onReplySaved={() => api.repliesForProvider(id).then(setReplies)}
            />
          )) : <div className="bg-surface border border-white/10 rounded-2xl p-5 text-center text-[13px] text-slate2 shadow-card">No recommendations yet. If you&apos;ve hired them, be the first to vouch.</div>}
        </div>
      )}

      <button onClick={() => setShowWarn(true)} className="w-full mt-4 text-[12px] text-muted py-2">Something wrong? Share a private concern ›</button>
      <div className="h-4" />
      {showWarn ? <WarningModal provider={p} onClose={() => setShowWarn(false)} /> : null}
      {reporting ? (
        <ReportModal
          review={reporting}
          isOwner={isOwner}
          onClose={() => setReporting(null)}
          onDone={(rid) => setReportedIds((s) => new Set([...s, rid]))}
        />
      ) : null}
    </>
  );
}

export default function ProviderPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProviderInner />
    </Suspense>
  );
}
