import Link from "next/link";

// The "this space is available" card that sits INSIDE the search feed, in the
// same position and shape a sponsored card would occupy. Its job is to show a
// prospective advertiser exactly what they'd be buying, without publishing a
// false label to residents.
//
// Deliberately NOT marked "Sponsored": nobody has paid for it. The chip reads
// "Advertise here" and the border is dashed, so a reader can tell at a glance
// that this is our own house content, not a paying business. Like the sponsored
// card, it carries NO rating, review count or Trust Rating.
//
// Data comes from house_cards (house_cards_for_slot). Fields used:
//   icon        -> emoji shown in the avatar position
//   title       -> headline, sits where a provider's name would
//   description -> short supporting line
//   cta_text    -> call to action ("Get in touch")
//   href        -> where the tap goes (mailto:/https)

const isExternal = (href) =>
  !!href && (href.startsWith("mailto:") || href.startsWith("http") || href.startsWith("tel:"));

export default function HouseSlotCard({ card }) {
  if (!card) return null;
  const title = card.title || "Advertise your business here";
  const body = card.description || "";
  const cta = card.cta_text || "Get in touch";
  const href = card.href || "";

  const inner = (
    // Same rounded card as a listing, but a DASHED amber hairline so it reads as
    // available space rather than a booked advert.
    <div className="bg-surface border border-dashed border-amber/40 rounded-2xl p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl shrink-0 bg-amber/10 border border-dashed border-amber/40 flex items-center justify-center text-lg">
            {card.icon || "📣"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-semibold text-ink truncate">{title}</span>
              {/* Sits in the trust-badge position, but says exactly what this is.
                  Outline (not solid) so it never reads as a paid "Sponsored" chip. */}
              <span className="text-[9px] uppercase tracking-[0.12em] border border-amber/60 text-amber px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                Advertise here
              </span>
            </div>
            {body ? <div className="mt-1 text-[13px] text-slate2 leading-snug line-clamp-2">{body}</div> : null}
          </div>
        </div>
        {href ? (
          <div className="text-right shrink-0 self-center">
            <span className="text-[12px] text-amber font-semibold">{cta} ›</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!href) return inner;
  const cls = "block active:scale-[.99] transition";
  if (isExternal(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
  }
  return <Link href={href} className={cls}>{inner}</Link>;
}
