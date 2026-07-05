"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { CORE_DIMENSIONS, OPTIONAL_DIMENSIONS, ALL_DIMENSIONS, TIMEFRAMES, workTypesFor } from "@/lib/reviews";
import { api } from "@/lib/data";
import { withTimeout } from "@/lib/helpers";
import { useAuth } from "@/components/AuthProvider";

const EMPTY_SCORES = { finished: null, reliability: null, punctuality: null, communication: null, value: null, professionalism: null, cleanliness: null, problem_solving: null, speed: null };

function ScoreRow({ label, value, onChange }) {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-white/5">
        <span className="text-[14px] text-slate2">{label}</span>
        <button type="button" onClick={() => onChange(8)} className="text-[13px] text-amber font-semibold px-2">Rate ›</button>
      </div>
    );
  }
  return (
    <div className="py-2 border-b border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-ink">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-amber w-10 text-right">{value}/10</span>
          <button type="button" onClick={() => onChange(null)} className="text-muted text-[11px]">clear</button>
        </div>
      </div>
      <input type="range" min="0" max="10" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber mt-1" />
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
    category_id: presetCat, name: presetName, would: "",
    contact: "", area: "", reason: "", job_type: "", timeframe: "",
    reliable: false, punctual: false, communication: false, fair_price: false, private_note: "",
    scores: { ...EMPTY_SCORES }, work_types: [],
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
      setForm((f) => ({
        ...f,
        would: r.would_hire_again ? "yes" : "no",
        reason: r.reason || "", job_type: r.job_type || "", timeframe: r.timeframe || "",
        reliable: !!r.reliable, punctual: !!r.punctual, communication: !!r.communication, fair_price: !!r.fair_price,
        work_types: r.work_types || [],
        scores: {
          finished: r.score_finished, reliability: r.score_reliability, punctuality: r.score_punctuality,
          communication: r.score_communication, value: r.score_value, professionalism: r.score_professionalism,
          cleanliness: r.score_cleanliness, problem_solving: r.score_problem_solving, speed: r.score_speed,
        },
      }));
    });
  }, [user, presetPid]);

  if (!user) {
    return (
      <div className="pt-6">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <div className="text-3xl mb-2">🤝</div>
          <h1 className="text-lg font-display font-semibold text-ink">Review a tradesperson</h1>
          <p className="text-[14px] text-slate2 mt-1">Create a free profile to leave a review. It keeps reviews honest and accountable.</p>
          <button onClick={() => openSignIn("Sign in to review a tradesperson.")} className="mt-4 bg-amber text-navy font-semibold px-5 py-2.5 rounded-full text-[15px]">Sign in / Create profile</button>
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if ((!presetPid && (!form.category_id || !name)) || !form.would) {
      setMsg({ ok: false, node: "Please fill in the required fields." });
      return;
    }
    setBusy(true); setMsg(null);
    const log = (...a) => console.log("[review]", ...a);
    try {
      log("submit start", { presetPid, name, editing });
      const session = await api.ensureSession();
      log("session?", !!session);
      if (!session) {
        setMsg({ ok: false, node: "Your session has expired. Please sign in again, then resubmit." });
        openSignIn("Please sign in again to post your review.");
        setBusy(false); return;
      }
      const display = profile ? `${profile.first_name} — ${profile.area}` : "A resident";

      const review = {
        recommender_display: display,
        would_hire_again: form.would === "yes",
        reliable: form.reliable, punctual: form.punctual, communication: form.communication, fair_price: form.fair_price,
        reason: form.reason, job_type: form.job_type,
        timeframe: form.timeframe || null,
        work_types: form.work_types.length ? form.work_types : null,
      };
      ALL_DIMENSIONS.forEach((d) => {
        const v = form.scores[d.key];
        if (v !== null && v !== undefined) review[`score_${d.key}`] = v;
      });

      const providerId = await withTimeout(
        api.submitReview({ provider_id: presetPid || null, name, category_id: form.category_id, area: form.area, contact: form.contact, review }),
        15000
      );
      log("saved, providerId:", providerId);

      if (form.private_note.trim()) {
        try { await api.addWarning({ provider_id: providerId, provider_name: name, warning: form.private_note.trim() }); }
        catch (w) { console.warn("[review] private note failed (non-fatal)", w); }
      }

      setMsg({ ok: true, node: (<>✅ Thank you! Your review has been saved. <Link className="text-amber underline" href={`/provider?id=${encodeURIComponent(providerId)}`}>View profile</Link></>) });
      setEditing(true);
    } catch (err) {
      console.error("[review] submit failed", err);
      const text = `${err?.code || ""} ${err?.message || ""}`.toLowerCase();
      let node = "Sorry, something went wrong saving that. Please try again.";
      if (text.includes("not_signed_in") || text.includes("28000") || text.includes("jwt")) {
        node = "Your session has expired. Please sign in again, then resubmit.";
        openSignIn("Please sign in again to post your review.");
      } else if (text.includes("timed out") || text.includes("timeout")) {
        node = "That took too long — check your connection and try again.";
      } else if (err?.message) {
        node = `Couldn't save: ${err.message}`;
      }
      setMsg({ ok: false, node });
    } finally { setBusy(false); }
  }

  const tag = (k, label) => (
    <label className="cursor-pointer">
      <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} className="peer sr-only" />
      <span className="block text-[13px] px-3 py-1.5 rounded-full border border-white/15 bg-surface2 text-slate2 peer-checked:bg-teal/15 peer-checked:text-teal peer-checked:border-teal/40">{label}</span>
    </label>
  );

  const worktypes = workTypesFor(form.category_id || presetCat);
  const title = editing ? "Update your review" : presetName ? `Review ${presetName}` : "Review a tradesperson";

  return (
    <>
      <h1 className="text-xl font-display font-semibold text-ink mt-1">{title}</h1>
      <p className="text-[13px] text-muted mt-1 mb-4">Quick to start — score the details if you have time. You can update this later.</p>
      <form onSubmit={submit} className="space-y-4">
        {!presetPid ? (
          <>
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">What do they do? <span className="text-err">*</span></label>
              <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} required className={inputCls}>
                <option value="">Choose a trade…</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Their name or nickname <span className="text-err">*</span></label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Ricky the AC Man" className={inputCls} />
            </div>
          </>
        ) : null}

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Would you hire them again? <span className="text-err">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="cursor-pointer">
              <input type="radio" name="would" value="yes" checked={form.would === "yes"} onChange={() => set("would", "yes")} className="peer sr-only" />
              <span className="block text-center py-2.5 rounded-xl border border-white/15 bg-surface2 text-ink peer-checked:bg-amber peer-checked:text-navy peer-checked:border-amber text-[14px] font-semibold">👍 Yes</span>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="would" value="no" checked={form.would === "no"} onChange={() => set("would", "no")} className="peer sr-only" />
              <span className="block text-center py-2.5 rounded-xl border border-white/15 bg-surface2 text-ink peer-checked:border-amber text-[14px] font-semibold">Not sure</span>
            </label>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-3">
          <ScoreRow label="Quality of finished work" value={form.scores.finished} onChange={(v) => setScore("finished", v)} />
          <div className="pt-2">
            <label className="block text-[13px] text-slate2 mb-1.5">What was good?</label>
            <div className="flex flex-wrap gap-2">{tag("reliable", "Reliable")}{tag("punctual", "Punctual")}{tag("communication", "Good communication")}{tag("fair_price", "Fair price")}</div>
          </div>
        </div>

        <details className="bg-surface border border-white/10 rounded-xl p-3">
          <summary className="text-[13px] font-semibold text-amber cursor-pointer">Write a full review (optional)</summary>
          <div className="space-y-3 mt-3">
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1">Score each part (out of 10)</label>
              {CORE_DIMENSIONS.filter((d) => d.key !== "finished").map((d) => (
                <ScoreRow key={d.key} label={d.label} value={form.scores[d.key]} onChange={(v) => setScore(d.key, v)} />
              ))}
            </div>
            <div>
              <label className="block text-[12px] text-muted mb-1">Optional extras</label>
              {OPTIONAL_DIMENSIONS.map((d) => (
                <ScoreRow key={d.key} label={d.label} value={form.scores[d.key]} onChange={(v) => setScore(d.key, v)} />
              ))}
            </div>

            <div>
              <label className="block text-[13px] text-slate2 mb-1.5">What type of work did they do?</label>
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

            <div><label className="block text-[13px] text-slate2 mb-1">Anything else?</label><textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} rows={2} placeholder="e.g. Built my wall neatly, fair price" className={inputCls} /></div>

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
        </details>

        <button type="submit" disabled={busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">{busy ? "Saving…" : editing ? "Update review" : "Post review"}</button>
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
