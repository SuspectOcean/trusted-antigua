import Link from "next/link";
import { CAT } from "@/lib/categories";
import { pct } from "@/lib/helpers";
import TrustBadge from "@/components/TrustBadge";
import CategoryIcon from "@/components/CategoryIcon";

function Avatar({ src, name }) {
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

export default function ProviderCard({ p, counts }) {
  const c = counts[p.id] || { count: 0, yes: 0 };
  const cat = CAT[p.category_id];
  const wha = pct(c.yes, c.count);
  return (
    <Link href={`/provider?id=${encodeURIComponent(p.id)}`} className="block bg-surface border border-white/10 rounded-2xl p-4 shadow-card active:scale-[.99] transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar src={p.photo_url} name={p.alias || p.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-semibold text-ink truncate">{p.alias || p.name}</span>
              <TrustBadge level={p.trust_level} size="sm" />
            </div>
            {p.alias ? <div className="text-xs text-muted truncate">{p.name}</div> : null}
            <div className="mt-1 flex items-center gap-1 text-[13px] text-slate2">
              {cat ? <CategoryIcon id={cat.id} className="w-3.5 h-3.5 shrink-0 text-muted" /> : null}
              <span className="truncate">{cat ? cat.name : ""}{p.area ? ` · ${p.area}` : ""}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[15px] font-bold text-amber">{c.count}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted">review{c.count === 1 ? "" : "s"}</div>
        </div>
      </div>
      {c.count ? (
        <div className="mt-2 flex items-center gap-1.5 text-[12px]">
          <span className="text-ok font-medium">👍 {wha}% would hire again</span>
        </div>
      ) : (
        <div className="mt-2 text-[12px] text-muted">New — no recommendations yet</div>
      )}
    </Link>
  );
}
