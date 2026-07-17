// Consistent line-icon set for trade categories — replaces raw emoji in custom UI.
// Same stroke language as BottomNav (1.7px, rounded caps) per the approved icon system;
// this is a real implementation of that decision rather than an emoji placeholder for it.
const PATHS = {
  electrical: <path d="M12.5 2 4 13.5h6.2L9.5 22 20 9.5h-6.4L12.5 2z" />,
  plumbing: <path d="M12 2.8c-3.3 4.6-5.6 8.2-5.6 11a5.6 5.6 0 0 0 11.2 0c0-2.8-2.3-6.4-5.6-11z" />,
  ac: (
    <g>
      <path d="M12 3v18M4.5 6.8l15 10.4M19.5 6.8l-15 10.4" />
      <path d="M12 3l-1.6 1.9M12 3l1.6 1.9M12 21l-1.6-1.9M12 21l1.6-1.9" />
    </g>
  ),
  masonry: (
    <g>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.2" />
      <path d="M3.5 10h17M3.5 15h17M9.3 4.5v5.5M15 10v5M9.3 15v4.5" />
    </g>
  ),
  gardening: (
    <g>
      <path d="M6 21c0-8 4.5-14 13-14-1 8.5-5 14-13 14z" />
      <path d="M6 21c1.5-4.5 4-7.5 7.5-9.8" />
    </g>
  ),
  cleaning: (
    <g>
      <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3z" />
      <path d="M5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </g>
  ),
};

// Generic tag icon for categories without a bespoke line-icon (the taxonomy is
// large; only the original trades have custom glyphs, the rest fall back here).
const FALLBACK = (
  <g>
    <path d="M20.6 12.6 12.6 20.6a1.5 1.5 0 0 1-2.1 0l-7-7A1.5 1.5 0 0 1 3 12.5V5a2 2 0 0 1 2-2h7.5a1.5 1.5 0 0 1 1.1.4l7 7a1.5 1.5 0 0 1 0 2.2z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </g>
);

export default function CategoryIcon({ id, className = "" }) {
  const p = PATHS[id] || FALLBACK;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {p}
    </svg>
  );
}
