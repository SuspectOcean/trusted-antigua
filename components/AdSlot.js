"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/data";

// Renders one advertising slot.
//   1. A paid advert if one is live for this slot (clearly labelled "Sponsored").
//   2. Otherwise our own house content, which is data-driven (house_cards table)
//      and shares the same slot/priority shape as adverts.
// House cards are NOT hardcoded here so they can be managed in the admin UI and
// eventually rotate using the same weighting logic as paid adverts.

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Rotate through the priority-ordered list so every card gets airtime, with a
// per-slot offset so the left rail, right rail and mobile slot never match.
// (Weighted rotation matching the advert logic comes with the admin UI.)
function pickHouse(cards, n, slotKey) {
  if (!cards || !cards.length) return [];
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000)); // rotates every 10 minutes
  const start = (hashStr(slotKey) + bucket) % cards.length;
  const out = [];
  for (let i = 0; i < Math.min(n, cards.length); i++) out.push(cards[(start + i) % cards.length]);
  return out;
}

// Weighted-random pick among equal-top-priority creatives (advert rotation).
function pickAd(ads) {
  if (!ads || !ads.length) return null;
  const top = ads.filter((a) => a.priority === ads[0].priority);
  const total = top.reduce((s, a) => s + (a.weight || 1), 0);
  let r = Math.random() * total;
  for (const a of top) { r -= (a.weight || 1); if (r <= 0) return a; }
  return top[0];
}

function HouseCard({ card }) {
  const body = (
    <div className="bg-surface border border-white/10 rounded-2xl p-3 shadow-card">
      {card.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.image_url} alt="" className="w-full rounded-xl mb-2" loading="lazy" />
      ) : card.icon ? (
        <div className="text-lg leading-none">{card.icon}</div>
      ) : null}
      <div className="mt-1 font-display font-semibold text-ink text-[13px] leading-tight">{card.title}</div>
      {card.description ? <div className="mt-1 text-[11px] text-muted leading-snug">{card.description}</div> : null}
      {card.href && card.cta_text ? (
        <div className="mt-2 text-[11px] text-amber font-semibold">{card.cta_text} ›</div>
      ) : null}
    </div>
  );
  return card.href ? <Link href={card.href} className="block active:scale-[.99] transition">{body}</Link> : body;
}

// slotKey: an ad_slots.key. variant: "rail" (stacked) or "inline" (single banner).
export default function AdSlot({ slotKey, variant = "rail" }) {
  const [ads, setAds] = useState(null);
  const [house, setHouse] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.adsForSlot(slotKey), api.houseCardsForSlot(slotKey)]).then(([a, h]) => {
      if (!active) return;
      setAds(a);
      setHouse(h);
    });
    return () => { active = false; };
  }, [slotKey]);

  const ad = pickAd(ads);

  if (ad) {
    // eslint-disable-next-line @next/next/no-img-element
    const img = <img src={ad.image_url} alt={ad.alt_text || ad.sponsor || "Advertisement"} className="w-full rounded-2xl border border-white/10" loading="lazy" />;
    return (
      <div>
        <div className="text-[9px] uppercase tracking-[0.12em] text-muted mb-1 text-center">Sponsored</div>
        {ad.click_url
          ? <a href={ad.click_url} target="_blank" rel="sponsored noopener noreferrer nofollow" className="block active:scale-[.99] transition">{img}</a>
          : img}
        {ad.sponsor ? <div className="text-[10px] text-muted mt-1 text-center truncate">{ad.sponsor}</div> : null}
      </div>
    );
  }

  const cards = pickHouse(house, variant === "inline" ? 1 : 2, slotKey);
  if (!cards.length) return null;

  if (variant === "inline") return <HouseCard card={cards[0]} />;
  return (
    <div className="space-y-2.5">
      {cards.map((c) => <HouseCard key={c.id} card={c} />)}
    </div>
  );
}
