"use client";

import { useEffect } from "react";
import Link from "next/link";

// Catches a runtime error inside the app shell (layout still renders).
// Previously an error here produced a blank screen with no way forward.
//
// The error is logged to the console with a digest so it can be matched against
// Vercel's runtime logs. We deliberately do NOT show the raw message to the
// user: it can leak internals, and it means nothing to a resident.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[app error]", { digest: error?.digest, message: error?.message });
  }, [error]);

  return (
    <div className="pt-10 pb-16 text-center">
      <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
      <h1 className="text-xl font-display font-semibold text-ink">Something went wrong</h1>
      <p className="text-[14px] text-slate2 mt-2 max-w-sm mx-auto">
        This one is on us, not you. Nothing you were looking at has been changed or lost.
      </p>

      <div className="mt-6 flex flex-col gap-2 max-w-xs mx-auto">
        <button onClick={() => reset()} className="bg-amber text-navy font-semibold text-sm py-3 rounded-full">
          Try again
        </button>
        <Link href="/find" className="border border-white/15 text-ink font-semibold text-sm py-3 rounded-full">
          Back to the directory
        </Link>
      </div>

      <p className="text-[12px] text-muted mt-6">
        If it keeps happening,{" "}
        <a href="mailto:info@trustedantigua.com" className="text-amber font-semibold">tell us what you were doing</a>
        {error?.digest ? <> and quote reference <span className="text-slate2">{error.digest}</span></> : null}.
      </p>
    </div>
  );
}
