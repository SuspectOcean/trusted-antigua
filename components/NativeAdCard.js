import Link from "next/link";

// A sponsored card that sits INSIDE the search feed, shaped like a ProviderCard so
// it flows with the results — but deliberately marked "Sponsored" and carrying NO
// rating, review count or Trust Rating. Money can never buy the look of a good
// reputation: an advert borrows the feed's shape, never its earned signals.
//
// Data comes from the existing advert system (ads_for_slot). Fields used:
//   sponsor    -> business name
//   image_url  -> logo (shown as the avatar; falls back to an initial)
//   alt_text   -> short tagline
//   click_url  -> where a tap goes (wa.me / tel: / https). No tracking, no data shared.

const isExternal = (href) =>
  !!href && (href.startsWith("mailto:") || href.startsWith("http") || href.startsWith("tel:"));

function AdAvatar({ src, name }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/10" />;
  }
  return (
    <div className="w-11 h-11 rounded-xl shrink-0 bg-surface2 border border-white/10 flex items-center justify-center text-slate2 font-bold">
      {initial}
    </div>
  );
}

export default function NativeAdCard({ ad }) {
  if (!ad) return null;
  const name = ad.sponsor || "Advertiser";
  const tagline = ad.alt_text || "";
  const href = ad.click_url || "";

  const inner = (
    // Same rounded card as a listing, but an amber hairline so it reads as distinct.
    <div className="bg-surface border border-amber/30 rounded-2xl p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <AdAvatar src={ad.image_url} name={name} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-semibold text-ink truncate">{name}</span>
              {/* Stands in for the trust badge slot — but says exactly what this is. */}
              <span className="text-[9px] uppercase tracking-[0.12em] bg-amber text-navy px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                Sponsored
              </span>
            </div>
            {tagline ? <div className="mt-1 text-[13px] text-slate2 leading-snug line-clamp-2">{tagline}</div> : null}
          </div>
        </div>
        {href ? (
          <div className="text-right shrink-0 self-center">
            <span className="text-[12px] text-amber font-semibold">Contact ›</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!href) return inner;
  const cls = "block active:scale-[.99] transition";
  // External contact (WhatsApp/tel/site) is a plain anchor; rel marks it as an ad.
  if (isExternal(href)) {
    return <a href={href} target="_blank" rel="sponsored noopener noreferrer nofollow" className={cls}>{inner}</a>;
  }
  return <Link href={href} className={cls}>{inner}</Link>;
}
