"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/data";

// Curated house content shown when a slot has no live advert. These are OUR
// messages, not adverts, so the reserved space is never empty or ugly.
const HOUSE = [
  { emoji: "🤝", title: "How Trusted Antigua works", blurb: "Real reviews from real residents. Providers can never edit their own ratings.", href: "/guidelines" },
  { emoji: "⭐", title: "Recommend a provider", blurb: "Know someone reliable? Vouch for them in about 20 seconds.", href: "/recommend" },
  { emoji: "🌱", title: "Become a founding supporter", blurb: "Back the island's trusted directory. Details before public launch.", href: null },
  { emoji: "🛟", title: "Hire safely", blurb: "Agree a price up front and keep a record of the work done.", href: null },
  { emoji: "🏝️", title: "Explore the island", blurb: "Tours, watersports and activities across Antigua & Barbuda.", href: "/find?group=tourism" },
  { emoji: "📣", title: "Feature your business", blurb: "This space supports local businesses and charities. Contact us to appear here.", href: null },
];

// Pick house cards so the left rail, right rail and mobile slot differ.
function pickHouse(slotKey, n) {
  const start = slotKey === "desktop-rail-right" ? 3 : slotKey === "mobile-inline" ? 5 : 0;
  const out = [];
  for (let i = 0; i < n; i++) out.push(HOUSE[(start + i) % HOUSE.length]);
  return out;
}

function HouseCard({ card }) {
  const inner = (
    <div className="bg-surface border border-white/10 rounded-2xl p-3 shadow-card">
      <div className="text-lg leading-none">{card.emoji}</div>
      <div className="mt-1 font-display font-semibold text-ink text-[13px] leading-tight">{card.title}</div>
      <div className="mt-1 text-[11px] text-muted leading-snug">{card.blurb}</div>
    </div>
  );
  return card.href ? <Link href={card.href} className="block active:scale-[.99] transition">{inner}</Link> : inner;
}

// Weighted-random pick among equal-top-priority creatives (rotation).
function pickAd(ads) {
  if (!ads || !ads.length) return null;
  const top = ads.filter((a) => a.priority === ads[0].priority);
  const total = top.reduce((s, a) => s + (a.weight || 1), 0);
  let r = Math.random() * total;
  for (const a of top) { r -= (a.weight || 1); if (r <= 0) return a; }
  return top[0];
}

// slotKey: an ad_slots.key. variant: "rail" (stacked) or "inline" (single banner).
export default function AdSlot({ slotKey, variant = "rail" }) {
  const [ads, setAds] = useState(null);
  useEffect(() => {
    let active = true;
    api.adsForSlot(slotKey).then((a) => { if (active) setAds(a); });
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

  // House content fallback (also shown while ads load, so the space is never empty).
  if (variant === "inline") {
    return <HouseCard card={pickHouse(slotKey, 1)[0]} />;
  }
  return (
    <div className="space-y-2.5">
      {pickHouse(slotKey, 2).map((c, i) => <HouseCard key={i} card={c} />)}
    </div>
  );
}
