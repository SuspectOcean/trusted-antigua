"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { Panel, ADMIN_NAV } from "@/components/AdminShell";
import { api } from "@/lib/data";

// Dashboard overview. Everything actionable lives in its own section; this
// page only shows what needs attention and where to go next.
function Stat({ label, value, href, urgent }) {
  const n = value === null || value === undefined ? "…" : String(value);
  const body = (
    <div className={`bg-surface border rounded-2xl p-3 h-full ${urgent && Number(value) > 0 ? "border-amber/50" : "border-white/10"}`}>
      <div className={`font-display font-semibold text-[22px] leading-none ${urgent && Number(value) > 0 ? "text-amber" : "text-ink"}`}>{n}</div>
      <div className="text-[12px] text-muted mt-1">{label}</div>
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export default function AdminDashboardPage() {
  const [o, setO] = useState(null);

  useEffect(() => { api.adminOverview().then(setO); }, []);

  const needsAttention = (Number(o?.open_reports) || 0) + (Number(o?.pending_claims) || 0);

  return (
    <AdminShell title="Dashboard" subtitle="Everything is managed from here. No database edits, no hidden pages.">
      <Panel title="Needs attention">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Open reports and disputes" value={o?.open_reports} href="/admin/reviews" urgent />
          <Stat label="Pending provider claims" value={o?.pending_claims} href="/admin/providers" urgent />
        </div>
        {o && needsAttention === 0 ? <p className="text-[12px] text-muted mt-2">Nothing waiting. The queue is clear.</p> : null}
      </Panel>

      <Panel title="Platform">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Providers listed" value={o?.providers} href="/admin/providers" />
          <Stat label="Reviews published" value={o?.reviews} href="/admin/reviews" />
          <Stat label="Registered users" value={o?.users} href="/admin/users" />
          <Stat label="Featured providers" value={o?.featured} href="/admin/featured" />
        </div>
      </Panel>

      <Panel title="Slots and content">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Active ad campaigns" value={o?.ad_campaigns} href="/admin/ads" />
          <Stat label="Live placements" value={o?.live_placements} href="/admin/ads" />
          <Stat label="Active house cards" value={o?.house_cards} href="/admin/house" />
        </div>
        <p className="text-[12px] text-muted mt-2">Adverts are isolated from all platform data. House content fills any slot with no live advert.</p>
      </Panel>

      <Panel title="All sections">
        <div className="grid grid-cols-2 gap-2">
          {ADMIN_NAV.filter((n) => n.href !== "/admin").map((n) => (
            <Link key={n.href} href={n.href} className="bg-surface2 border border-white/10 rounded-xl p-2.5 text-[13px] text-ink">
              <span className="mr-1.5">{n.icon}</span>{n.label}
            </Link>
          ))}
        </div>
      </Panel>

      {o === null ? <p className="text-[12px] text-muted mt-4">If the counters stay blank, the admin functions may not be applied to this database yet.</p> : null}
    </AdminShell>
  );
}
