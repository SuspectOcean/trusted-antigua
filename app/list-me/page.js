"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GROUPS, CAT, categoriesInGroup } from "@/lib/categories";
import { api } from "@/lib/data";
import { useAuth } from "@/components/AuthProvider";

// List YOURSELF as a provider.
//  - Dedupe on your number: if it's already in the directory (someone added you),
//    we don't duplicate — we send you to claim & tidy that listing.
//  - Otherwise we create a listing you own (claimed_by = you), which can carry a
//    primary trade plus secondary trades (captain + a few other things).
//  - You can list several distinct trades either as secondaries on one profile or
//    by listing yourself again for a genuinely separate profile.

const MAX_SECONDARY = 4;

function TradeSelect({ value, onChange, exclude = [], placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/15 bg-surface2 text-ink px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber"
    >
      <option value="">{placeholder}</option>
      {GROUPS.map((g) => {
        const cats = categoriesInGroup(g.id).filter((c) => !exclude.includes(c.id));
        return cats.length ? (
          <optgroup key={g.id} label={g.name}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </optgroup>
        ) : null;
      })}
    </select>
  );
}

export default function ListMePage() {
  const router = useRouter();
  const { user, profile, openSignIn, loading } = useAuth();

  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [phone, setPhone] = useState("");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState([]); // category ids
  const [addTrade, setAddTrade] = useState(""); // the "add another trade" picker
  const [area, setArea] = useState("");

  const [dupe, setDupe] = useState(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null); // { id }
  const debounce = useRef(null);

  // Prefill name + area from the member's profile.
  useEffect(() => {
    if (profile) {
      setName((n) => n || profile.first_name || "");
      setArea((a) => a || profile.area || "");
    }
  }, [profile]);

  // Live duplicate check on the number.
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

  function addSecondary(id) {
    if (!id) return;
    setSecondary((s) => (s.includes(id) || id === primary || s.length >= MAX_SECONDARY ? s : [...s, id]));
    setAddTrade("");
  }
  const removeSecondary = (id) => setSecondary((s) => s.filter((x) => x !== id));

  async function submit(e) {
    e.preventDefault();
    if (!user) { openSignIn("Sign in to list yourself as a provider."); return; }
    if (dupe) return; // guarded — we show the claim path instead
    setBusy(true); setErr(null);
    try {
      const res = await api.listSelfProvider({
        name: name.trim(),
        alias: alias.trim() || null,
        category_id: primary,
        secondary_categories: secondary.filter((c) => c !== primary),
        area: area.trim() || null,
        phone: phone.trim(),
      });
      if (!res) { setErr("Something went wrong. Please try again."); setBusy(false); return; }
      if (res.existing) {
        // Slipped past the live check — route to claim rather than duplicate.
        router.push(`/claim?id=${encodeURIComponent(res.provider_id)}`);
        return;
      }
      setDone({ id: res.provider_id });
    } catch (e2) {
      const key = String(e2?.message || "").match(/name_required|category_required|phone_required|not_authenticated/)?.[0];
      const map = {
        name_required: "Please enter your name.",
        category_required: "Please choose your main trade.",
        phone_required: "Please enter a valid phone number.",
        not_authenticated: "Please sign in first.",
      };
      setErr(map[key] || "Couldn't create your listing. Please try again.");
    } finally { setBusy(false); }
  }

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>;

  if (!user) {
    return (
      <div className="pt-6 text-center">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-card">
          <h1 className="text-lg font-display font-semibold text-ink">List yourself as a provider</h1>
          <p className="text-[14px] text-slate2 mt-1">Sign in first, then add your trade(s) so people can find and recommend you.</p>
          <button onClick={() => openSignIn("Sign in to list yourself as a provider.")} className="mt-4 bg-amber text-navy font-semibold px-5 py-2.5 rounded-full text-[15px]">Sign in</button>
        </div>
      </div>
    );
  }

  // Success: listing created and owned by the user.
  if (done) {
    return (
      <div className="pt-2 pb-8">
        <div className="bg-surface border border-white/10 rounded-2xl p-5 shadow-card text-center">
          <div className="text-3xl mb-1">✅</div>
          <h1 className="font-display font-semibold text-ink text-[18px]">You&apos;re listed on Trusted Antigua</h1>
          <p className="text-[13px] text-slate2 mt-1.5">
            Next, tidy up your profile — add a photo, a short description and your service areas.
          </p>
          <Link href={`/manage?id=${encodeURIComponent(done.id)}`} className="block mt-4 bg-amber text-navy font-semibold text-sm py-3 rounded-full">
            Tidy up my profile
          </Link>
          <Link href={`/provider/${done.id}`} className="block mt-2 text-[13px] text-amber font-semibold">View my public profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <Link href="/account" className="inline-flex items-center gap-1 text-[13px] text-slate2 mb-3">‹ Back</Link>
      <h1 className="text-xl font-display font-semibold text-ink">List yourself as a provider</h1>
      <p className="text-[13px] text-slate2 mt-1">
        Add your details so people can find and recommend you. We&apos;ll check your number isn&apos;t already listed.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-[12px] text-muted">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="e.g. Roscoe Bloomfield"
            className="w-full mt-1 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber" />
        </div>

        <div>
          <label className="text-[12px] text-muted">Business name <span className="text-muted/60">(optional)</span></label>
          <input value={alias} onChange={(e) => setAlias(e.target.value)} type="text" placeholder="e.g. Bloomfield Charters"
            className="w-full mt-1 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber" />
        </div>

        <div>
          <label className="text-[12px] text-muted">Your phone / WhatsApp</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="e.g. 464 1234"
            className={`w-full mt-1 rounded-xl border bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none ${dupe ? "border-amber" : "border-white/15 focus:border-amber"}`} />
          {checking ? <p className="text-[11px] text-muted mt-1">Checking if this number is already listed…</p> : null}
        </div>

        {/* Already listed → claim it instead of duplicating. */}
        {dupe ? (
          <div className="bg-surface border border-amber/40 rounded-2xl p-3">
            <div className="text-[12px] text-amber font-semibold">This number is already on Trusted Antigua</div>
            <div className="mt-1.5 font-display font-semibold text-ink">{dupe.alias || dupe.name}</div>
            <div className="text-[12px] text-slate2">
              {(CAT[dupe.category_id]?.name) || "Provider"}{dupe.area ? ` · ${dupe.area}` : ""}
            </div>
            <p className="text-[12px] text-slate2 mt-2">Looks like someone already added you. Claim it to take over and tidy it up.</p>
            <Link href={`/claim?id=${encodeURIComponent(dupe.provider_id)}`} className="block text-center mt-2 bg-amber text-navy font-semibold text-[13px] py-2.5 rounded-full">
              This is me — claim &amp; tidy it up
            </Link>
          </div>
        ) : null}

        {/* Trades: primary + secondary */}
        <div>
          <label className="text-[12px] text-muted">Your main trade</label>
          <div className="mt-1">
            <TradeSelect value={primary} onChange={(v) => { setPrimary(v); setSecondary((s) => s.filter((x) => x !== v)); }} placeholder="Choose your main trade…" />
          </div>
        </div>

        <div>
          <label className="text-[12px] text-muted">Other trades you offer <span className="text-muted/60">(optional)</span></label>
          {secondary.length ? (
            <div className="flex flex-wrap gap-2 mt-1.5">
              {secondary.map((id) => (
                <span key={id} className="inline-flex items-center gap-1.5 text-[13px] bg-teal/15 text-teal border border-teal/40 px-2.5 py-1 rounded-full">
                  {CAT[id]?.name || id}
                  <button type="button" onClick={() => removeSecondary(id)} className="text-teal/80 hover:text-teal" aria-label="Remove">✕</button>
                </span>
              ))}
            </div>
          ) : null}
          {secondary.length < MAX_SECONDARY ? (
            <div className="mt-1.5">
              <TradeSelect value={addTrade} onChange={addSecondary} exclude={[primary, ...secondary]} placeholder="＋ Add another trade…" />
            </div>
          ) : <p className="text-[11px] text-muted mt-1.5">That&apos;s the maximum extra trades for one profile. For anything else, list yourself again as a separate profile.</p>}
          <p className="text-[11px] text-muted mt-1">You&apos;ll show up in search under every trade you add.</p>
        </div>

        <div>
          <label className="text-[12px] text-muted">Area <span className="text-muted/60">(optional)</span></label>
          <input value={area} onChange={(e) => setArea(e.target.value)} type="text" placeholder="e.g. Jolly Harbour"
            className="w-full mt-1 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber" />
          <p className="text-[11px] text-muted mt-1">You can set detailed service areas after, when you tidy up your profile.</p>
        </div>

        {err ? <p className="text-[13px] text-err">{err}</p> : null}

        {!dupe ? (
          <button
            disabled={busy || !name.trim() || !phone.trim() || !primary || checking}
            className="w-full bg-amber text-navy font-semibold text-sm py-3 rounded-full disabled:opacity-50"
          >
            {busy ? "Listing…" : "List me as a provider"}
          </button>
        ) : null}
        <p className="text-[11px] text-muted text-center">
          Your rating and reviews always come from the community — you can&apos;t review your own profile.
        </p>
      </form>
    </div>
  );
}
