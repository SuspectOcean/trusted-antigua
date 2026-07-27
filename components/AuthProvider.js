"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AREAS } from "@/lib/categories";

// Flip these to true once the provider is configured in Supabase (see setup guides).
// Rule: a method that isn't configured is never rendered as a live button.
const ENABLED = { email: true, google: true, facebook: false, whatsapp: false };

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("member"); // owner | admin | moderator | member
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInMsg, setSignInMsg] = useState(null); // optional context message
  const [recovery, setRecovery] = useState(false); // password-reset link opened

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
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
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
      {recovery ? <SetPasswordSheet onDone={() => setRecovery(false)} /> : null}
      {needsProfile && !recovery ? <CompleteProfile user={user} onDone={refreshProfile} /> : null}
    </AuthCtx.Provider>
  );
}

/* ---------- Sign-in sheet ----------
   Email + password is the baseline: sign up once (with a one-time confirmation
   email), then sign in with your password — no email round-trip per login, and
   the device keeps you signed in. Google (and, later, passkeys) sit on top as
   faster options; a method that isn't configured is never rendered. */
function SignInSheet({ msg, onClose }) {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState(null);

  const origin = typeof window !== "undefined" ? window.location.origin : undefined;
  const reset = () => { setErr(null); setInfo(null); };

  async function submit(e) {
    e.preventDefault();
    reset();
    const mail = email.trim();
    if (!mail) { setErr("Enter your email."); return; }

    if (mode === "forgot") {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: origin });
      setBusy(false);
      if (error) setErr("Couldn't send the reset email. Please try again.");
      else { setInfo("Check your email for a link to set a new password."); setMode("signin"); }
      return;
    }

    if (!password) { setErr("Enter your password."); return; }

    if (mode === "signup") {
      if (password.length < 6) { setErr("Use a password of at least 6 characters."); return; }
      setBusy(true);
      const { data, error } = await supabase.auth.signUp({ email: mail, password, options: { emailRedirectTo: origin } });
      setBusy(false);
      if (error) {
        setErr(/registered|already/i.test(error.message || "") ? "That email already has an account — sign in instead." : "Couldn't create your account. Please try again.");
      } else if (data.session) {
        onClose(); // email confirmation disabled — signed straight in
      } else {
        setInfo("Account created. Check your email to confirm it, then sign in with your password.");
        setMode("signin"); setPassword("");
      }
      return;
    }

    // signin
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
    setBusy(false);
    if (error) {
      if (/confirm/i.test(error.message || "")) setErr("Please confirm your email first — check your inbox for the confirmation link.");
      else setErr("Wrong email or password. Try again, or reset your password below.");
    } else onClose(); // onAuthStateChange updates the app immediately, in this context
  }

  async function oauth(provider) {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: origin } });
  }
  const social = [
    { id: "google", label: "Continue with Google", on: ENABLED.google, go: () => oauth("google") },
    { id: "facebook", label: "Continue with Facebook", on: ENABLED.facebook, go: () => oauth("facebook") },
  ].filter((p) => p.on);

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome to Trusted Antigua";
  const cta = busy ? "One moment…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in";

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted text-xl leading-none px-2" aria-label="Close">×</button>
        </div>

        <p className="text-[13px] text-slate2 mt-1">
          {mode === "forgot" ? "We'll email you a link to choose a new password." : (msg || "One account for everything on Trusted Antigua.")}
        </p>

        {social.length ? (
          <div className="mt-4 space-y-2">
            {social.map((p) => (
              <button key={p.id} onClick={p.go} className="w-full py-3 rounded-xl bg-amber text-navy text-[15px] font-semibold">{p.label}</button>
            ))}
            <div className="flex items-center gap-3 my-1"><div className="h-px bg-white/10 flex-1" /><span className="text-[11px] text-muted">or</span><div className="h-px bg-white/10 flex-1" /></div>
          </div>
        ) : null}

        <form onSubmit={submit} className={social.length ? "space-y-2" : "mt-4 space-y-2"}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="Your email address"
            className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-3 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30" />
          {mode !== "forgot" ? (
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Create a password (6+ characters)" : "Password"}
              className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-3 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30" />
          ) : null}
          <button type="submit" disabled={busy} className="w-full py-3 rounded-xl bg-amber text-navy text-[15px] font-semibold disabled:opacity-60">{cta}</button>
          {err ? <p className="text-[13px] text-err">{err}</p> : null}
          {info ? <p className="text-[13px] text-ok">{info}</p> : null}
        </form>

        {mode === "signin" ? (
          <div className="mt-3 flex items-center justify-between text-[12px]">
            <button type="button" onClick={() => { setMode("signup"); reset(); }} className="text-amber underline font-semibold">Create an account</button>
            <button type="button" onClick={() => { setMode("forgot"); reset(); }} className="text-muted underline">Forgot password?</button>
          </div>
        ) : (
          <button type="button" onClick={() => { setMode("signin"); reset(); }} className="mt-3 text-[12px] text-amber underline">‹ Back to sign in</button>
        )}

        <p className="text-[12px] text-muted mt-3">This device will remember you — you&apos;ll stay signed in until you choose to log out.</p>
      </div>
    </div>
  );
}

/* ---------- Set a new password (after a reset link) ---------- */
function SetPasswordSheet({ onDone }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  async function save(e) {
    e.preventDefault();
    if (password.length < 6) { setErr("Use a password of at least 6 characters."); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr("Couldn't update your password. Please try again.");
    else onDone();
  }
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center">
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-pop">
        <h3 className="font-display font-semibold text-ink text-lg">Set a new password</h3>
        <p className="text-[13px] text-slate2 mt-1">Choose a new password for your account.</p>
        <form onSubmit={save} className="mt-4 space-y-3">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="New password (6+ characters)"
            className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-3 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30" />
          <button type="submit" disabled={busy} className="w-full bg-amber text-navy font-bold py-3 rounded-full text-[15px] disabled:opacity-60">{busy ? "Saving…" : "Save password"}</button>
          {err ? <p className="text-[13px] text-err text-center">{err}</p> : null}
        </form>
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
