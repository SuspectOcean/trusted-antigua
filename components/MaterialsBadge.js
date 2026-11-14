import { materialsDisplay } from "@/lib/materials";

// Who supplies the materials, as a small neutral pill. Same colour for every
// state: this is information to plan around, not a mark for or against anyone.
// The source is always named so a provider's own statement is never mistaken
// for something customers confirmed.
export default function MaterialsBadge({ m, className = "" }) {
  const d = materialsDisplay(m);
  if (!d) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] bg-surface2 text-slate2 border border-white/10 px-2 py-0.5 rounded-full ${className}`}>
      {d.label}
      <span className="text-muted">· {d.sourceShort}</span>
    </span>
  );
}
