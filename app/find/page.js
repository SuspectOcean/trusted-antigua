"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GROUPS, GROUP, CAT, categoriesInGroup, groupOf } from "@/lib/categories";
import { api } from "@/lib/data";
import ProviderCard from "@/components/ProviderCard";
import AdSlot from "@/components/AdSlot";
import CategoryIcon from "@/components/CategoryIcon";

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
      <p className="text-[13px] text-muted mt-1">Know someone reliable? Be the first to review them.</p>
      <Link href="/recommend" className="inline-block mt-3 bg-amber text-navy font-semibold text-sm px-4 py-2 rounded-full">
        Write a review
      </Link>
    </div>
  );
}

// Never let a slow/failed network hang the UI: resolve to a fallback after `ms`.
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function FindInner() {
  const router = useRouter();
  const params = useSearchParams();
  const cat = params.get("cat") || "";
  const group = params.get("group") || "";
  const q = params.get("q") || "";

  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState({});
  const [input, setInput] = useState(q);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { setInput(q); }, [q]);

  useEffect(() => {
    let active = true;
    setRows(null);
    setError(false);
    Promise.all([
      withTimeout(api.providers({ category: cat, group, q }), 12000, null),
      withTimeout(api.recCounts(), 12000, {}),
    ])
      .then(([r, c]) => {
        if (!active) return;
        if (r === null) { setRows([]); setError(true); }
        else { setRows(r); setCounts(c || {}); }
      })
      .catch(() => { if (active) { setRows([]); setError(true); } });
    return () => { active = false; };
  }, [cat, group, q, reloadKey]);

  function onSearch(e) {
    e.preventDefault();
    router.push("/find?q=" + encodeURIComponent(input.trim()));
  }

  const retry = () => setReloadKey((k) => k + 1);

  const activeGroup = group || (cat ? groupOf(cat) : "");
  const title = cat ? CAT[cat]?.name || "" : group ? GROUP[group]?.name || "" : q ? `Results for "${q}"` : "All providers";

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

      {/* Level 1: groups */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {(cat || group) ? (
          <Link href="/find" className="whitespace-nowrap text-[13px] px-3 py-1.5 rounded-full bg-amber text-navy font-medium">✕ Clear</Link>
        ) : null}
        {GROUPS.map((g) => (
          <Link
            key={g.id}
            href={`/find?group=${g.id}`}
            className={`whitespace-nowrap inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full border ${activeGroup === g.id ? "bg-amber text-navy border-amber font-medium" : "bg-surface2 text-ink border-white/15"}`}
          >
            <span className="leading-none">{g.emoji}</span> {g.name}
          </Link>
        ))}
      </div>

      {/* Level 2: categories within the active group */}
      {activeGroup ? (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          <Link
            href={`/find?group=${activeGroup}`}
            className={`whitespace-nowrap text-[13px] px-3 py-1.5 rounded-full border ${!cat ? "bg-teal/20 text-teal border-teal/40 font-medium" : "bg-surface2 text-muted border-white/15"}`}
          >
            All {GROUP[activeGroup]?.name}
          </Link>
          {categoriesInGroup(activeGroup).map((c) => (
            <Link
              key={c.id}
              href={`/find?cat=${c.id}`}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full border ${cat === c.id ? "bg-amber text-navy border-amber font-medium" : "bg-surface2 text-ink border-white/15"}`}
            >
              <CategoryIcon id={c.id} className="w-3.5 h-3.5" /> {c.name}
            </Link>
          ))}
        </div>
      ) : null}

      <h2 className="font-display font-semibold text-[17px] text-ink mt-1 mb-2">
        {title} <span className="text-muted font-sans font-normal text-[14px]">{rows ? `(${rows.length})` : ""}</span>
      </h2>

      {rows === null ? (
        <SkeletonList />
      ) : error ? (
        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center shadow-card">
          <div className="text-3xl mb-2">📶</div>
          <p className="text-[14px] text-slate2">Couldn&apos;t load the directory.</p>
          <p className="text-[13px] text-muted mt-1">Check your connection and try again.</p>
          <button onClick={retry} className="inline-block mt-3 bg-amber text-navy font-semibold text-sm px-4 py-2 rounded-full">Retry</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.length ? rows.map((p, i) => (
            <div key={p.id}>
              <ProviderCard p={p} counts={counts} />
              {/* In-feed placement after the 5th result. Mobile only: desktop
                  already carries the rails, and a third unit would be too much. */}
              {i === 4 ? <div className="lg:hidden pt-2.5"><AdSlot slotKey="find-results" variant="inline" /></div> : null}
            </div>
          )) : <EmptyState />}
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
