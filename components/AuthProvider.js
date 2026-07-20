"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AREAS } from "@/lib/categories";

// Flip these to true once the provider is configured in Supabase (see setup guides).
// Rule: a method that isn't configured is never rendered as a live button.
const ENABLED = { email: true, google: false, facebook: false, whatsapp: false };

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("member"); // owner | admin | moderator | member
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInMsg, setSignInMsg] = useState(null); // optional context message

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); setRole("member"); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data || null);
    // Claim any pending role invitation for this email (single-use, server-validated),
    // then read the resulting role. Works for every auth provider.
    try { await supabase.rpc("claim_role_invitations"); } catch { /* older DB: ignore */ }
    const { data: r } = await supabase.rpc("my_role");
    setRole(r || "member");
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = data?.session?.user || null;
      setUser(u);
      loadProfile(u?.id).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null;
      setUser(u);
      loadProfile(u?.id);
    });
    return () => { active = false; sub?.subscription?.unsubscribe(); };
  }, [loadProfile]);

  const openSignIn = useCallback((msg) => { setSignInMsg(msg || null); setShowSignIn(true); }, []);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); setProfile(null); }, []);
  const refreshProfile = useCallback(() => loadProfile(user?.id), [user, loadProfile]);

  const needsProfile = !!user && (!profile || !profile.first_name || !profile.area);
  const isAdmin = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  return (
    <AuthCtx.Provider value={{ user, profile, role, isAdmin, isOwner, loading, openSignIn, signOut, refreshProfile }}>
      {children}
      {showSignIn && !user ? <SignInSheet msg={signInMsg} onClose={() => setShowSignIn(false)} /> : null}
      {needsProfile ? <CompleteProfile user={user} onDone={refreshProfile} /> : null}
    </AuthCtx.Provider>
  );
}

/* ---------- Sign-in sheet ----------
   One Trusted Antigua account. Google/Facebook/WhatsApp/Email are just ways of
   proving who you are; the app decides whether you're new or returning. Only
   configured providers render — a method that doesn't work doesn't exist here. */
function SignInSheet({ msg, onClose }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ busy: false, sent: false, err: null });

  async function sendLink(e) {
    e.preventDefault();
    if (!email.trim()) { setState({ ...state, err: "Enter your email to continue." }); return; }
    setState({ busy: true, sent: false, err: null });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) setState({ busy: false, sent: false, err: "Something went wrong. Please try again." });
    else setState({ busy: false, sent: true, err: null });
  }

  async function oauth(provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
  }

  // Long-term priority order. Flipping a flag in ENABLED inserts the button in
  // the right place with no redesign. Google becomes primary the day it's on.
  const social = [
    { id: "google", label: "Continue with Google", on: ENABLED.google, go: () => oauth("google") },
    { id: "facebook", label: "Continue with Facebook", on: ENABLED.facebook, go: () => oauth("facebook") },
    // WhatsApp is phone-OTP, wired separately when configured.
  ].filter((p) => p.on);

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink text-lg">Welcome to Trusted Antigua</h3>
          <button onClick={onClose} className="text-muted text-xl leading-none px-2" aria-label="Close">×</button>
        </div>

        {state.sent ? (
          <div className="mt-4">
            <div className="bg-ok/15 rounded-xl p-4">
              <div className="text-[15px] text-ok font-semibold">Check your email</div>
              <p className="text-[13px] text-slate2 mt-1.5">
                We&apos;ve sent a secure link to <b className="text-ink">{email}</b>. Tap it and you&apos;re in.
              </p>
            </div>
            <p className="text-[12px] text-muted mt-3">
              This device will remember you. You&apos;ll stay signed in until you choose to log out.
            </p>
            <button onClick={() => setState({ busy: false, sent: false, err: null })} className="text-[12px] text-amber underline mt-2">
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-slate2 mt-1">
              {msg || "One account for everything on Trusted Antigua."}
            </p>

            {social.length ? (
              <div className="mt-4 space-y-2">
                {social.map((p) => (
                  <button key={p.id} onClick={p.go} className="w-full py-3 rounded-xl bg-amber text-navy text-[15px] font-semibold">
                    {p.label}
                  </button>
                ))}
                <div className="flex items-center gap-3 my-1"><div className="h-px bg-white/10 flex-1" /><span className="text-[11px] text-muted">or</span><div className="h-px bg-white/10 flex-1" /></div>
              </div>
            ) : null}

            <form onSubmit={sendLink} className={social.length ? "space-y-2" : "mt-4 space-y-2"}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="Your email address"
                className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-3 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30" />
              <button type="submit" disabled={state.busy}
                className={`w-full py-3 rounded-xl text-[15px] font-semibold disabled:opacity-60 ${social.length ? "border border-white/15 bg-surface2 text-ink" : "bg-amber text-navy"}`}>
                {state.busy ? "One moment…" : "Continue with Email"}
              </button>
              {state.err ? <p className="text-[13px] text-err">{state.err}</p> : null}
            </form>

            <p className="text-[12px] text-muted mt-3">
              If you&apos;ve been here before, this signs you straight into your account. If you&apos;re new, your free account is created automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Complete profile (first time) ---------- */
function CompleteProfile({ user, onDone }) {
  const [firstName, setFirstName] = useState("");
  const [area, setArea] = useState("");
  const [state, setState] = useState({ busy: false, err: null });

  useEffect(() => {
    const meta = user?.user_metadata || {};
    if (meta.name) setFirstName(String(meta.name).split(" ")[0]);
    else if (meta.full_name) setFirstName(String(meta.full_name).split(" ")[0]);
  }, [user]);

  async function save(e) {
    e.preventDefault();
    if (!firstName.trim() || !area) { setState({ busy: false, err: "Please add your first name and area." }); return; }
    setState({ busy: true, err: null });
    const { error } = await supabase.from("profiles").upsert({ id: user.id, first_name: firstName.trim(), area });
    if (error) setState({ busy: false, err: "Couldn't save. Please try again." });
    else onDone();
  }

  const preview = firstName.trim() && area ? `${firstName.trim()}, ${area}` : "…";

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center">
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-pop">
        <h3 className="font-display font-semibold text-ink text-lg">Almost there, set up your profile</h3>
        <p className="text-[13px] text-slate2 mt-1">Just two things. This is how you&apos;ll appear on recommendations.</p>
        <form onSubmit={save} className="mt-4 space-y-3">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">First name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Marcus"
              className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Area</label>
            <select value={area} onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-surface2 text-ink px-3 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30">
              <option value="">Choose your area…</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="text-[12px] text-muted">You&apos;ll appear as: <span className="text-slate2 font-medium">{preview}</span></div>
          <button type="submit" disabled={state.busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">
            {state.busy ? "Saving…" : "Finish"}
          </button>
          {state.err ? <p className="text-[13px] text-err text-center">{state.err}</p> : null}
        </form>
      </div>
    </div>
  );
}
