"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, CAT } from "@/lib/categories";
import { api } from "@/lib/data";
import ProviderCard from "@/components/ProviderCard";

function SkeletonList() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
          <div className="skel h-4 w-1/2" />
          <div className="skel h-3 w-1/3 mt-2" />
          <div className="skel h-3 w-2/5 mt-3" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
      <div className="text-3xl mb-2">🔍</div>
      <p className="text-[14px] text-slate2">No providers listed here yet.</p>
      <p className="text-[13px] text-muted mt-1">Know someone reliable? Be the first to recommend them.</p>
      <Link href="/recommend" className="inline-block mt-3 bg-amber text-navy font-semibold text-sm px-4 py-2 rounded-full">
        Recommend someone
      </Link>
    </div>
  );
}

function FindInner() {
  const router = useRouter();
  const params = useSearchParams();
  const cat = params.get("cat") || "";
  const q = params.get("q") || "";

  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState({});
  const [input, setInput] = useState(q);

  useEffect(() => { setInput(q); }, [q]);

  useEffect(() => {
    let active = true;
    setRows(null);
    Promise.all([api.providers({ category: cat, q }), api.recCounts()]).then(([r, c]) => {
      if (active) { setRows(r); setCounts(c); }
    });
    return () => { active = false; };
  }, [cat, q]);

  function onSearch(e) {
    e.preventDefault();
    router.push("/find?q=" + encodeURIComponent(input.trim()));
  }

  const title = cat ? `${CAT[cat]?.emoji || ""} ${CAT[cat]?.name || ""}` : q ? `Results for "${q}"` : "All providers";

  return (
    <>
      <form onSubmit={onSearch} className="relative mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="search"
          placeholder="Search name, trade or area"
          className="w-full rounded-full border border-white/15 bg-surface2 text-ink placeholder-muted pl-11 pr-4 py-2.5 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {cat ? (
          <Link href="/find" className="whitespace-nowrap text-[13px] px-3 py-1.5 rounded-full bg-amber text-navy font-medium">✕ Clear</Link>
        ) : null}
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/find?cat=${c.id}`}
            className={`whitespace-nowrap text-[13px] px-3 py-1.5 rounded-full border ${cat === c.id ? "bg-amber text-navy border-amber font-medium" : "bg-surface2 text-ink border-white/15"}`}
          >
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      <h2 className="font-bold text-ink mt-1 mb-2">
        {title} <span className="text-muted font-normal">{rows ? `(${rows.length})` : ""}</span>
      </h2>

      {rows === null ? (
        <SkeletonList />
      ) : (
        <div className="space-y-2.5">
          {rows.length ? rows.map((p) => <ProviderCard key={p.id} p={p} counts={counts} />) : <EmptyState />}
        </div>
      )}
      <div className="h-4" />
    </>
  );
}

export default function FindPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <FindInner />
    </Suspense>
  );
}
