"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GROUPS, CAT, categoriesInGroup } from "@/lib/categories";
import { api } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";

// Adding a tradesperson, made frictionless:
//  - Contact Picker API (Chrome/Android) auto-fills name + number; manual form
//    everywhere else (Apple blocks the picker on iOS).
//  - Live duplicate check keyed off the number: if it already exists we don't
//    create anything, we point the person at the existing profile.
//  - On create, a gentle nudge to leave the first review.

function contactPickerSupported() {
  return typeof navigator !== "undefined" && "contacts" in navigator && navigator.contacts && "select" in navigator.contacts;
}

export default function AddProviderPage() {
  const router = useRouter();
  const { user, openSignIn } = useAuth();

  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [suggestedTrade, setSuggestedTrade] = useState(""); // when "not listed" is chosen
  const [area, setArea] = useState("");

  const [dupe, setDupe] = useState(null);       // existing provider for this number
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);        // { id, name, category_id }
  const [pickerErr, setPickerErr] = useState(null);
  const debounce = useRef(null);

  const supported = contactPickerSupported();

  // Pre-select the trade from where the user came (Find category/group), so
  // adding someone from the "Animals" or "Electricians" view lands on that trade
  // already chosen. A specific category wins; a group falls back to its first
  // trade as a sensible, editable starting point.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const cat = sp.get("cat");
    const group = sp.get("group");
    if (cat && CAT[cat]) setCategoryId(cat);
    else if (group) {
      const cats = categoriesInGroup(group);
      if (cats && cats.length) setCategoryId(cats[0].id);
    }
  }, []);

  // Live duplicate check (debounced) once there are enough digits to be a number.
  useEffect(() => {
    const digits = phone.replace(/\D/g, "");
    if (debounce.current) clearTimeout(debounce.current);
    if (digits.length < 7) { setDupe(null); setChecking(false); return; }
    setChecking(true);
    debounce.current = setTimeout(async () => {
      const hit = await api.phoneLookup(phone);
      setDupe(hit);
      setChecking(false);
    }, 450);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [phone]);

  async function pickFromContacts() {
    setPickerErr(null);
    try {
      const contacts = await navigator.contacts.select(["name", "tel"], { multiple: false });
      if (contacts && contacts[0]) {
        const c = contacts[0];
        const nm = (Array.isArray(c.name) && c.name[0]) || "";
        const tel = (Array.isArray(c.tel) && c.tel[0]) || "";
        if (nm) setName(nm);
        if (tel) setPhone(tel);
      }
    } catch (e) {
      // User cancelled, or the picker is unavailable in this context.
      setPickerErr("Couldn't open contacts. You can type the details in instead.");
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!user) { openSignIn("Sign in to add a tradesperson to the directory."); return; }
    if (dupe) return; // guarded — the UI shows the existing profile instead
    const suggesting = categoryId === "__suggest__";
    const effectiveCategory = suggesting ? "other" : categoryId;
    setBusy(true); setErr(null);
    try {
      const res = await api.addProviderQuick({
        name: name.trim(),
        alias: alias.trim() || null,
        category_id: effectiveCategory,
        area: area.trim() || null,
        phone: phone.trim(),
      });
      if (!res) { setErr("Something went wrong. Please try again."); setBusy(false); return; }
      if (res.existing) {
        // Slipped past the live check — send them to the existing profile.
        router.push(`/provider/${res.provider_id}`);
        return;
      }
      // If they proposed a trade, log it for admin review (best-effort).
      if (suggesting && suggestedTrade.trim()) {
        try { await api.suggestCategory(suggestedTrade.trim(), res.provider_id); } catch { /* non-blocking */ }
      }
      setDone({ id: res.provider_id, name: alias.trim() || name.trim(), category_id: effectiveCategory });
    } catch (e2) {
      const key = String(e2?.message || "").match(/name_required|category_required|phone_required|not_authenticated/)?.[0];
      const map = {
        name_required: "Please enter their name.",
        category_required: "Please choose a trade.",
        phone_required: "Please enter a valid phone number.",
        not_authenticated: "Please sign in first.",
      };
      setErr(map[key] || "Couldn't add them. Please try again.");
    } finally { setBusy(false); }
  }

  // Success state: added — now nudge a review.
  if (done) {
    return (
      <div className="pt-2 pb-8">
        <div className="bg-surface border border-white/10 rounded-2xl p-5 shadow-card text-center">
          <div className="text-3xl mb-1">✅</div>
          <h1 className="font-display font-semibold text-ink text-[18px]">{done.name} is now on Trusted Antigua</h1>
          <p className="text-[13px] text-slate2 mt-1.5">
            The best thing you can do next is say how they were — one quick review is what makes the listing worth trusting.
          </p>
          <Link
            href={`/recommend?pid=${encodeURIComponent(done.id)}&pname=${encodeURIComponent(done.name)}&cat=${encodeURIComponent(done.category_id)}`}
            className="block mt-4 bg-amber text-navy font-semibold text-sm py-3 rounded-full"
          >
            ★ Add a quick review
          </Link>
          <Link href={`/provider/${done.id}`} className="block mt-2 text-[13px] text-amber font-semibold">View their profile</Link>
          <button
            onClick={() => { setDone(null); setName(""); setAlias(""); setPhone(""); setCategoryId(""); setArea(""); }}
            className="block w-full mt-2 text-[12px] text-muted py-1"
          >
            Add another tradesperson
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <Link href="/find" className="inline-flex items-center gap-1 text-[13px] text-slate2 mb-3">‹ Back</Link>
      <h1 className="text-xl font-display font-semibold text-ink">Add a tradesperson</h1>
      <p className="text-[13px] text-slate2 mt-1">
        Know someone good who isn&apos;t listed? Add them in seconds — we&apos;ll check they&apos;re not already here.
      </p>

      {supported ? (
        <button
          onClick={pickFromContacts}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-surface2 border border-white/15 text-ink font-semibold text-sm py-3 rounded-full active:scale-[.99] transition"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-6M19 8v6" /></svg>
          Pick from my contacts
        </button>
      ) : null}
      {pickerErr ? <p className="text-[12px] text-muted mt-2">{pickerErr}</p> : null}
      {supported ? <div className="text-center text-[11px] text-muted my-3">or enter their details</div> : null}

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div>
          <label className="text-[12px] text-muted">Their name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="e.g. John Baptiste"
            className="w-full mt-1 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber" />
        </div>

        <div>
          <label className="text-[12px] text-muted">Business name <span className="text-muted/60">(optional)</span></label>
          <input value={alias} onChange={(e) => setAlias(e.target.value)} type="text" placeholder="e.g. JB Electrical"
            className="w-full mt-1 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber" />
        </div>

        <div>
          <label className="text-[12px] text-muted">Phone number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="e.g. 464 1234"
            className={`w-full mt-1 rounded-xl border bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none ${dupe ? "border-amber" : "border-white/15 focus:border-amber"}`} />
          {checking ? <p className="text-[11px] text-muted mt-1">Checking if they&apos;re already listed…</p> : null}
        </div>

        {/* Duplicate: number already belongs to someone — link, don't duplicate. */}
        {dupe ? (
          <div className="bg-surface border border-amber/40 rounded-2xl p-3">
            <div className="text-[12px] text-amber font-semibold">This number is already on Trusted Antigua</div>
            <div className="mt-1.5 font-display font-semibold text-ink">{dupe.alias || dupe.name}</div>
            <div className="text-[12px] text-slate2">
              {(CAT[dupe.category_id]?.name) || "Provider"}{dupe.area ? ` · ${dupe.area}` : ""}
            </div>
            <Link href={`/provider/${dupe.provider_id}`} className="block text-center mt-3 bg-amber text-navy font-semibold text-[13px] py-2.5 rounded-full">
              Open their profile
            </Link>
            <p className="text-[11px] text-muted mt-2 text-center">Already the right person? Review or contact them from their profile.</p>
          </div>
        ) : null}

        <div>
          <label className="text-[12px] text-muted">Trade</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full mt-1 rounded-xl border border-white/15 bg-surface2 text-ink px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber">
            <option value="">Choose a trade…</option>
            {GROUPS.map((g) => (
              <optgroup key={g.id} label={g.name}>
                {categoriesInGroup(g.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
            <option value="__suggest__">＋ My trade isn&apos;t listed…</option>
          </select>
          {categoryId === "__suggest__" ? (
            <div className="mt-2">
              <input
                value={suggestedTrade}
                onChange={(e) => setSuggestedTrade(e.target.value)}
                type="text"
                placeholder="What's their trade? e.g. Locksmith"
                className="w-full rounded-xl border border-amber/40 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber"
              />
              <p className="text-[11px] text-muted mt-1">We&apos;ll add them under &ldquo;Other&rdquo; for now and review your suggested trade to add it properly.</p>
            </div>
          ) : null}
        </div>

        <div>
          <label className="text-[12px] text-muted">Area <span className="text-muted/60">(optional)</span></label>
          <input value={area} onChange={(e) => setArea(e.target.value)} type="text" placeholder="e.g. Jolly Harbour"
            className="w-full mt-1 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber" />
        </div>

        {err ? <p className="text-[13px] text-err">{err}</p> : null}

        {!dupe ? (
          <button
            disabled={busy || !name.trim() || !phone.trim() || !categoryId || checking || (categoryId === "__suggest__" && !suggestedTrade.trim())}
            className="w-full bg-amber text-navy font-semibold text-sm py-3 rounded-full disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add to directory"}
          </button>
        ) : null}
        <p className="text-[11px] text-muted text-center">
          Adding someone shares their number with us privately; it&apos;s only shown to signed-in users on their profile.
        </p>
      </form>
    </div>
  );
}
