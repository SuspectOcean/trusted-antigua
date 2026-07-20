"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

// Header auth control. Logged out: an explicit Log in / Sign up button, never
// hidden behind an icon. Logged in: the account menu. Renders nothing while
// auth is still resolving so the header never flashes the wrong state.
export default function AccountMenu() {
  const { user, profile, isAdmin, loading, openSignIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (loading) return <div className="w-16" />;

  if (!user) {
    return (
      <button
        onClick={() => openSignIn()}
        className="text-xs border border-amber/70 text-amber font-semibold px-3 py-1.5 rounded-full hover:bg-amber/10"
      >
        Log in / Sign up
      </button>
    );
  }

  const name = profile?.first_name || "Account";

  function Item({ href, children, onClick, disabled }) {
    const cls = "block w-full text-left px-3 py-2 text-[13px] rounded-lg " +
      (disabled ? "text-muted cursor-not-allowed" : "text-ink hover:bg-surface2");
    if (disabled) return <span className={cls}>{children} <span className="text-[10px] uppercase tracking-wide">soon</span></span>;
    if (href) return <Link href={href} onClick={() => setOpen(false)} className={cls}>{children}</Link>;
    return <button onClick={onClick} className={cls}>{children}</button>;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs border border-white/15 text-ink font-medium pl-2 pr-2.5 py-1.5 rounded-full hover:border-amber/50"
        aria-expanded={open}
      >
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber/20 text-amber text-[10px] font-semibold">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[72px] truncate">{name}</span>
        <span className="text-muted text-[9px]">▼</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-52 bg-surface border border-white/10 rounded-xl shadow-pop p-1.5 z-50">
          <Item href="/account">My Profile</Item>
          <Item href="/account#my-reviews">My Reviews</Item>
          <Item disabled>Saved Providers</Item>
          <Item disabled>Notifications</Item>
          {isAdmin ? (
            <>
              <div className="h-px bg-white/10 my-1" />
              <Item href="/admin">Admin Dashboard</Item>
            </>
          ) : null}
          <div className="h-px bg-white/10 my-1" />
          <Item onClick={async () => { setOpen(false); await signOut(); }}>Log out</Item>
        </div>
      ) : null}
    </div>
  );
}
