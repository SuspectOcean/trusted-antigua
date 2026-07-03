"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CAT } from "@/lib/categories";
import { api } from "@/lib/data";
import { pct, waLink } from "@/lib/helpers";

const TAGS = [
  ["reliable", "Reliable"],
  ["punctual", "Punctual"],
  ["communication", "Good communication"],
  ["fair_price", "Fair price"],
];

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <svg className="spin text-teal" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
    </div>
  );
}

function RecCard({ r }) {
  const tags = TAGS.filter(([k]) => r[k]).map(([, l]) => (
    <span key={l} className="text-[11px] bg-teal/10 text-teal px-2 py-0.5 rounded-full">{l}</span>
  ));
  return (
    <div className="bg-white rounded-2xl p-4 card-shadow">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-navy">{r.recommender_display || "A resident"}</div>
        {r.would_hire_again ? <span className="text-[11px] text-green-700 font-semibold">👍 Would hire again</span> : null}
      </div>
      {r.reason ? <p className="text-[14px] text-ink/80 mt-1">{r.reason}</p> : null}
      {r.job_type ? <div className="text-[12px] text-ink/50 mt-1">Job: {r.job_type}</div> : null}
      {tags.length ? <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div> : null}
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-xl rounded-t-2xl sm:rounded-2xl p-4">
        <h3 className="font-bold text-navy">Share a private concern</h3>
        <p className="text-[12px] text-ink/60 mt-1">This goes only to our team for review. We never post public complaints about anyone. It helps us keep the list honest.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full mt-3 rounded-xl border border-black/10 px-3 py-2.5 text-[15px] bg-sand" placeholder="What happened?" />
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-black/10 text-[14px]">Cancel</button>
          <button onClick={send} className="flex-1 py-2.5 rounded-full bg-navy text-white font-semibold text-[14px]">Send privately</button>
        </div>
        {msg ? <p className={`text-center text-[13px] mt-2 ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p> : null}
      </div>
    </div>
  );
}

function ProviderInner() {
  const id = useSearchParams().get("id");
  const [p, setP] = useState(undefined);
  const [recs, setRecs] = useState([]);
  const [showWarn, setShowWarn] = useState(false);

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
  if (p === null) return <div className="py-16 text-center text-ink/60">Provider not found. <Link className="text-teal underline" href="/find">Back to directory</Link></div>;

  const count = recs.length;
  const yes = recs.filter((r) => r.would_hire_again).length;
  const wha = pct(yes, count);
  const cat = CAT[p.category_id];
  const tally = (k) => recs.filter((r) => r[k]).length;
  const summaryTags = TAGS.map(([k, label]) => {
    const n = tally(k);
    return n ? <span key={k} className="text-[12px] bg-teal/10 text-teal px-2.5 py-1 rounded-full">{label} · {n}</span> : null;
  }).filter(Boolean);
  const wa = waLink(p.contact);

  return (
    <>
      <Link href="/find" className="inline-flex items-center gap-1 text-[13px] text-ink/60 mb-3">‹ Back</Link>
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-navy leading-tight">{p.alias || p.name}</h1>
            {p.alias ? <div className="text-[13px] text-ink/50">{p.name}</div> : null}
            <div className="mt-1 text-[14px] text-ink/70">{cat ? `${cat.emoji} ${cat.name}` : ""}{p.area ? ` · ${p.area}` : ""}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-sand rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-teal">{count}</div>
            <div className="text-[10px] uppercase tracking-wide text-ink/50">recommendation{count === 1 ? "" : "s"}</div>
          </div>
          <div className="bg-sand rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-green-700">{count ? wha + "%" : "—"}</div>
            <div className="text-[10px] uppercase tracking-wide text-ink/50">would hire again</div>
          </div>
        </div>
        {summaryTags.length ? <div className="mt-3 flex flex-wrap gap-1.5">{summaryTags}</div> : null}
        <div className="mt-4 flex gap-2">
          {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-[#25D366] text-white font-semibold text-sm py-2.5 rounded-full">WhatsApp</a> : null}
          {p.contact ? <a href={`tel:${p.contact}`} className="flex-1 text-center bg-navy text-white font-semibold text-sm py-2.5 rounded-full">Call</a> : <span className="flex-1 text-center text-[13px] text-ink/40 py-2.5">No contact on file</span>}
        </div>
        <Link href={`/recommend?pid=${encodeURIComponent(p.id)}&pname=${encodeURIComponent(p.name)}&cat=${p.category_id}`} className="block text-center mt-2 text-[13px] text-teal font-semibold">+ Add your recommendation</Link>
      </div>

      <h2 className="font-bold text-navy mt-5 mb-2">Recommendations</h2>
      <div className="space-y-2.5">
        {count ? recs.map((r) => <RecCard key={r.id} r={r} />) : <div className="bg-white rounded-2xl p-5 text-center text-[13px] text-ink/60 card-shadow">No recommendations yet. If you&apos;ve hired them, be the first to vouch.</div>}
      </div>

      <button onClick={() => setShowWarn(true)} className="w-full mt-4 text-[12px] text-ink/45 py-2">Something wrong? Share a private concern ›</button>
      <div className="h-4" />
      {showWarn ? <WarningModal provider={p} onClose={() => setShowWarn(false)} /> : null}
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
