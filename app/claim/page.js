"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CAT } from "@/lib/categories";
import { api } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";
import { isClaimed } from "@/lib/trust";

const DESC_MAX = 250;

function ClaimInner() {
  const id = useSearchParams().get("id");
  const { user, openSignIn } = useAuth();
  const [p, setP] = useState(undefined);
  const [existing, setExisting] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", contact: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!id) { setP(null); return; }
    api.provider(id).then((prov) => {
      setP(prov || null);
      if (prov) setForm((f) => ({ ...f, name: prov.alias || prov.name || "", description: prov.description || "" }));
    });
  }, [id]);

  useEffect(() => {
    if (id && user) api.myClaimForProvider(id, user.id).then(setExisting);
  }, [id, user]);

  if (p === undefined) return <div className="py-16 text-center text-muted">Loading…</div>;
  if (p === null) return <div className="py-16 text-center text-slate2">Profile not found. <Link className="text-amber underline" href="/find">Back</Link></div>;

  if (!user) {
    return (
      <div className="pt-6 text-center">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-card">
          <h1 className="text-lg font-bold text-ink">Claim {p.alias || p.name}</h1>
          <p className="text-[14px] text-slate2 mt-1">Sign in to claim your business profile.</p>
          <button onClick={() => openSignIn("Sign in to claim your business profile.")} className="mt-4 bg-amber text-navy font-semibold px-5 py-2.5 rounded-full text-[15px]">Sign in / Create profile</button>
        </div>
      </div>
    );
  }

  if (isClaimed(p.trust_level)) {
    return (
      <div className="pt-6">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <h1 className="text-lg font-bold text-ink">This profile is already claimed</h1>
          <p className="text-[14px] text-slate2 mt-1">If you believe this is a mistake, use the private concern link on the profile and our team will review it.</p>
          <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="mt-4 inline-block text-amber font-semibold text-[14px]">‹ Back to profile</Link>
        </div>
      </div>
    );
  }

  if (done || (existing && existing.status === "pending")) {
    return (
      <div className="pt-6">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <div className="text-3xl mb-2">⏳</div>
          <h1 className="text-lg font-bold text-ink">Claim submitted</h1>
          <p className="text-[14px] text-slate2 mt-1">Thanks — your claim for <b>{p.alias || p.name}</b> is now with our team for review. You&apos;ll be able to edit the profile once it&apos;s approved.</p>
          <Link href="/account" className="mt-4 inline-block text-amber font-semibold text-[14px]">Go to my account ›</Link>
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls = "w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30";

  async function submit(e) {
    e.preventDefault();
    if (!confirm) { setErr("Please confirm this is your business."); return; }
    setBusy(true); setErr(null);
    try {
      await api.submitClaim({
        provider_id: p.id,
        claimant_id: user.id,
        submitted_name: form.name.trim() || null,
        submitted_description: form.description.trim() || null,
        submitted_contact: form.contact.trim() || null,
      });
      setDone(true);
    } catch (e2) {
      console.error(e2);
      setErr("Sorry, we couldn't submit that. Please try again.");
    } finally { setBusy(false); }
  }

  const cat = CAT[p.category_id];

  return (
    <div className="pt-2">
      <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="text-[13px] text-slate2">‹ Back to profile</Link>
      <h1 className="text-xl font-extrabold text-ink mt-2">Claim this profile</h1>
      <div className="mt-2 bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        <div className="font-semibold text-ink">{p.alias || p.name}</div>
        <div className="text-[13px] text-slate2">{cat ? `${cat.emoji} ${cat.name}` : ""}{p.area ? ` · ${p.area}` : ""}</div>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1 accent-amber" />
          <span className="text-[14px] text-slate2">I confirm this profile is my business and the details I provide are accurate.</span>
        </label>

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Business / display name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="How your business should appear" />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Short description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value.slice(0, DESC_MAX))} rows={3} className={inputCls} placeholder="Factual introduction — what you do and where. No marketing language." />
          <div className="text-[11px] text-muted mt-1 text-right">{form.description.length}/{DESC_MAX}</div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Your WhatsApp / phone</label>
          <input value={form.contact} onChange={(e) => set("contact", e.target.value)} inputMode="tel" className={inputCls} placeholder="+1 268 …" />
          <p className="text-[11px] text-muted mt-1">Helps us verify your claim. Only shown publicly once approved.</p>
        </div>

        <div className="bg-surface2 border border-white/10 rounded-xl p-3 text-[12px] text-muted">
          Claiming lets you edit your description, photo, and service areas. It does <b>not</b> let you edit, hide, or reply to recommendations — those stay controlled by the community.
        </div>

        <button type="submit" disabled={busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">{busy ? "Submitting…" : "Submit claim for review"}</button>
        {err ? <p className="text-center text-[13px] text-err">{err}</p> : null}
      </form>
      <div className="h-4" />
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <ClaimInner />
    </Suspense>
  );
}
