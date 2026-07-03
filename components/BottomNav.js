"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ d, extra }) {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d={d} />
      {extra}
    </svg>
  );
}

export default function BottomNav() {
  const path = usePathname() || "/";
  const items = [
    { href: "/", label: "Home", active: path === "/", icon: <Icon d="M3 11l9-8 9 8M5 10v10h14V10" /> },
    { href: "/find", label: "Find", active: path.startsWith("/find") || path.startsWith("/provider"), icon: <Icon d="M21 21l-4-4" extra={<circle cx="11" cy="11" r="7" />} /> },
    { href: "/recommend", label: "Recommend", active: path.startsWith("/recommend"), icon: <Icon d="M12 5v14M5 12h14" /> },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-navy border-t border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-xl mx-auto grid grid-cols-3 text-center text-[11px]">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className={`py-2.5 flex flex-col items-center gap-0.5 ${it.active ? "text-amber font-semibold" : "text-slate2/70"}`}>
            {it.icon}
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
