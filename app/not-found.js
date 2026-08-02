import Link from "next/link";

// Shown for any unknown URL. Without this, Next.js serves its own unstyled
// default page, which looks like a broken site rather than ours — a bad first
// impression for anyone arriving from a stale link or a mistyped address.
export const metadata = {
  title: "Page not found · Trusted Antigua",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="pt-10 pb-16 text-center">
      <div className="text-4xl mb-3" aria-hidden="true">🧭</div>
      <h1 className="text-xl font-display font-semibold text-ink">We couldn&apos;t find that page</h1>
      <p className="text-[14px] text-slate2 mt-2 max-w-sm mx-auto">
        The link may be out of date, or the page may have moved. Nothing is wrong with your account.
      </p>

      <div className="mt-6 flex flex-col gap-2 max-w-xs mx-auto">
        <Link href="/find" className="bg-amber text-navy font-semibold text-sm py-3 rounded-full">
          Find a tradesperson
        </Link>
        <Link href="/" className="border border-white/15 text-ink font-semibold text-sm py-3 rounded-full">
          Go to the home page
        </Link>
      </div>

      <p className="text-[12px] text-muted mt-6">
        Think this is a mistake?{" "}
        <a href="mailto:info@trustedantigua.com" className="text-amber font-semibold">Let us know</a>.
      </p>
    </div>
  );
}
