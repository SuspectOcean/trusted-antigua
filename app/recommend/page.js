"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CAT } from "@/lib/categories";
import { RATING_CATEGORIES, TIMEFRAMES, workTypesFor } from "@/lib/reviews";
import { api } from "@/lib/data";
import { withTimeout } from "@/lib/helpers";
import { useAuth } from "@/components/AuthProvider";

// Ten-category review (rating_version 2). Flow: score ten areas -> write the
// review -> submit. Totals are computed and enforced by the database; the
// numbers shown here are a courtesy preview only.
const EMPTY = Object.fromEntries(RATING_CATEGORIES.map((c) => [c.key, null]));

function ScoreRow({ label, hint, value, onChange }) {
  return (
    <div className="py-2.5 border-b border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-ink">{label}</span>
        {value == null
          ? <button type="button" onClick={() => onChange(8)} className="text-[13px] text-amber font-semibold px-2">Rate ›</button>
          : <span className="text-[14px] font-bold text-amber w-12 text-right">{value}/10</span>}
      </div>
      {hint ? <div className="text-[11px] text-muted mt-0.5">{hint}</div> : null}
      {value != null ? (
        <input type="range" min="1" max="10" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber mt-1" />
      ) : null}
    </div>
  );
}

function RecommendInner() {
  const params = useSearchParams();
  const { user, profile, openSignIn } = useAuth();
  const presetPid = params.get("pid") || "";
  const presetName = params.get("pname") || "";
  const presetCat = params.get("cat") || "";

  const [form, setForm] = useState({
    category_id: presetCat, name: presetName,
    contact: "", area: "", reason: "", timeframe: "", private_note: "",
    scores: { ...EMPTY }, work_types: [],
  });
  const [editing, setEditing] = useState(false);
  const [wasLegacy, setWasLegacy] = useState(false); // editing a previous-system review
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  // "Who are you reviewing?" step — only used when no provider was passed in.
  const [pickQuery, setPickQuery] = useState("");
  const [pickResults, setPickResults] = useState([]);
  const [picking, setPicking] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setScore = (k, v) => setForm((f) => ({ ...f, scores: { ...f.scores, [k]: v } }));
  const toggleWork = (w) => setForm((f) => ({ ...f, work_types: f.work_types.includes(w) ? f.work_types.filter((x) => x !== w) : [...f.work_types, w] }));
  const inputCls = "w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30";

  // Search the existing directory so a review always attaches to a real listing.
  // Reviewing and adding are deliberately separate: adding someone new lives in
  // /add (which has the contact importer and the phone de-duplication check).
  // Letting this form create a provider by typed name is what produced duplicate
  // listings — "Mario Antonio" vs "Mario Antonio AC" — splitting a tradesperson's
  // reviews and rating across two profiles.
  useEffect(() => {
    if (presetPid) return;
    const q = pickQuery.trim();
    if (q.length < 2) { setPickResults([]); return; }
    let active = true;
    setPicking(true);
    const t = setTimeout(async () => {
      const rows = await withTimeout(api.providers({ q }), 8000, []);
      if (!active) return;
      setPickResults((rows || []).slice(0, 8));
      setPicking(false);
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [pickQuery, presetPid]);

  // Prefill when editing an existing review for this provider.
  useEffect(() => {
    if (!user || !presetPid) return;
    api.myReviewForProvider(presetPid, user.id).then((r) => {
      if (!r) return;
      setEditing(true);
      setWasLegacy(r.rating_version !== 2);
      const scores = { ...EMPTY };
      if (r.rating_version === 2) {
        RATING_CATEGORIES.forEach((c) => { scores[c.key] = r[`r10_${c.key}`] ?? null; });
      }
      setForm((f) => ({
        ...f,
        reason: r.reason || "", timeframe: r.timeframe || "",
        work_types: r.work_types || [],
        scores,
      }));
    });
  }, [user, presetPid]);

  if (!user) {
    return (
      <div className="pt-6">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <div className="text-3xl mb-2">🤝</div>
          <h1 className="text-lg font-display font-semibold text-ink">Review a provider</h1>
          <p className="text-[14px] text-slate2 mt-1">Sign in to leave a review. It keeps reviews honest and accountable.</p>
          <button onClick={() => openSignIn("Sign in to review a provider.")} className="mt-4 bg-amber text-navy font-semibold px-5 py-2.5 rounded-full text-[15px]">Continue</button>
        </div>
      </div>
    );
  }

  const scored = RATING_CATEGORIES.filter((c) => form.scores[c.key] != null).length;
  const total = scored === 10 ? RATING_CATEGORIES.reduce((s, c) => s + form.scores[c.key], 0) : null;

  async function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    // A provider is always chosen before this form renders, so a review can no
    // longer create a listing by typed name (which caused duplicate profiles).
    if (!presetPid) {
      setMsg({ ok: false, node: "Please choose who you're reviewing first." });
      return;
    }
    if (scored < 10) {
      setMsg({ ok: false, node: `Please score all ten areas (${scored} of 10 done).` });
      return;
    }
    setBusy(true); setMsg(null);
    try {
      const session = await api.ensureSession();
      if (!session) {
        setMsg({ ok: false, node: "Your session has expired. Please sign in again, then resubmit." });
        openSignIn("Please sign in again to post your review.");
        setBusy(false); return;
      }
      const review = {
        recommender_display: profile ? `${profile.first_name}, ${profile.area}` : "A resident", // overwritten server-side
        would_hire_again: form.scores.recommendation >= 6, // legacy stat compatibility, derived from Overall recommendation
        reason: form.reason,
        timeframe: form.timeframe || null,
        work_types: form.work_types.length ? form.work_types : null,
      };
      const providerId = await withTimeout(
        api.submitReviewV2({
          provider_id: presetPid || null, name, category_id: form.category_id,
          area: form.area, contact: form.contact, review, scores: form.scores,
        }),
        15000
      );
      if (form.private_note.trim()) {
        try { await api.addWarning({ provider_id: providerId, provider_name: name, warning: form.private_note.trim() }); }
        catch (w) { console.warn("[review] private note failed (non-fatal)", w); }
      }
      setMsg({ ok: true, node: (<>✅ Thank you! Your review has been saved ({total}/100). <Link className="text-amber underline" href={`/provider?id=${encodeURIComponent(providerId)}`}>View profile</Link></>) });
      setEditing(true);
    } catch (err) {
      console.error("[review] submit failed", err);
      const text = `${err?.code || ""} ${err?.message || ""}`.toLowerCase();
      let node = "Sorry, something went wrong saving that. Please try again.";
      if (text.includes("not_signed_in") || text.includes("28000") || text.includes("jwt")) {
        node = "Your session has expired. Please sign in again, then resubmit.";
        openSignIn("Please sign in again to post your review.");
      } else if (text.includes("missing_score") || text.includes("bad_score")) {
        node = "Please make sure every area is scored between 1 and 10.";
      } else if (text.includes("timed out") || text.includes("timeout")) {
        node = "That took too long. Check your connection and try again.";
      } else if (err?.message) {
        node = `Couldn't save: ${err.message}`;
      }
      setMsg({ ok: false, node });
    } finally { setBusy(false); }
  }

  const worktypes = workTypesFor(form.category_id || presetCat);
  const title = editing ? "Update your review" : presetName ? `Review ${presetName}` : "Review a provider";

  // ---------------------------------------------------------------
  // Step 0 — "Who are you reviewing?"
  // Reviewing is separated from adding. You pick someone already listed; if they
  // aren't listed you add them first in /add, which then hands you straight back
  // into this form with the new provider attached.
  // ---------------------------------------------------------------
  if (!presetPid) {
    return (
      <div className="pt-1 pb-8">
        <h1 className="text-xl font-display font-semibold text-ink mt-1">Who are you reviewing?</h1>
        <p className="text-[13px] text-muted mt-1 mb-4">
          Search for the tradesperson or business you used.
        </p>

        <div className="relative">
          <input
            value={pickQuery}
            onChange={(e) => setPickQuery(e.target.value)}
            type="search"
            autoFocus
            placeholder="Search by name, trade or area"
            className="w-full rounded-full border border-white/15 bg-surface2 text-ink placeholder-muted pl-11 pr-4 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
        </div>

        <div className="mt-3 space-y-2">
          {picking ? <p className="text-[13px] text-muted px-1">Searching…</p> : null}

          {!picking && pickQuery.trim().length >= 2 && !pickResults.length ? (
            <p className="text-[13px] text-slate2 px-1">
              No one matching “{pickQuery.trim()}” is listed yet.
            </p>
          ) : null}

          {pickResults.map((p) => {
            const cat = CAT[p.category_id];
            return (
              <Link
                key={p.id}
                href={`/recommend?pid=${encodeURIComponent(p.id)}&pname=${encodeURIComponent(p.alias || p.name)}&cat=${encodeURIComponent(p.category_id || "")}`}
                className="block bg-surface border border-white/10 rounded-2xl p-3.5 shadow-card active:scale-[.99] transition"
              >
                <div className="font-display font-semibold text-ink">{p.alias || p.name}</div>
                <div className="text-[12px] text-slate2 mt-0.5">
                  {cat ? cat.name : ""}{p.area ? ` · ${p.area}` : ""}
                </div>
              </Link>
            );
          })}
        </div>

        {/* The only route to creating a listing — keeps adding and reviewing apart,
            and routes new people through /add's phone de-duplication check. */}
        <Link
          href="/add"
          className="mt-5 block bg-surface border border-dashed border-amber/40 rounded-2xl p-4 text-center active:scale-[.99] transition"
        >
          <span className="text-[13px] text-slate2">Can&apos;t find them? </span>
          <span className="text-[13px] text-amber font-semibold">Add them first ›</span>
          <div className="text-[11px] text-muted mt-1">
            We&apos;ll check they&apos;re not already listed, then bring you back here to review them.
          </div>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-display font-semibold text-ink mt-1">{title}</h1>
      <p className="text-[13px] text-muted mt-1 mb-4">Score ten areas out of 10, then tell people what happened. You can update this later.</p>
      <form onSubmit={submit} className="space-y-4">
        {/* The review form itself only ever appears once a real provider is chosen —
            see the picker rendered above when presetPid is empty. */}

        {/* Deliberate, informed conversion of legacy reviews — never silent. */}
        {wasLegacy ? (
          <div className="bg-amber/10 border border-amber/30 rounded-xl p-3 text-[13px] text-slate2">
            <b className="text-amber">This review was created under our previous rating system.</b>{" "}
            To update it, complete the new ten-category Trust Rating below. Your written review is kept.
            Your old rating is not carried over, and nothing changes unless you save. If you leave this
            page without saving, your original review stays exactly as it is.
          </div>
        ) : null}

        {/* Step 1: the ten scores */}
        <div className="bg-surface border border-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] font-semibold text-ink">Score your experience <span className="text-err">*</span></label>
            <span className={`text-[12px] font-semibold ${scored === 10 ? "text-ok" : "text-muted"}`}>
              {scored === 10 ? `Total ${total}/100` : `${scored} of 10 scored`}
            </span>
          </div>
          {RATING_CATEGORIES.map((c) => (
            <ScoreRow key={c.key} label={c.label} hint={c.hint} value={form.scores[c.key]} onChange={(v) => setScore(c.key, v)} />
          ))}
        </div>

        {/* Step 2: the written review */}
        <div className="bg-surface border border-white/10 rounded-xl p-3 space-y-3">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1">Tell people what happened</label>
            <textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} rows={3} placeholder="What was the job, and how did it go?" className={inputCls} />
          </div>
          <div>
            <label className="block text-[13px] text-slate2 mb-1.5">What type of work was it?</label>
            <div className="flex flex-wrap gap-2">
              {worktypes.map((w) => (
                <button type="button" key={w} onClick={() => toggleWork(w)} className={`text-[13px] px-3 py-1.5 rounded-full border ${form.work_types.includes(w) ? "bg-teal/15 text-teal border-teal/40" : "bg-surface2 text-slate2 border-white/15"}`}>{w}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-slate2 mb-1">When was the work done?</label>
            <select value={form.timeframe} onChange={(e) => set("timeframe", e.target.value)} className={inputCls}>
              <option value="">Choose…</option>
              {TIMEFRAMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {!presetPid ? (
            <>
              <div><label className="block text-[13px] text-slate2 mb-1">Their phone / WhatsApp</label><input value={form.contact} onChange={(e) => set("contact", e.target.value)} inputMode="tel" placeholder="+1 268 …" className={inputCls} /></div>
              <div><label className="block text-[13px] text-slate2 mb-1">Area they serve</label><input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Jolly Harbour" className={inputCls} /></div>
            </>
          ) : null}

          <div className="border-t border-white/10 pt-3">
            <label className="block text-[13px] text-slate2 mb-1">Private note or warning</label>
            <p className="text-[11px] text-muted mb-1">Only our team sees this. It is never shown publicly.</p>
            <textarea value={form.private_note} onChange={(e) => set("private_note", e.target.value)} rows={2} placeholder="Anything we should quietly know?" className={inputCls} />
          </div>
        </div>

        <button type="submit" disabled={busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">
          {busy ? "Saving…" : editing ? "Update review" : scored === 10 ? `Post review · ${total}/100` : "Post review"}
        </button>
        {msg ? <p className={`text-center text-[13px] ${msg.ok ? "text-ok" : "text-err"}`}>{msg.node}</p> : null}
      </form>
      <div className="h-4" />
    </>
  );
}

export default function RecommendPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <RecommendInner />
    </Suspense>
  );
}
