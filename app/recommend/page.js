"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GROUPED } from "@/lib/categories";
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setScore = (k, v) => setForm((f) => ({ ...f, scores: { ...f.scores, [k]: v } }));
  const toggleWork = (w) => setForm((f) => ({ ...f, work_types: f.work_types.includes(w) ? f.work_types.filter((x) => x !== w) : [...f.work_types, w] }));
  const inputCls = "w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30";

  // Prefill when editing an existing review for this provider.
  useEffect(() => {
    if (!user || !presetPid) return;
    api.myReviewForProvider(presetPid, user.id).then((r) => {
      if (!r) return;
      setEditing(true);
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
    if (!presetPid && (!form.category_id || !name)) {
      setMsg({ ok: false, node: "Please choose a category and add their name." });
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

  return (
    <>
      <h1 className="text-xl font-display font-semibold text-ink mt-1">{title}</h1>
      <p className="text-[13px] text-muted mt-1 mb-4">Score ten areas out of 10, then tell people what happened. You can update this later.</p>
      <form onSubmit={submit} className="space-y-4">
        {!presetPid ? (
          <>
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">What do they do? <span className="text-err">*</span></label>
              <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} required className={inputCls}>
                <option value="">Choose a category…</option>
                {GROUPED.map((g) => (
                  <optgroup key={g.id} label={g.name}>
                    {g.categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Their name or business name <span className="text-err">*</span></label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Ricky the AC Man" className={inputCls} />
            </div>
          </>
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
