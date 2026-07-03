"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CAT } from "@/lib/categories";
import { api } from "@/lib/data";
import { pct } from "@/lib/helpers";

const TAGS = [
  ["reliable", "Reliable"],
  ["punctual", "Punctual"],
  ["communication", "Good communication"],
  ["fair_price", "Fair price"],
];

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <svg className="spin text-amber" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
    </div>
  );
}

function RecCard({ r }) {
  const tags = TAGS.filter(([k]) => r[k]).map(([, l]) => (
    <span key={l} className="text-[11px] bg-teal/15 text-teal px-2 py-0.5 rounded-full">{l}</span>
  ));
  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-ink">{r.recommender_display || "A resident"}</div>
        {r.would_hire_again ? <span className="text-[11px] text-ok font-semibold">👍 Would hire again</span> : null}
      </div>
      {r.reason ? <p className="text-[14px] text-slate2 mt-1">{r.reason}</p> : null}
      {r.job_type ? <div className="text-[12px] text-muted mt-1">Job: {r.job_type}</div> : null}
      {tags.length ? <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div> : null}
    </div>
  );
}

/* Sign-in gate shown when a logged-out user tries to reach contact details. */
function SignInGate({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-pop">
        <div className="w-11 h-11 rounded-full bg-amber/15 flex items-center justify-center mb-3">
          <svg width="22" height="22" fill="none" stroke="#DD9048" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 11c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zM4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
        </div>
        <h3 className="font-bold text-ink text-lg">Create a free profile</h3>
        <p className="text-[14px] text-slate2 mt-1">
          Create a free profile to contact trusted tradespeople and leave recommendations.
        </p>
        <p className="text-[12px] text-muted mt-2">Accounts are coming very soon.</p>
        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-full bg-amber text-navy font-semibold text-[14px]">Got it</button>
      </div>
    </div>
  );
}

function WarningModal({ provider, onClose }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState(null);
  async function send() {
    const t = text.trim();
    if (!t) { setMsg({ ok: false, text: "Please write a short note." }); return; }
    try {
      await api.addWarning({ provider_id: provider.id, provider_name: provider.name, warning: t });
      setMsg({ ok: true, text: "✅ Thank you — sent privately to our team." });
      setTimeout(onClose, 1400);
    } catch { setMsg({ ok: false, text: "Could not send. Please try again." }); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface border border-white/10 w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-4 shadow-pop">
        <h3 className="font-bold text-ink">Share a private concern</h3>
        <p className="text-[12px] text-muted mt-1">This goes only to our team for review. We never post public complaints about anyone. It helps us keep the list honest.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full mt-3 rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2.5 text-[15px]" placeholder="What happened?" />
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-white/15 text-ink text-[14px]">Cancel</button>
          <button onClick={send} className="flex-1 py-2.5 rounded-full bg-amber text-navy font-semibold text-[14px]">Send privately</button>
        </div>
        {msg ? <p className={`text-center text-[13px] mt-2 ${msg.ok ? "text-ok" : "text-err"}`}>{msg.text}</p> : null}
      </div>
    </div>
  );
}

function ProviderInner() {
  const id = useSearchParams().get("id");
  const [p, setP] = useState(undefined);
  const [recs, setRecs] = useState([]);
  const [showWarn, setShowWarn] = useState(false);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (!id) { setP(null); return; }
    let active = true;
    api.provider(id).then((prov) => {
      if (!active) return;
      setP(prov || null);
      if (prov) api.recommendations(id).then((r) => active && setRecs(r));
    });
    return () => { active = false; };
  }, [id]);

  if (p === undefined) return <Spinner />;
  if (p === null) return <div className="py-16 text-center text-slate2">Provider not found. <Link className="text-amber underline" href="/find">Back to directory</Link></div>;

  const count = recs.length;
  const yes = recs.filter((r) => r.would_hire_again).length;
  const wha = pct(yes, count);
  const cat = CAT[p.category_id];
  const tally = (k) => recs.filter((r) => r[k]).length;
  const summaryTags = TAGS.map(([k, label]) => {
    const n = tally(k);
    return n ? <span key={k} className="text-[12px] bg-teal/15 text-teal px-2.5 py-1 rounded-full">{label} · {n}</span> : null;
  }).filter(Boolean);

  return (
    <>
      <Link href="/find" className="inline-flex items-center gap-1 text-[13px] text-slate2 mb-3">‹ Back</Link>
      <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-ink leading-tight">{p.alias || p.name}</h1>
            {p.alias ? <div className="text-[13px] text-muted">{p.name}</div> : null}
            <div className="mt-1 text-[14px] text-slate2">{cat ? `${cat.emoji} ${cat.name}` : ""}{p.area ? ` · ${p.area}` : ""}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber">{count}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted">recommendation{count === 1 ? "" : "s"}</div>
          </div>
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-ok">{count ? wha + "%" : "—"}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted">would hire again</div>
          </div>
        </div>
        {summaryTags.length ? <div className="mt-3 flex flex-wrap gap-1.5">{summaryTags}</div> : null}

        {/* Contact gated behind sign-in — phone/WhatsApp are not sent to logged-out users */}
        <button onClick={() => setShowGate(true)} className="w-full mt-4 flex items-center justify-center gap-2 bg-amber text-navy font-semibold text-sm py-3 rounded-full">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Sign in to view contact details
        </button>

        <Link href={`/recommend?pid=${encodeURIComponent(p.id)}&pname=${encodeURIComponent(p.name)}&cat=${p.category_id}`} className="block text-center mt-2 text-[13px] text-amber font-semibold">+ Add your recommendation</Link>
      </div>

      <h2 className="font-bold text-ink mt-5 mb-2">Recommendations</h2>
      <div className="space-y-2.5">
        {count ? recs.map((r) => <RecCard key={r.id} r={r} />) : <div className="bg-surface border border-white/10 rounded-2xl p-5 text-center text-[13px] text-slate2 shadow-card">No recommendations yet. If you&apos;ve hired them, be the first to vouch.</div>}
      </div>

      <button onClick={() => setShowWarn(true)} className="w-full mt-4 text-[12px] text-muted py-2">Something wrong? Share a private concern ›</button>
      <div className="h-4" />
      {showWarn ? <WarningModal provider={p} onClose={() => setShowWarn(false)} /> : null}
      {showGate ? <SignInGate onClose={() => setShowGate(false)} /> : null}
    </>
  );
}

export default function ProviderPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProviderInner />
    </Suspense>
  );
}
