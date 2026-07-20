"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

// One nav definition for the whole control centre. Add a section here and it
// appears everywhere; each section is its own route so it can grow independently.
export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/providers", label: "Providers", icon: "🧰" },
  { href: "/admin/reviews", label: "Reviews", icon: "📝" },
  { href: "/admin/featured", label: "Featured", icon: "⭐" },
  { href: "/admin/ads", label: "Advertisements", icon: "📣" },
  { href: "/admin/house", label: "House Content", icon: "🏠" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/invitations", label: "Invitations", icon: "✉️" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/settings", label: "Site Settings", icon: "⚙️" },
];

// Shared gate + chrome for every admin screen. Non-admins never see the interface.
export default function AdminShell({ title, subtitle, children }) {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname() || "";

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>;
  if (!user || !isAdmin) {
    return (
      <div className="py-16 text-center text-slate2">
        This area is for administrators only.
        <div className="mt-2"><Link href="/" className="text-amber underline">Go home</Link></div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h1 className="text-xl font-display font-semibold text-ink">{title || "Admin"}</h1>
      {subtitle ? <p className="text-[13px] text-muted mt-0.5">{subtitle}</p> : null}

      <nav className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {ADMIN_NAV.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full border ${
                active ? "bg-amber text-navy border-amber font-medium" : "bg-surface2 text-ink border-white/15"
              }`}
            >
              <span className="leading-none">{n.icon}</span> {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2">{children}</div>
      <div className="h-8" />
    </div>
  );
}

/* Small shared bits so every section looks the same. */
export function Flash({ msg }) {
  if (!msg) return null;
  return <div className="mt-3 bg-surface2 border border-white/10 rounded-xl p-2.5 text-[13px] text-slate2">{msg}</div>;
}

export function Panel({ title, action, children }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-semibold text-[16px] text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/15 bg-surface2 text-ink placeholder-muted px-3 py-2 text-[14px] focus:outline-none focus:border-amber";
