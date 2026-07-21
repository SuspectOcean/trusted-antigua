"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GROUPS } from "@/lib/categories";
import FeaturedProviders from "@/components/FeaturedProviders";

// Real Antiguan phrasing for what people actually type — not "e.g. electrician".
// Grounds the search in how the island talks, and doubles as quiet proof the
// search understands slang before you've typed a word.
const SEARCH_EXAMPLES = ["current man", "AC man", "leak fix", "mason", "gardener", "deep clean"];

const [featured, ...rest] = GROUPS;

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setExampleIdx((i) => (i + 1) % SEARCH_EXAMPLES.length), 2600);
    return () => clearInterval(t);
  }, []);

  function onSearch(e) {
    e.preventDefault();
    router.push("/find?q=" + encodeURIComponent(q.trim()));
  }

  return (
    <>
      <section className="pt-4 pb-5">
        {/* Plain statement of place, not a trust seal. An unexplained "verified" badge on a
            young domain reads as a fake credential to both people and phishing classifiers. */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">Antigua &amp; Barbuda</div>
        <h1 className="mt-2 text-ink leading-[1.05] tracking-[-.01em]">
          <span className="block font-display font-semibold text-[30px]">Find tradespeople</span>
          <span className="block font-display italic font-medium text-[36px] text-amber -mt-0.5">you can trust.</span>
        </h1>
        <p className="mt-3 text-[14px] text-slate2 max-w-[42ch]">
          Honest recommendations from real residents, so you know who&apos;s reliable before you spend a cent.
        </p>
      </section>

      <form onSubmit={onSearch} className="relative mb-7">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          inputMode="search"
          placeholder={`Try "${SEARCH_EXAMPLES[exampleIdx]}"`}
          className="w-full rounded-full border border-white/15 bg-surface2 text-ink placeholder-muted pl-11 pr-4 py-3 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
      </form>

      <h2 className="font-display font-semibold text-[17px] text-ink mb-2.5">Browse by category</h2>

      {/* Asymmetric: one wide entry point, then a tighter grid, not identical boxes. */}
      <Link
        href={`/find?group=${featured.id}`}
        className="block bg-surface border border-white/10 rounded-2xl p-4 shadow-card flex items-center gap-4 active:scale-[.99] transition mb-2.5"
      >
        <span className="inline-flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-amber/12 text-2xl leading-none">
          {featured.emoji}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-ink text-[15px] leading-tight">{featured.name}</span>
          <span className="block text-[12px] text-muted">{featured.blurb}</span>
        </span>
        <span className="ml-auto text-amber text-lg shrink-0">›</span>
      </Link>

      <div className="grid grid-cols-2 gap-2.5">
        {rest.map((c, i) => (
          <Link
            key={c.id}
            href={`/find?group=${c.id}`}
            className={`bg-surface border border-white/10 rounded-2xl p-3 shadow-card flex items-center gap-3 active:scale-[.99] transition ${
              i === rest.length - 1 && rest.length % 2 === 1 ? "col-span-2" : ""
            }`}
          >
            <span className="inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-amber/12 text-xl leading-none">
              {c.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink text-[14px] leading-tight">{c.name}</span>
              <span className="block text-[11px] text-muted truncate">{c.blurb}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Editorial highlights. Separate system from advertising, never "Sponsored". */}
      <FeaturedProviders limit={3} />

      {/* The one bold moment on the page — inverted amber panel, not another dark card. */}
      <div className="mt-7 bg-amber rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full border-2 border-navy/15" aria-hidden="true" />
        <h3 className="font-display font-semibold text-navy text-[19px] relative">Know someone good?</h3>
        <p className="text-[13px] text-navy/80 mt-1 relative max-w-[36ch]">
          Recommending a tradesperson takes 20 seconds and helps your whole community spend wisely.
        </p>
        <Link href="/recommend" className="inline-block mt-3 bg-navy text-ink font-semibold text-sm px-4 py-2 rounded-full relative">
          Recommend someone
        </Link>
      </div>

      {/* No card chrome here on purpose — a colophon, not another tile. */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <h3 className="font-semibold text-ink text-[13px] uppercase tracking-wide text-muted">What is Trusted Antigua?</h3>
        <p className="text-[13px] text-slate2 mt-1.5 leading-relaxed">
          A simple, community-built register of honest, reliable service providers across Antigua &amp; Barbuda.
          Recommendations are public. Concerns are shared privately with our team for review; we never post public attacks on anyone.
        </p>
        <Link href="/about" className="inline-block mt-2 text-[13px] text-amber font-semibold">More about Trusted Antigua ›</Link>
      </div>

      <div className="h-4" />
    </>
  );
}
