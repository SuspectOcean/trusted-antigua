"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e) {
    e.preventDefault();
    router.push("/find?q=" + encodeURIComponent(q.trim()));
  }

  return (
    <>
      <section className="text-center pt-3 pb-5">
        <h1 className="text-[28px] font-extrabold text-ink leading-[1.15] tracking-[-.02em]">
          Find tradespeople
          <br />
          you can trust
        </h1>
        <p className="mt-2.5 text-[14px] text-slate2 max-w-[42ch] mx-auto">
          Honest recommendations from real Antigua &amp; Barbuda residents — so you know who&apos;s reliable before you spend.
        </p>
      </section>

      <form onSubmit={onSearch} className="relative mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          inputMode="search"
          placeholder="What do you need? e.g. electrician, AC man"
          className="w-full rounded-full border border-white/15 bg-surface2 text-ink placeholder-muted pl-11 pr-4 py-3 text-[15px] focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/30"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
      </form>

      <h2 className="font-bold text-ink mb-2.5">Browse by category</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/find?cat=${c.id}`}
            className="bg-surface border border-white/10 rounded-2xl p-3 shadow-card flex items-center gap-3 active:scale-[.99] transition"
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink text-[14px] leading-tight">{c.name}</span>
              <span className="block text-[11px] text-muted truncate">{c.blurb}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-7 bg-gradient-to-b from-surface2 to-surface border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold text-ink">Know someone good?</h3>
        <p className="text-[13px] text-slate2 mt-1">
          Recommending a tradesperson takes 20 seconds and helps your whole community spend wisely.
        </p>
        <Link href="/recommend" className="inline-block mt-3 bg-amber text-navy font-semibold text-sm px-4 py-2 rounded-full">
          Recommend someone
        </Link>
      </div>

      <div className="mt-6 bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold text-ink text-[15px]">What is Trusted Antigua?</h3>
        <p className="text-[13px] text-slate2 mt-1">
          A simple, community-built list of honest, reliable home-service providers across Antigua &amp; Barbuda.
          Recommendations are public. Concerns are shared privately with us for review — we never post public attacks on anyone.
        </p>
      </div>

      <div className="h-4" />
    </>
  );
}
