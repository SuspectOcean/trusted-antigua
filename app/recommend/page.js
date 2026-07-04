"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { api } from "@/lib/data";
import { withTimeout } from "@/lib/helpers";
import { useAuth } from "@/components/AuthProvider";

function RecommendInner() {
  const params = useSearchParams();
  const { user, profile, openSignIn } = useAuth();
  const presetPid = params.get("pid") || "";
  const presetName = params.get("pname") || "";
  const presetCat = params.get("cat") || "";

  const [form, setForm] = useState({
    category_id: presetCat, name: presetName, would: "",
    contact: "", area: "", reason: "", job_type: "",
    reliable: false, punctual: false, communication: false, fair_price: false, private_note: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls = "w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30";

  if (!user) {
    return (
      <div className="pt-6">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <div className="text-3xl mb-2">🤝</div>
          <h1 className="text-lg font-bold text-ink">Recommend someone</h1>
          <p className="text-[14px] text-slate2 mt-1">Create a free profile to recommend a tradesperson. It keeps recommendations honest and accountable.</p>
          <button onClick={() => openSignIn("Sign in to recommend a tradesperson.")} className="mt-4 bg-amber text-navy font-semibold px-5 py-2.5 rounded-full text-[15px]">Sign in / Create profile</button>
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!form.category_id || (!presetPid && !name) || !form.would) {
      setMsg({ ok: false, node: "Please fill in the three required fields." });
      return;
    }
    setBusy(true); setMsg(null);
    const log = (...a) => console.log("[recommend]", ...a);
    try {
      log("submit start", { presetPid, name, category: form.category_id });

      // 1) Confirm we still have a valid session (mobile tabs suspend / tokens expire).
      const session = await api.ensureSession();
      log("session present?", !!session, "uid:", session?.user?.id);
      if (!session) {
        setMsg({ ok: false, node: "Your session has expired. Please sign in again, then resubmit." });
        openSignIn("Please sign in again to post your recommendation.");
        setBusy(false);
        return;
      }

      const display = profile ? `${profile.first_name} — ${profile.area}` : "A resident";

      // 2) One atomic call creates provider (if needed) AND recommendation together.
      const providerId = await withTimeout(
        api.submitRecommendation({
          provider_id: presetPid || null,
          name,
          category_id: form.category_id,
          area: form.area,
          contact: form.contact,
          recommender_display: display,
          reason: form.reason,
          job_type: form.job_type,
          would_hire_again: form.would === "yes",
          reliable: form.reliable, punctual: form.punctual, communication: form.communication, fair_price: form.fair_price,
        }),
        15000
      );
      log("saved OK, providerId:", providerId);

      // 3) Optional private note (non-fatal).
      if (form.private_note.trim()) {
        try { await api.addWarning({ provider_id: providerId, provider_name: name, warning: form.private_note.trim() }); }
        catch (w) { console.warn("[recommend] private note failed (non-fatal)", w); }
      }

      setMsg({ ok: true, node: (<>✅ Thank you! Your recommendation has been added. <Link className="text-amber underline" href={`/provider?id=${encodeURIComponent(providerId)}`}>View profile</Link></>) });
      setForm({ category_id: "", name: "", would: "", contact: "", area: "", reason: "", job_type: "", reliable: false, punctual: false, communication: false, fair_price: false, private_note: "" });
    } catch (err) {
      console.error("[recommend] submit failed", err);
      const text = `${err?.code || ""} ${err?.message || ""}`.toLowerCase();
      let node = "Sorry, something went wrong saving that. Please try again.";
      if (text.includes("not_signed_in") || text.includes("28000") || text.includes("jwt")) {
        node = "Your session has expired. Please sign in again, then resubmit.";
        openSignIn("Please sign in again to post your recommendation.");
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

  return (
    <>
      <h1 className="text-xl font-extrabold text-ink mt-1">Recommend someone</h1>
      <p className="text-[13px] text-muted mt-1 mb-4">Takes about 20 seconds. Only the first three are required.</p>
      <form onSubmit={submit} className="space-y-4">
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
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Would you recommend them? <span className="text-err">*</span></label>
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

        <details className="bg-surface border border-white/10 rounded-xl p-3">
          <summary className="text-[13px] font-semibold text-amber cursor-pointer">Add more (optional)</summary>
          <div className="space-y-3 mt-3">
            <div><label className="block text-[13px] text-slate2 mb-1">Phone / WhatsApp</label><input value={form.contact} onChange={(e) => set("contact", e.target.value)} inputMode="tel" placeholder="+1 268 …" className={inputCls} /></div>
            <div><label className="block text-[13px] text-slate2 mb-1">Area they serve</label><input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Jolly Harbour" className={inputCls} /></div>
            <div><label className="block text-[13px] text-slate2 mb-1">Why do you recommend them?</label><textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} rows={2} placeholder="e.g. Built my wall neatly, fair price" className={inputCls} /></div>
            <div><label className="block text-[13px] text-slate2 mb-1">What job did they do?</label><input value={form.job_type} onChange={(e) => set("job_type", e.target.value)} placeholder="e.g. AC repair" className={inputCls} /></div>
            <div>
              <label className="block text-[13px] text-slate2 mb-1">What was good?</label>
              <div className="flex flex-wrap gap-2">{tag("reliable", "Reliable")}{tag("punctual", "Punctual")}{tag("communication", "Good communication")}{tag("fair_price", "Fair price")}</div>
            </div>
            <div className="border-t border-white/10 pt-3">
              <label className="block text-[13px] text-slate2 mb-1">Private note or warning</label>
              <p className="text-[11px] text-muted mb-1">Only our team sees this. It is never shown publicly.</p>
              <textarea value={form.private_note} onChange={(e) => set("private_note", e.target.value)} rows={2} placeholder="Anything we should quietly know?" className={inputCls} />
            </div>
          </div>
        </details>

        <button type="submit" disabled={busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">{busy ? "Saving…" : "Add recommendation"}</button>
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
