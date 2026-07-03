"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { api } from "@/lib/data";

function RecommendInner() {
  const params = useSearchParams();
  const presetPid = params.get("pid") || "";
  const presetName = params.get("pname") || "";
  const presetCat = params.get("cat") || "";

  const [form, setForm] = useState({
    category_id: presetCat,
    name: presetName,
    would: "",
    contact: "",
    area: "",
    reason: "",
    job_type: "",
    reliable: false,
    punctual: false,
    communication: false,
    fair_price: false,
    private_note: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || !form.category_id || !form.would) {
      setMsg({ ok: false, node: "Please fill in the three required fields." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      let providerId = presetPid;
      if (!providerId) {
        const prov = await api.findOrCreateProvider({
          name,
          category_id: form.category_id,
          area: form.area,
          contact: form.contact,
        });
        providerId = prov.id;
      }
      await api.addRecommendation({
        provider_id: providerId,
        recommender_display: null,
        reason: form.reason.trim() || null,
        job_type: form.job_type.trim() || null,
        would_hire_again: form.would === "yes",
        reliable: form.reliable,
        punctual: form.punctual,
        communication: form.communication,
        fair_price: form.fair_price,
      });
      if (form.private_note.trim()) {
        await api.addWarning({ provider_id: providerId, provider_name: name, warning: form.private_note.trim() });
      }
      setMsg({
        ok: true,
        node: (
          <>
            ✅ Thank you! Your recommendation has been added.{" "}
            <Link className="text-teal underline" href={`/provider?id=${encodeURIComponent(providerId)}`}>View profile</Link>
          </>
        ),
      });
      setForm({
        category_id: "", name: "", would: "", contact: "", area: "", reason: "", job_type: "",
        reliable: false, punctual: false, communication: false, fair_price: false, private_note: "",
      });
    } catch (err) {
      console.error(err);
      setMsg({ ok: false, node: "Sorry, something went wrong saving that. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  const tag = (k, label) => (
    <label className="cursor-pointer">
      <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} className="peer sr-only" />
      <span className="block text-[13px] px-3 py-1.5 rounded-full border border-black/10 bg-white peer-checked:bg-teal/10 peer-checked:text-teal peer-checked:border-teal/40">{label}</span>
    </label>
  );

  return (
    <>
      <h1 className="text-xl font-extrabold text-navy mt-1">Recommend someone</h1>
      <p className="text-[13px] text-ink/60 mt-1 mb-4">Takes about 20 seconds. Only the first three are required.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-navy mb-1">What do they do? <span className="text-red-500">*</span></label>
          <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} required className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[15px]">
            <option value="">Choose a trade…</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-navy mb-1">Their name or nickname <span className="text-red-500">*</span></label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Ricky the AC Man" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[15px]" />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-navy mb-1">Would you recommend them? <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="cursor-pointer">
              <input type="radio" name="would" value="yes" checked={form.would === "yes"} onChange={() => set("would", "yes")} className="peer sr-only" />
              <span className="block text-center py-2.5 rounded-xl border border-black/10 bg-white peer-checked:bg-teal peer-checked:text-white peer-checked:border-teal text-[14px] font-semibold">👍 Yes</span>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="would" value="no" checked={form.would === "no"} onChange={() => set("would", "no")} className="peer sr-only" />
              <span className="block text-center py-2.5 rounded-xl border border-black/10 bg-white peer-checked:bg-navy peer-checked:text-white peer-checked:border-navy text-[14px] font-semibold">Not sure</span>
            </label>
          </div>
        </div>

        <details className="bg-white rounded-xl border border-black/10 p-3">
          <summary className="text-[13px] font-semibold text-teal cursor-pointer">Add more (optional)</summary>
          <div className="space-y-3 mt-3">
            <div>
              <label className="block text-[13px] text-navy mb-1">Phone / WhatsApp</label>
              <input value={form.contact} onChange={(e) => set("contact", e.target.value)} inputMode="tel" placeholder="+1 268 …" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]" />
            </div>
            <div>
              <label className="block text-[13px] text-navy mb-1">Area they serve</label>
              <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Jolly Harbour" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]" />
            </div>
            <div>
              <label className="block text-[13px] text-navy mb-1">Why do you recommend them?</label>
              <textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} rows={2} placeholder="e.g. Built my wall neatly, fair price" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]" />
            </div>
            <div>
              <label className="block text-[13px] text-navy mb-1">What job did they do?</label>
              <input value={form.job_type} onChange={(e) => set("job_type", e.target.value)} placeholder="e.g. AC repair" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px]" />
            </div>
            <div>
              <label className="block text-[13px] text-navy mb-1">What was good?</label>
              <div className="flex flex-wrap gap-2">
                {tag("reliable", "Reliable")}
                {tag("punctual", "Punctual")}
                {tag("communication", "Good communication")}
                {tag("fair_price", "Fair price")}
              </div>
            </div>
            <div className="border-t border-black/5 pt-3">
              <label className="block text-[13px] text-navy mb-1">Private note or warning</label>
              <p className="text-[11px] text-ink/50 mb-1">Only our team sees this. It is never shown publicly.</p>
              <textarea value={form.private_note} onChange={(e) => set("private_note", e.target.value)} rows={2} placeholder="Anything we should quietly know?" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px] bg-sand" />
            </div>
          </div>
        </details>

        <button type="submit" disabled={busy} className="w-full bg-gold text-white font-bold py-3 rounded-full text-[15px] disabled:opacity-60">
          {busy ? "Saving…" : "Add recommendation"}
        </button>
        {msg ? <p className={`text-center text-[13px] ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.node}</p> : null}
      </form>
      <div className="h-4" />
    </>
  );
}

export default function RecommendPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink/50">Loading…</div>}>
      <RecommendInner />
    </Suspense>
  );
}
