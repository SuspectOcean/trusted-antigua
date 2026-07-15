"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, CAT, SELECTABLE_AREAS } from "@/lib/categories";
import { api } from "@/lib/data";
import { withTimeout } from "@/lib/helpers";
import { useAuth } from "@/components/AuthProvider";
import { TRUST } from "@/lib/trust";

const DESC_MAX = 250;

function Check({ done }) {
  return (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${done ? "bg-ok text-white" : "bg-surface2 border border-white/15 text-muted"}`}>
      {done ? "✓" : ""}
    </span>
  );
}

function ManageInner() {
  const id = useSearchParams().get("id");
  const { user, loading } = useAuth();
  const [p, setP] = useState(undefined);
  const [form, setForm] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [catReq, setCatReq] = useState("");
  const [existingCatReq, setExistingCatReq] = useState(null);
  const [catMsg, setCatMsg] = useState(null);

  useEffect(() => {
    if (!id || !user) return;
    withTimeout(api.manageProvider(id))
      .then((prov) => {
        setP(prov || null);
        if (prov) {
          setForm({
            alias: prov.alias || prov.name || "",
            description: prov.description || "",
            contact: prov.contact || "",
            area_scope: prov.area_scope || (prov.area === "Island-wide" ? "islandwide" : "selected"),
            service_areas: prov.service_areas || [],
          });
        }
      })
      .catch((e) => { console.error("[manage] load failed", e); setP(null); });
    api.myCategoryRequest(id, user.id).then(setExistingCatReq).catch(() => {});
  }, [id, user]);

  if (loading || (user && p === undefined)) return <div className="py-16 text-center text-muted">Loading…</div>;
  if (!user) return <div className="py-16 text-center text-slate2">Please sign in to manage a profile.</div>;
  if (p === null) return <div className="py-16 text-center text-slate2">Profile not found.</div>;
  if (p.claimed_by !== user.id) {
    return (
      <div className="py-16 text-center text-slate2">
        You don&apos;t manage this profile.
        <div className="mt-2"><Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="text-amber underline">View profile</Link></div>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputCls = "w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30";

  const toggleArea = (a) =>
    setForm((f) => ({ ...f, service_areas: f.service_areas.includes(a) ? f.service_areas.filter((x) => x !== a) : [...f.service_areas, a] }));

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg({ ok: false, text: "Please choose an image under 2 MB." }); return; }
    setPhotoBusy(true); setMsg(null);
    try {
      const url = await api.uploadPhoto(file, user.id);
      await api.updateProfile(p.id, { photo_url: url });
      setP((prev) => ({ ...prev, photo_url: url }));
      setMsg({ ok: true, text: "Photo updated." });
    } catch (e2) { console.error(e2); setMsg({ ok: false, text: "Photo upload failed. Please try again." }); }
    finally { setPhotoBusy(false); }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const scope = form.area_scope;
    const areaSummary = scope === "islandwide" ? "Island-wide" : (form.service_areas.join(", ") || null);
    try {
      await api.updateProfile(p.id, {
        alias: form.alias.trim() || null,
        description: form.description.trim() || null,
        contact: form.contact.trim() || null,
        area_scope: scope,
        service_areas: scope === "selected" ? form.service_areas : null,
        area: areaSummary,
      });
      setP((prev) => ({ ...prev, ...form, area: areaSummary }));
      setMsg({ ok: true, text: "✅ Profile saved." });
    } catch (e2) { console.error(e2); setMsg({ ok: false, text: "Couldn't save. Please try again." }); }
    finally { setBusy(false); }
  }

  async function submitCatReq() {
    if (!catReq || catReq === p.category_id) { setCatMsg({ ok: false, text: "Pick a different category." }); return; }
    setCatMsg(null);
    try {
      await api.requestCategoryChange({ provider_id: p.id, requester_id: user.id, current_category: p.category_id, requested_category: catReq });
      setExistingCatReq({ requested_category: catReq, status: "pending" });
      setCatMsg({ ok: true, text: "Request sent for review." });
    } catch (e2) { console.error(e2); setCatMsg({ ok: false, text: "Couldn't send request." }); }
  }

  // Onboarding checklist — derived from current state.
  const hasPhoto = !!p.photo_url;
  const hasDesc = !!(form?.description || "").trim();
  const hasArea = form?.area_scope === "islandwide" || (form?.service_areas || []).length > 0;
  const level = TRUST[p.trust_level]?.label || "Listed";

  return (
    <div className="pt-2">
      <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="text-[13px] text-slate2">‹ Back to profile</Link>
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-xl font-display font-semibold text-ink">Manage profile</h1>
        <span className="text-[12px] text-muted">Status: <span className="text-slate2 font-medium">{level}</span></span>
      </div>

      {/* Onboarding checklist */}
      <div className="mt-3 bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        <div className="font-semibold text-ink text-[15px]">Complete your profile</div>
        <div className="mt-3 space-y-2.5 text-[14px]">
          <div className="flex items-center gap-2 text-slate2"><Check done={hasPhoto} /> Add a profile photo</div>
          <div className="flex items-center gap-2 text-slate2"><Check done={hasDesc} /> Write a short description</div>
          <div className="flex items-center gap-2 text-slate2"><Check done={hasArea} /> Confirm your service areas</div>
          <div className="flex items-center gap-2 text-slate2"><Check done={false} /> Request a category change (only if needed)</div>
          <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="flex items-center gap-2 text-amber"><Check done={false} /> Review your public profile ›</Link>
        </div>
      </div>

      {/* Photo */}
      <div className="mt-4 bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-3">
          {p.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={p.photo_url} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
            : <div className="w-16 h-16 rounded-2xl bg-surface2 border border-white/10 flex items-center justify-center text-slate2 text-2xl font-bold">{(form?.alias || p.name || "?").charAt(0).toUpperCase()}</div>}
          <div>
            <div className="text-[14px] font-semibold text-ink">Profile photo</div>
            <label className="mt-1 inline-block text-[13px] text-amber font-semibold cursor-pointer">
              {photoBusy ? "Uploading…" : (p.photo_url ? "Change photo" : "Upload photo")}
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" disabled={photoBusy} />
            </label>
            <div className="text-[11px] text-muted">JPG or PNG, under 2 MB.</div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={save} className="mt-4 space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Business / display name</label>
          <input value={form.alias} onChange={(e) => set("alias", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Short description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value.slice(0, DESC_MAX))} rows={3} className={inputCls} placeholder="Factual introduction. No marketing language, no emojis." />
          <div className="text-[11px] text-muted mt-1 text-right">{form.description.length}/{DESC_MAX}</div>
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">WhatsApp / phone</label>
          <input value={form.contact} onChange={(e) => set("contact", e.target.value)} inputMode="tel" className={inputCls} placeholder="+1 268 …" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Service areas</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button type="button" onClick={() => set("area_scope", "islandwide")} className={`py-2.5 rounded-xl border text-[14px] font-semibold ${form.area_scope === "islandwide" ? "bg-amber text-navy border-amber" : "bg-surface2 text-ink border-white/15"}`}>Island-wide</button>
            <button type="button" onClick={() => set("area_scope", "selected")} className={`py-2.5 rounded-xl border text-[14px] font-semibold ${form.area_scope === "selected" ? "bg-amber text-navy border-amber" : "bg-surface2 text-ink border-white/15"}`}>Selected areas</button>
          </div>
          {form.area_scope === "selected" ? (
            <div className="flex flex-wrap gap-2">
              {SELECTABLE_AREAS.map((a) => (
                <button type="button" key={a} onClick={() => toggleArea(a)} className={`text-[13px] px-3 py-1.5 rounded-full border ${form.service_areas.includes(a) ? "bg-teal/15 text-teal border-teal/40" : "bg-surface2 text-slate2 border-white/15"}`}>{a}</button>
              ))}
            </div>
          ) : null}
        </div>

        <button type="submit" disabled={busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">{busy ? "Saving…" : "Save profile"}</button>
        {msg ? <p className={`text-center text-[13px] ${msg.ok ? "text-ok" : "text-err"}`}>{msg.text}</p> : null}
      </form>

      {/* Category change request */}
      <div className="mt-6 bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        <div className="font-semibold text-ink text-[15px]">Category</div>
        <p className="text-[12px] text-muted mt-0.5">You appear under <b className="text-slate2">{CAT[p.category_id]?.name || p.category_id}</b>. To keep search accurate, category changes are reviewed by our team.</p>
        {existingCatReq ? (
          <div className="mt-2 text-[13px] text-slate2">⏳ Change to <b>{CAT[existingCatReq.requested_category]?.name || existingCatReq.requested_category}</b> is awaiting review.</div>
        ) : (
          <div className="mt-2 flex gap-2">
            <select value={catReq} onChange={(e) => setCatReq(e.target.value)} className={inputCls}>
              <option value="">Request a different category…</option>
              {CATEGORIES.filter((c) => c.id !== p.category_id).map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
            <button type="button" onClick={submitCatReq} className="shrink-0 bg-surface2 border border-white/15 text-ink font-semibold text-[13px] px-3 rounded-xl">Request</button>
          </div>
        )}
        {catMsg ? <p className={`text-[13px] mt-2 ${catMsg.ok ? "text-ok" : "text-err"}`}>{catMsg.text}</p> : null}
      </div>

      <div className="mt-6 bg-surface2 border border-white/10 rounded-xl p-3 text-[12px] text-muted">
        You control how you&apos;re described. The community controls how you&apos;re rated. Recommendations and ratings can&apos;t be edited here.
      </div>
      <div className="h-4" />
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <ManageInner />
    </Suspense>
  );
}
