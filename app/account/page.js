"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { AREAS, CAT } from "@/lib/categories";

export default function AccountPage() {
  const { user, profile, loading, openSignIn, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [area, setArea] = useState("");
  const [mine, setMine] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { if (profile) { setFirstName(profile.first_name || ""); setArea(profile.area || ""); } }, [profile]);

  useEffect(() => {
    if (!user) { setMine(null); return; }
    supabase.from("recommendations").select("*").eq("recommender_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setMine(data || []));
  }, [user]);

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>;

  if (!user) {
    return (
      <div className="pt-6">
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-amber/15 mx-auto flex items-center justify-center mb-3">
            <svg width="24" height="24" fill="none" stroke="#DD9048" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M12 11c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zM4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
          </div>
          <h1 className="text-lg font-bold text-ink">Your free profile</h1>
          <p className="text-[14px] text-slate2 mt-1">Sign in to contact tradespeople, see full ratings, and leave recommendations.</p>
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
      <h1 className="text-xl font-extrabold text-ink mb-3">Your account</h1>

      <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        {!editing ? (
          <>
            <div className="text-[13px] text-muted">You appear on recommendations as</div>
            <div className="text-ink font-semibold text-lg">{profile?.first_name} — {profile?.area}</div>
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

      <h2 className="font-bold text-ink mt-6 mb-2">My recommendations</h2>
      {mine === null ? (
        <div className="text-muted text-[13px]">Loading…</div>
      ) : mine.length === 0 ? (
        <div className="bg-surface border border-white/10 rounded-2xl p-4 text-[13px] text-slate2 shadow-card">You haven&apos;t recommended anyone yet. <Link href="/recommend" className="text-amber underline">Recommend someone</Link>.</div>
      ) : (
        <div className="space-y-2.5">
          {mine.map((r) => (
            <div key={r.id} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="text-[13px] text-slate2">{CAT[r.category_id]?.name || ""}</div>
                {r.would_hire_again ? <span className="text-[11px] text-ok font-semibold">👍 Would hire again</span> : null}
              </div>
              {r.reason ? <p className="text-[14px] text-ink mt-1">{r.reason}</p> : null}
            </div>
          ))}
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
