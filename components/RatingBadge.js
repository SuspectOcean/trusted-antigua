import { pct } from "@/lib/helpers";

// Compact rating shown on cards, so people can judge before tapping in. Honest by
// design: the real ten-category Trust Rating when it exists, otherwise the legacy
// "would hire again" score, otherwise "New" — never a made-up number.
export default function RatingBadge({ rating, count = 0, yes = 0, gated = false, className = "" }) {
  if (gated) {
    return <span className={`inline-flex items-center gap-1 text-[11px] text-muted ${className}`}>🔒 Sign in to see rating</span>;
  }
  if (rating && rating.r10_count > 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-[12px] font-semibold text-amber ${className}`}>
        ★ {Number(rating.avg_out_of_10).toFixed(1)}
        <span className="text-muted font-normal">/10 · {rating.r10_count}</span>
      </span>
    );
  }
  if (count > 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-[12px] font-semibold text-ok ${className}`}>
        👍 {pct(yes, count)}%
        <span className="text-muted font-normal"> · {count} review{count === 1 ? "" : "s"}</span>
      </span>
    );
  }
  return <span className={`text-[11px] text-muted ${className}`}>New · no reviews yet</span>;
}
