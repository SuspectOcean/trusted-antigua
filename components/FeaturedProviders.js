"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/data";
import { CAT } from "@/lib/categories";
import CategoryIcon from "@/components/CategoryIcon";
import RatingBadge from "@/components/RatingBadge";
import { useAuth } from "@/components/AuthProvider";

// EDITORIAL, NOT ADVERTISING.
// Featured providers are chosen by our team. They live in their own table, are read
// through their own function, and are rendered here rather than through AdSlot, so a
// reader never has to wonder whether a highlight was bought. Featuring a provider
// changes nothing about their rating, reviews or ranking.
export default function FeaturedProviders({ limit = 3 }) {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [ratings, setRatings] = useState({});
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let active = true;
    api.featuredProviders(limit).then((r) => { if (active) setRows(r); });
    api.providerRatingsAll().then((m) => { if (active) setRatings(m); });
    api.recCounts().then((m) => { if (active) setCounts(m); });
    return () => { active = false; };
  }, [limit]);

  if (!rows || !rows.length) return null;

  return (
    <section className="mt-7">
      <div className="border-b-2 border-ink pb-1 flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="font-display font-bold uppercase text-[18px] text-ink">Picked by us</h2>
        <span className="text-[12px] text-muted">Nobody pays to be here.</span>
      </div>

      <div className="mt-2.5 space-y-2.5">
        {rows.map((p) => {
          const cat = CAT[p.category_id];
          const initial = (p.alias || p.name || "?").trim().charAt(0).toUpperCase();
          return (
            <Link
              key={p.provider_id}
              href={`/provider/${encodeURIComponent(p.provider_id)}`}
              className="block bg-surface border border-ink/15 rounded p-4 active:bg-surface2"
            >
              <div className="flex items-start gap-3">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt="" className="w-12 h-12 rounded-md object-cover border border-ink/10 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-surface2 border border-ink/10 flex items-center justify-center text-slate2 text-lg font-bold shrink-0">{initial}</div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold text-ink text-[19px] leading-tight">{p.alias || p.name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate2">
                    {cat ? <CategoryIcon id={cat.id} className="w-3.5 h-3.5 shrink-0 text-muted" /> : null}
                    <span>{cat ? cat.name : ""}{p.area ? ` · ${p.area}` : ""}</span>
                  </div>
                  <div className="mt-1">
                    <RatingBadge rating={ratings[p.provider_id]} count={counts[p.provider_id]?.count || 0} yes={counts[p.provider_id]?.yes || 0} gated={!user} />
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
