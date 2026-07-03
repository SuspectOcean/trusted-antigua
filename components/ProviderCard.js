import Link from "next/link";
import { CAT } from "@/lib/categories";
import { pct } from "@/lib/helpers";

export default function ProviderCard({ p, counts }) {
  const c = counts[p.id] || { count: 0, yes: 0 };
  const cat = CAT[p.category_id];
  const wha = pct(c.yes, c.count);
  return (
    <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="block bg-white rounded-2xl p-4 card-shadow active:scale-[.99] transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-navy truncate">{p.alias || p.name}</div>
          {p.alias ? <div className="text-xs text-ink/50 truncate">{p.name}</div> : null}
          <div className="mt-1 text-[13px] text-ink/70">
            {cat ? `${cat.emoji} ${cat.name}` : ""}
            {p.area ? ` · ${p.area}` : ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[15px] font-bold text-teal">{c.count}</div>
          <div className="text-[10px] uppercase tracking-wide text-ink/50">rec{c.count === 1 ? "" : "s"}</div>
        </div>
      </div>
      {c.count ? (
        <div className="mt-2 flex items-center gap-1.5 text-[12px]">
          <span className="text-green-700">👍 {wha}% would hire again</span>
        </div>
      ) : (
        <div className="mt-2 text-[12px] text-ink/40">New — no recommendations yet</div>
      )}
    </Link>
  );
}
