"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/data";
import { AREAS, CAT } from "@/lib/categories";
import { TRUST } from "@/lib/trust";

export default function AccountPage() {
  const { user, profile, isAdmin, loading, openSignIn, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [area, setArea] = useState("");
  const [mine, setMine] = useState(null);
  const [delId, setDelId] = useState(null);
  const [managed, setManaged] = useState(null);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { if (profile) { setFirstName(profile.first_name || ""); setArea(profile.area || ""); } }, [profile]);

  useEffect(() => {
    if (!user) { setMine(null); setManaged(null); setPendingClaims([]); return; }
    api.myReviews(user.id).then(setMine).catch(() => setMine([]));
    api.myManagedProviders(user.id).then(setManaged);
    api.myClaims(user.id).then((cs) => setPendingClaims((cs || []).filter((c) => c.status === "pending")));
  }, [user]);

  async function removeMine(id) {
    try { await api.deleteMyReview(id); setMine((m) => (m || []).filter((x) => x.id !== id)); setDelId(null); }
    catch (e) { console.error(e); }
  }

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>;

  if (!user) {
    return (
      <div className="pt-6">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-amber/15 mx-auto flex items-center justify-center mb-3">
            <svg width="24" height="24" fill="none" stroke="#DD9048" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M12 11c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zM4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
          </div>
          <h1 className="text-lg font-display font-semibold text-ink">Your free profile</h1>
          <p className="text-[14px] text-slate2 mt-1">Sign in to contact tradespeople, see full ratings, and leave reviews.</p>
          <button onClick={() => openSignIn()} className="mt-4 bg-amber text-navy font-semibold px-5 py-2.5 rounded-full text-[15px]">Sign in / Create profile</button>
        </div>
      </div>
    );
  }

  async function save() {
    if (!firstName.trim() || !area) return;
    await supabase.from("profiles").upsert({ id: user.id, first_name: firstName.trim(), area });
    await refreshProfile();
    setEditing(false);
  }

  async function doDelete() {
    // Remove the user's profile + detach their recommendations, then sign out.
    await supabase.from("profiles").delete().eq("id", user.id);
    await signOut();
  }

  return (
    <div className="pt-2">
      <h1 className="text-xl font-display font-semibold text-ink mb-3">Your account</h1>

      <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        {!editing ? (
          <>
            <div className="text-[13px] text-muted">You appear on reviews as</div>
            <div className="text-ink font-display font-semibold text-lg">{profile?.first_name}, {profile?.area}</div>
            <div className="text-[13px] text-slate2 mt-2">{user.email || user.phone}</div>
            <button onClick={() => setEditing(true)} className="mt-3 text-[13px] text-amber font-semibold">Edit profile</button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-white/15 bg-surface2 text-ink px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Area</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-xl border border-white/15 bg-surface2 text-ink px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30">
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-full border border-white/15 text-ink text-[14px]">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-full bg-amber text-navy font-semibold text-[14px]">Save</button>
            </div>
          </div>
        )}
      </div>

      {isAdmin ? (
        <Link href="/admin" className="mt-4 block bg-surface2 border border-amber/30 rounded-2xl p-3 text-center text-[13px] text-amber font-semibold">
          Admin console · review claims ›
        </Link>
      ) : null}

      {(managed && managed.length) || pendingClaims.length ? (
        <>
          <h2 className="font-display font-semibold text-[17px] text-ink mt-6 mb-2">Profiles you manage</h2>
          <div className="space-y-2.5">
            {(managed || []).map((m) => (
              <Link key={m.id} href={`/manage?id=${encodeURIComponent(m.id)}`} className="block bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="font-display font-semibold text-ink">{m.alias || m.name}</div>
                  <span className="text-[11px] text-slate2">{TRUST[m.trust_level]?.label || m.trust_level}</span>
                </div>
                <div className="text-[12px] text-muted mt-0.5">{CAT[m.category_id]?.name || m.category_id} · Edit ›</div>
              </Link>
            ))}
            {pendingClaims.map((c) => (
              <div key={c.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                <div className="font-display font-semibold text-ink">{c.providers?.alias || c.providers?.name || "Provider"}</div>
                <div className="text-[12px] text-muted mt-0.5">⏳ Claim awaiting review</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <h2 className="font-display font-semibold text-[17px] text-ink mt-6 mb-2">My reviews</h2>
      {mine === null ? (
        <div className="text-muted text-[13px]">Loading…</div>
      ) : mine.length === 0 ? (
        <div className="bg-surface border border-white/10 rounded-2xl p-4 text-[13px] text-slate2 shadow-card">You haven&apos;t reviewed anyone yet. <Link href="/recommend" className="text-amber underline">Write a review</Link>.</div>
      ) : (
        <div className="space-y-2.5">
          {mine.map((r) => {
            const pv = r.providers || {};
            const nm = pv.alias || pv.name || "Provider";
            return (
              <div key={r.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="font-display font-semibold text-ink text-[15px]">{nm}</div>
                  {r.would_hire_again ? <span className="text-[11px] text-ok font-semibold">👍 Would hire again</span> : null}
                </div>
                <div className="text-[12px] text-muted">{CAT[pv.category_id]?.name || ""}</div>
                {r.reason ? <p className="text-[14px] text-slate2 mt-1">{r.reason}</p> : null}
                {delId === r.id ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[12px] text-err">Delete this review?</span>
                    <button onClick={() => removeMine(r.id)} className="text-[12px] font-semibold text-err">Yes, delete</button>
                    <button onClick={() => setDelId(null)} className="text-[12px] text-muted">Cancel</button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-4">
                    <Link href={`/recommend?pid=${encodeURIComponent(r.provider_id)}&pname=${encodeURIComponent(pv.name || "")}&cat=${pv.category_id || ""}`} className="text-[12px] text-amber font-semibold">Edit</Link>
                    <button onClick={() => setDelId(r.id)} className="text-[12px] text-muted">Delete</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 space-y-2">
        <button onClick={signOut} className="w-full py-3 rounded-full border border-white/15 text-ink font-semibold text-[14px]">Log out</button>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="w-full py-2 text-[12px] text-muted">Delete my account</button>
        ) : (
          <div className="bg-err/10 border border-err/30 rounded-xl p-3 text-center">
            <p className="text-[13px] text-ink">Delete your account and profile? This can&apos;t be undone.</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-full border border-white/15 text-ink text-[13px]">Keep</button>
              <button onClick={doDelete} className="flex-1 py-2 rounded-full bg-err text-white font-semibold text-[13px]">Delete</button>
            </div>
          </div>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
