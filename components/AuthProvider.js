"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AREAS } from "@/lib/categories";

// Flip these to true once the provider is configured in Supabase (see setup guides).
const ENABLED = { email: true, google: false, facebook: false, phone: false };

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInMsg, setSignInMsg] = useState(null); // optional context message

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); setIsAdmin(false); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data || null);
    const { data: adm } = await supabase.rpc("is_admin");
    setIsAdmin(!!adm);
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

  return (
    <AuthCtx.Provider value={{ user, profile, isAdmin, loading, openSignIn, signOut, refreshProfile }}>
      {children}
      {showSignIn && !user ? <SignInSheet msg={signInMsg} onClose={() => setShowSignIn(false)} /> : null}
      {needsProfile ? <CompleteProfile user={user} onDone={refreshProfile} /> : null}
    </AuthCtx.Provider>
  );
}

/* ---------- Sign-in sheet ---------- */
function SignInSheet({ msg, onClose }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ busy: false, sent: false, err: null });

  async function sendLink(e) {
    e.preventDefault();
    if (!email.trim()) { setState({ ...state, err: "Enter your email." }); return; }
    setState({ busy: true, sent: false, err: null });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) setState({ busy: false, sent: false, err: "Couldn't send the link. Please try again." });
    else setState({ busy: false, sent: true, err: null });
  }

  async function oauth(provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
  }

  const SoonBtn = ({ label, icon }) => (
    <button type="button" disabled className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-surface2/60 text-muted text-[14px] font-medium cursor-not-allowed">
      {icon}<span>{label}</span><span className="text-[10px] uppercase tracking-wide text-muted/80 ml-1">soon</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink text-lg">Create your free profile</h3>
          <button onClick={onClose} className="text-muted text-xl leading-none px-2">×</button>
        </div>
        <p className="text-[13px] text-slate2 mt-1">{msg || "Create a free profile to contact trusted tradespeople and leave recommendations."}</p>

        {state.sent ? (
          <div className="mt-4 bg-ok/15 text-ok rounded-xl p-4 text-[14px]">
            ✅ Check your inbox — we sent a sign-in link to <b>{email}</b>. Tap it to finish.
          </div>
        ) : (
          <>
            <form onSubmit={sendLink} className="mt-4 space-y-2">
              <label className="block text-[13px] font-semibold text-ink">Continue with email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" placeholder="you@example.com"
                className="w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-3 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30" />
              <button type="submit" disabled={state.busy} className="w-full bg-amber text-navy font-semibold py-3 rounded-xl text-[15px] disabled:opacity-60">
                {state.busy ? "Sending…" : "Email me a sign-in link"}
              </button>
              {state.err ? <p className="text-[13px] text-err">{state.err}</p> : null}
            </form>

            <div className="flex items-center gap-3 my-4"><div className="h-px bg-white/10 flex-1" /><span className="text-[11px] text-muted">or</span><div className="h-px bg-white/10 flex-1" /></div>

            <div className="space-y-2">
              {ENABLED.google
                ? <button onClick={() => oauth("google")} className="w-full py-3 rounded-xl border border-white/15 bg-surface2 text-ink text-[14px] font-medium">Continue with Google</button>
                : <SoonBtn label="Continue with Google" />}
              {ENABLED.facebook
                ? <button onClick={() => oauth("facebook")} className="w-full py-3 rounded-xl border border-white/15 bg-surface2 text-ink text-[14px] font-medium">Continue with Facebook</button>
                : <SoonBtn label="Continue with Facebook" />}
              {ENABLED.phone
                ? null
                : <SoonBtn label="Continue with phone" />}
            </div>
            <p className="text-[11px] text-muted mt-3">Google, Facebook and phone sign-in are being set up. Email works now.</p>
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

  const preview = firstName.trim() && area ? `${firstName.trim()} — ${area}` : "…";

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center">
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-pop">
        <h3 className="font-bold text-ink text-lg">Almost there — set up your profile</h3>
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
