"use client";
import { useState } from "react";
import { TRUST, isClaimed, BADGE_EXPLAINER } from "@/lib/trust";

const TONES = {
  amber: "bg-amber/15 text-amber border-amber/30",
  teal: "bg-teal/15 text-teal border-teal/30",
  slate: "bg-white/5 text-slate2 border-white/15",
};

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// size: "sm" (cards) | "md" (profile). tappable adds the explainer on the profile.
export default function TrustBadge({ level, size = "sm", tappable = false }) {
  const [open, setOpen] = useState(false);
  if (!isClaimed(level)) return null;
  const t = TRUST[level];
  if (!t || !t.chip) return null;
  const tone = TONES[t.tone] || TONES.slate;
  const pad = size === "md" ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[11px]";
  const showCheck = t.tone !== "slate";

  const chip = (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${tone} ${pad}`}>
      {showCheck ? <Check /> : null}
      {t.chip}
    </span>
  );

  if (!tappable) return chip;

  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} className="align-middle">{chip}</button>
      {open ? (
        <span className="absolute left-0 top-full mt-1 z-20 w-60 rounded-xl border border-white/10 bg-surface2 text-slate2 text-[12px] p-2.5 shadow-pop">
          {BADGE_EXPLAINER}
        </span>
      ) : null}
    </span>
  );
}
