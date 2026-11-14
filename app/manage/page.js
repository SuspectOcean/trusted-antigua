"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GROUPED, CAT, SELECTABLE_AREAS } from "@/lib/categories";
import { api } from "@/lib/data";
import { withTimeout } from "@/lib/helpers";
import { useAuth } from "@/components/AuthProvider";
import { TRUST } from "@/lib/trust";
import { MATERIALS_STATES, MATERIALS_ORDER, MATERIALS_MIN_REPORTS, FEE_WARN_FROM, feeApplies, materialsApplies } from "@/lib/materials";

const DESC_MAX = 250;
const MAX_SECONDARY = 4;

function Check({ done }) {
  return (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${done ? "bg-ok text-white" : "bg-surface2 border border-ink/15 text-muted"}`}>
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
  const [addTrade, setAddTrade] = useState("");
  const [materials, setMaterials] = useState(null); // provider's own statement: supplies | customer | varies | null
  const [matBusy, setMatBusy] = useState(false);
  const [matMsg, setMatMsg] = useState(null);
  const [fee, setFee] = useState(""); // materials supply fee percentage as typed, "" = not stated
  const [receipts, setReceipts] = useState(null); // true | false | null
  const [termsBusy, setTermsBusy] = useState(false);
  const [termsMsg, setTermsMsg] = useState(null);

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
            secondary_categories: prov.secondary_categories || [],
          });
        }
      })
      .catch((e) => { console.error("[manage] load failed", e); setP(null); });
    api.myCategoryRequest(id, user.id).then(setExistingCatReq).catch(() => {});
    api.materialsFor(id).then((m) => {
      setMaterials(m?.declared || null);
      setFee(m?.fee_pct == null ? "" : String(m.fee_pct));
      setReceipts(typeof m?.receipts === "boolean" ? m.receipts : null);
    });
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
  const inputCls = "w-full rounded-md border border-ink/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30";

  const toggleArea = (a) =>
    setForm((f) => ({ ...f, service_areas: f.service_areas.includes(a) ? f.service_areas.filter((x) => x !== a) : [...f.service_areas, a] }));

  const addSecondary = (id) => {
    if (!id) return;
    setForm((f) => ({
      ...f,
      secondary_categories:
        f.secondary_categories.includes(id) || id === p.category_id || f.secondary_categories.length >= MAX_SECONDARY
          ? f.secondary_categories
          : [...f.secondary_categories, id],
    }));
    setAddTrade("");
  };
  const removeSecondary = (id) =>
    setForm((f) => ({ ...f, secondary_categories: f.secondary_categories.filter((x) => x !== id) }));

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
    } catch (e2) {
      console.error(e2);
      // Say what actually went wrong, so a rejected upload isn't a mystery.
      const map = {
        file_too_large: "That image is over 2 MB. Please choose a smaller one.",
        unsupported_file_type: "Please choose a JPEG, PNG or WebP image.",
        not_an_image: "That file isn't a readable image. Please choose a photo.",
        upload_rate_limited: "You've uploaded a lot today. Please try again tomorrow.",
      };
      setMsg({ ok: false, text: map[e2?.message] || "Photo upload failed. Please try again." });
    }
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
        secondary_categories: (form.secondary_categories || []).filter((c) => c !== p.category_id),
      });
      setP((prev) => ({ ...prev, ...form, area: areaSummary }));
      setMsg({ ok: true, text: "✅ Profile saved." });
    } catch (e2) { console.error(e2); setMsg({ ok: false, text: "Couldn't save. Please try again." }); }
    finally { setBusy(false); }
  }

  // Saves on tap. Tapping the selected option again clears it.
  async function chooseMaterials(v) {
    const next = materials === v ? null : v;
    setMatBusy(true); setMatMsg(null);
    try {
      await api.setProviderMaterials(p.id, next);
      setMaterials(next);
      if (!next) { setFee(""); setReceipts(null); setTermsMsg(null); } // clearing removes the fee and receipts too
      setMatMsg({ ok: true, text: next ? "Saved." : "Cleared." });
    } catch (e2) { console.error(e2); setMatMsg({ ok: false, text: "Couldn't save. Please try again." }); }
    finally { setMatBusy(false); }
  }

  // Materials supply fee and receipts. A fee above 0 always means receipts are shown;
  // the database enforces the same rule.
  const feeNum = fee === "" ? null : Math.max(0, Math.min(100, Math.round(Number(fee))));
  const feeCharged = feeNum != null && feeNum > 0;
  const onFee = (v) => {
    const clean = v.replace(/[^0-9]/g, "").slice(0, 3);
    setFee(clean === "" ? "" : String(Math.min(100, Number(clean))));
    setTermsMsg(null);
  };
  async function saveTerms() {
    setTermsBusy(true); setTermsMsg(null);
    try {
      const r = feeCharged ? true : receipts;
      await api.setProviderMaterialsTerms(p.id, feeNum, r);
      setReceipts(r);
      setTermsMsg({ ok: true, text: "Saved." });
    } catch (e2) { console.error(e2); setTermsMsg({ ok: false, text: "Couldn't save. Please try again." }); }
    finally { setTermsBusy(false); }
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
  const showMaterials = materialsApplies([p.category_id, ...(form?.secondary_categories || [])]);

  return (
    <div className="pt-2">
      <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="text-[13px] text-slate2">‹ Back to profile</Link>
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-xl font-display font-semibold text-ink">Manage profile</h1>
        <span className="text-[12px] text-muted">Status: <span className="text-slate2 font-medium">{level}</span></span>
      </div>

      {/* Onboarding checklist */}
      <div className="mt-3 bg-surface border border-ink/10 rounded-md p-4 shadow-card">
        <div className="font-semibold text-ink text-[15px]">Complete your profile</div>
        <div className="mt-3 space-y-2.5 text-[14px]">
          <div className="flex items-center gap-2 text-slate2"><Check done={hasPhoto} /> Add a profile photo</div>
          <div className="flex items-center gap-2 text-slate2"><Check done={hasDesc} /> Write a short description</div>
          <div className="flex items-center gap-2 text-slate2"><Check done={hasArea} /> Confirm your service areas</div>
          {showMaterials ? <div className="flex items-center gap-2 text-slate2"><Check done={!!materials} /> Say who supplies the materials</div> : null}
          <div className="flex items-center gap-2 text-slate2"><Check done={false} /> Request a category change (only if needed)</div>
          <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="flex items-center gap-2 text-amber"><Check done={false} /> Review your public profile ›</Link>
        </div>
      </div>

      {/* Photo */}
      <div className="mt-4 bg-surface border border-ink/10 rounded-md p-4 shadow-card">
        <div className="flex items-center gap-3">
          {p.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={p.photo_url} alt="" className="w-16 h-16 rounded-md object-cover border border-ink/10" />
            : <div className="w-16 h-16 rounded-md bg-surface2 border border-ink/10 flex items-center justify-center text-slate2 text-2xl font-bold">{(form?.alias || p.name || "?").charAt(0).toUpperCase()}</div>}
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

      {/* Who supplies the materials: the provider's own statement. */}
      {showMaterials ? (
        <div className="mt-4 bg-surface border border-ink/10 rounded-md p-4 shadow-card">
          <div className="font-semibold text-ink text-[15px]">Who supplies the materials?</div>
          <p className="text-[12px] text-muted mt-0.5">
            Customers want to know before they hire. This shows on your profile as your own statement. Once {MATERIALS_MIN_REPORTS} customers have answered the same question in their reviews, their answers are shown instead.
          </p>
          <div className="mt-3 space-y-2">
            {MATERIALS_ORDER.map((k) => (
              <button
                type="button"
                key={k}
                disabled={matBusy}
                onClick={() => chooseMaterials(k)}
                className={`w-full text-left px-3 py-2.5 rounded-md border text-[14px] font-semibold disabled:opacity-60 ${materials === k ? "bg-amber text-navy border-amber" : "bg-surface2 text-ink border-ink/15"}`}
              >
                {MATERIALS_STATES[k].owner}
              </button>
            ))}
          </div>
          {matMsg ? <p className={`text-[13px] mt-2 ${matMsg.ok ? "text-ok" : "text-err"}`}>{matMsg.text}</p> : null}

          {/* Fee and receipts: only when the provider supplies materials. */}
          {feeApplies(materials) ? (
            <div className="mt-4 pt-4 border-t border-ink/10">
              <label htmlFor="mat-fee" className="block text-[14px] font-semibold text-ink">What&apos;s your fee percentage for supplying materials?</label>
              <p className="text-[12px] text-muted mt-0.5">This covers you paying for the materials up front on the customer&apos;s behalf, sourcing them and bringing them to the job. Type a number from 0 to 100. Customers see it as: receipt cost plus your percentage.</p>
              <div className="mt-2 flex items-center gap-2">
                <input id="mat-fee" value={fee} onChange={(e) => onFee(e.target.value)} inputMode="numeric" placeholder="e.g. 15" className={inputCls.replace("w-full", "w-28")} />
                <span className="text-[15px] text-slate2">%</span>
              </div>
              {feeNum != null && feeNum >= FEE_WARN_FROM ? (
                <div className="mt-2 bg-amber/10 border border-amber/30 rounded-md p-3 text-[13px] text-slate2">
                  <b className="text-amber">This is considered a very high fee for supplying materials.</b> You may not get as many jobs.
                </div>
              ) : null}
              {feeCharged ? (
                <div className="mt-2 bg-surface2 border border-ink/10 rounded-md p-3 text-[13px] text-slate2">
                  <b className="text-ink">Receipts must be shown.</b> If you charge a supply fee, show the customer the receipt for everything you buy. Customers are asked in their review whether they saw receipts. If you don&apos;t show them, you are at risk of bad reviews.
                </div>
              ) : (
                <div className="mt-3">
                  <div className="text-[13px] text-slate2 mb-1.5">Do you show customers the receipts?</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setReceipts(receipts === true ? null : true); setTermsMsg(null); }} className={`py-2.5 rounded-md border text-[14px] font-semibold ${receipts === true ? "bg-amber text-navy border-amber" : "bg-surface2 text-ink border-ink/15"}`}>Yes</button>
                    <button type="button" onClick={() => { setReceipts(receipts === false ? null : false); setTermsMsg(null); }} className={`py-2.5 rounded-md border text-[14px] font-semibold ${receipts === false ? "bg-amber text-navy border-amber" : "bg-surface2 text-ink border-ink/15"}`}>No</button>
                  </div>
                </div>
              )}
              <button type="button" onClick={saveTerms} disabled={termsBusy} className="mt-3 w-full bg-surface2 border border-ink/15 text-ink font-semibold py-2.5 rounded-md text-[14px] disabled:opacity-60">{termsBusy ? "Saving…" : "Save fee and receipts"}</button>
              {termsMsg ? <p className={`text-[13px] mt-2 ${termsMsg.ok ? "text-ok" : "text-err"}`}>{termsMsg.text}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

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
            <button type="button" onClick={() => set("area_scope", "islandwide")} className={`py-2.5 rounded-md border text-[14px] font-semibold ${form.area_scope === "islandwide" ? "bg-amber text-navy border-amber" : "bg-surface2 text-ink border-ink/15"}`}>Island-wide</button>
            <button type="button" onClick={() => set("area_scope", "selected")} className={`py-2.5 rounded-md border text-[14px] font-semibold ${form.area_scope === "selected" ? "bg-amber text-navy border-amber" : "bg-surface2 text-ink border-ink/15"}`}>Selected areas</button>
          </div>
          {form.area_scope === "selected" ? (
            <div className="flex flex-wrap gap-2">
              {SELECTABLE_AREAS.map((a) => (
                <button type="button" key={a} onClick={() => toggleArea(a)} className={`text-[13px] px-3 py-1.5 rounded-full border ${form.service_areas.includes(a) ? "bg-teal/15 text-teal border-teal/40" : "bg-surface2 text-slate2 border-ink/15"}`}>{a}</button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-ink mb-1.5">Other trades you offer</label>
          <p className="text-[12px] text-muted mb-1.5">You appear in search under your main trade (<b className="text-slate2">{CAT[p.category_id]?.name || p.category_id}</b>) plus any you add here.</p>
          {(form.secondary_categories || []).length ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.secondary_categories.map((id) => (
                <span key={id} className="inline-flex items-center gap-1.5 text-[13px] bg-teal/15 text-teal border border-teal/40 px-2.5 py-1 rounded-full">
                  {CAT[id]?.name || id}
                  <button type="button" onClick={() => removeSecondary(id)} className="text-teal/80 hover:text-teal" aria-label="Remove">✕</button>
                </span>
              ))}
            </div>
          ) : null}
          {(form.secondary_categories || []).length < MAX_SECONDARY ? (
            <select value={addTrade} onChange={(e) => addSecondary(e.target.value)} className={inputCls}>
              <option value="">＋ Add another trade…</option>
              {GROUPED.map((g) => {
                const cats = g.categories.filter((c) => c.id !== p.category_id && !(form.secondary_categories || []).includes(c.id));
                return cats.length ? (
                  <optgroup key={g.id} label={g.name}>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </optgroup>
                ) : null;
              })}
            </select>
          ) : <p className="text-[11px] text-muted">Maximum extra trades reached. For anything else, list a separate profile.</p>}
        </div>

        <button type="submit" disabled={busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">{busy ? "Saving…" : "Save profile"}</button>
        {msg ? <p className={`text-center text-[13px] ${msg.ok ? "text-ok" : "text-err"}`}>{msg.text}</p> : null}
      </form>

      {/* Category change request */}
      <div className="mt-6 bg-surface border border-ink/10 rounded-md p-4 shadow-card">
        <div className="font-semibold text-ink text-[15px]">Category</div>
        <p className="text-[12px] text-muted mt-0.5">You appear under <b className="text-slate2">{CAT[p.category_id]?.name || p.category_id}</b>. To keep search accurate, category changes are reviewed by our team.</p>
        {existingCatReq ? (
          <div className="mt-2 text-[13px] text-slate2">⏳ Change to <b>{CAT[existingCatReq.requested_category]?.name || existingCatReq.requested_category}</b> is awaiting review.</div>
        ) : (
          <div className="mt-2 flex gap-2">
            <select value={catReq} onChange={(e) => setCatReq(e.target.value)} className={inputCls}>
              <option value="">Request a different category…</option>
              {GROUPED.map((g) => {
                const cats = g.categories.filter((c) => c.id !== p.category_id);
                return cats.length ? (
                  <optgroup key={g.id} label={g.name}>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </optgroup>
                ) : null;
              })}
            </select>
            <button type="button" onClick={submitCatReq} className="shrink-0 bg-surface2 border border-ink/15 text-ink font-semibold text-[13px] px-3 rounded-md">Request</button>
          </div>
        )}
        {catMsg ? <p className={`text-[13px] mt-2 ${catMsg.ok ? "text-ok" : "text-err"}`}>{catMsg.text}</p> : null}
      </div>

      <div className="mt-6 bg-surface2 border border-ink/10 rounded-md p-3 text-[12px] text-muted">
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
