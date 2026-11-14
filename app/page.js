"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GROUPS, CAT, groupOf } from "@/lib/categories";
import { api } from "@/lib/data";
import FeaturedProviders from "@/components/FeaturedProviders";

// Real Antiguan phrasing for what people actually type.
const SEARCH_EXAMPLES = ["current man", "AC man", "leak fix", "mason", "gardener", "deep clean"];

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);
  // Category ids that have at least one provider. null = not loaded yet.
  const [populated, setPopulated] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setExampleIdx((i) => (i + 1) % SEARCH_EXAMPLES.length), 2600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    api.populatedCategories().then((cats) => { if (active) setPopulated(cats || []); });
    return () => { active = false; };
  }, []);

  // Only groups with at least one listing are shown. Until the list loads (or
  // if it fails) every group shows, so nothing flashes or vanishes.
  const populatedGroups = new Set((populated || []).map((c) => groupOf(c)).filter(Boolean));
  const visible = populatedGroups.size ? GROUPS.filter((g) => populatedGroups.has(g.id)) : GROUPS;
  // Under each group, name the trades actually listed in it, not a slogan.
  const tradesIn = (gid) => (populated || []).filter((c) => groupOf(c) === gid).map((c) => CAT[c]?.name).filter(Boolean);

  function onSearch(e) {
    e.preventDefault();
    router.push("/find?q=" + encodeURIComponent(q.trim()));
  }

  return (
    <>
      <section className="pt-5 pb-5">
        <h1 className="font-display font-bold text-[34px] leading-[1.02] text-ink uppercase tracking-[0.01em]">
          Who do people<br />here call?
        </h1>
        <p className="mt-3 text-[15px] text-slate2 max-w-[40ch]">
          Electricians, plumbers, masons, AC men and more, reviewed by people in Antigua who have hired them.
        </p>
      </section>

      <form onSubmit={onSearch} className="relative mb-7">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          inputMode="search"
          aria-label="Search for a tradesperson"
          placeholder={`Try "${SEARCH_EXAMPLES[exampleIdx]}"`}
          className="w-full rounded border-2 border-ink bg-surface text-ink placeholder-muted pl-11 pr-4 py-3 text-[16px] focus:outline-none focus:border-amber"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-ink" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
      </form>

      <h2 className="font-display font-bold uppercase text-[18px] text-ink border-b-2 border-ink pb-1">Browse</h2>
      <ul className="divide-y divide-ink/15 border-b border-ink/15 mb-2">
        {visible.map((g) => {
          const trades = tradesIn(g.id);
          return (
            <li key={g.id}>
              <Link href={`/find?group=${g.id}`} className="flex items-center gap-3 py-3 active:bg-surface2">
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink text-[16px] leading-tight">{g.name}</span>
                  <span className="block text-[13px] text-muted truncate">
                    {trades.length ? trades.slice(0, 4).join(", ") + (trades.length > 4 ? " and more" : "") : g.blurb}
                  </span>
                </span>
                <span className="text-amber text-xl shrink-0" aria-hidden="true">›</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Editorial picks. Separate system from advertising, never "Sponsored". */}
      <FeaturedProviders limit={3} />

      <div className="mt-7 bg-surface border border-ink/15 border-l-4 border-l-flag rounded p-4">
        <h3 className="font-display font-bold uppercase text-ink text-[20px] leading-tight">Used someone good, or someone bad?</h3>
        <p className="text-[14px] text-slate2 mt-1 max-w-[38ch]">
          Write a review so the next person knows who to call.
        </p>
        <Link href="/recommend" className="inline-block mt-3 bg-amber text-navy font-bold text-sm px-4 py-2 rounded">
          Write a review
        </Link>
      </div>

      <div className="mt-6 pt-4 border-t border-ink/15">
        <h3 className="font-bold text-ink text-[14px]">About this site</h3>
        <p className="text-[14px] text-slate2 mt-1 leading-relaxed">
          Trusted Antigua is run from Antigua. Anyone can search. Reviews come from members with a real account,
          and tradespeople cannot edit or remove them. Private concerns go only to us and are never published.
        </p>
        <Link href="/about" className="inline-block mt-2 text-[14px] text-amber font-bold underline underline-offset-2">How it works</Link>
      </div>

      <div className="h-4" />
    </>
  );
}
