"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/data";
import { CAT } from "@/lib/categories";
import CategoryIcon from "@/components/CategoryIcon";

// EDITORIAL, NOT ADVERTISING.
// Featured providers are chosen by our team. They live in their own table, are read
// through their own function, and are rendered here rather than through AdSlot, so a
// reader never has to wonder whether a highlight was bought. Featuring a provider
// changes nothing about their rating, reviews or ranking.
export default function FeaturedProviders({ limit = 3 }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let active = true;
    api.featuredProviders(limit).then((r) => { if (active) setRows(r); });
    return () => { active = false; };
  }, [limit]);

  if (!rows || !rows.length) return null;

  return (
    <section className="mt-7">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="font-display font-semibold text-[17px] text-ink">Featured</h2>
        <span className="text-[11px] text-muted">Chosen by our team. Not paid placement.</span>
      </div>

      <div className="mt-2.5 space-y-2.5">
        {rows.map((p) => {
          const cat = CAT[p.category_id];
          const initial = (p.alias || p.name || "?").trim().charAt(0).toUpperCase();
          return (
            <Link
              key={p.provider_id}
              href={`/provider?id=${encodeURIComponent(p.provider_id)}`}
              className="block bg-surface border border-teal/30 rounded-2xl p-4 shadow-card active:scale-[.99] transition"
            >
              <div className="flex items-start gap-3">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-surface2 border border-white/10 flex items-center justify-center text-slate2 text-lg font-bold shrink-0">{initial}</div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold text-ink text-[15px] leading-tight">{p.alias || p.name}</span>
                    <span className="text-[10px] uppercase tracking-wide bg-teal/15 text-teal px-2 py-0.5 rounded-full">Featured</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate2">
                    {cat ? <CategoryIcon id={cat.id} className="w-3.5 h-3.5 shrink-0 text-muted" /> : null}
                    <span>{cat ? cat.name : ""}{p.area ? ` · ${p.area}` : ""}</span>
                  </div>
                  {p.headline ? <div className="mt-1 text-[13px] text-ink font-medium">{p.headline}</div> : null}
                  {p.note ? <p className="mt-0.5 text-[12px] text-muted leading-snug">{p.note}</p> : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
