import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE, LEGAL_EMAIL, CONTACT_FALLBACK } from "@/lib/site";

// Renders "«prefix» email@address." when a contact email exists,
// or the neutral pre-launch fallback sentence when it doesn't.
// One-line swap in lib/site.js activates every contact point at once.
export function ContactLine({ prefix }) {
  if (!LEGAL_EMAIL) return <>{CONTACT_FALLBACK}</>;
  return (
    <>
      {prefix}{" "}
      <a className="text-amber underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
    </>
  );
}

// Shared shell for legal/policy pages: consistent typography, effective date, cross-links.
export function LegalShell({ title, children }) {
  return (
    <div className="pt-2 pb-8">
      <h1 className="text-xl font-display font-semibold text-ink">{title}</h1>
      <p className="text-[12px] text-muted mt-1">Effective {LEGAL_EFFECTIVE_DATE}</p>
      <div className="mt-4 space-y-5">{children}</div>
      <div className="mt-8 pt-4 border-t border-white/10 text-[12px] text-muted">
        See also:{" "}
        <Link href="/privacy" className="text-amber underline">Privacy Policy</Link> ·{" "}
        <Link href="/terms" className="text-amber underline">Terms of Service</Link> ·{" "}
        <Link href="/guidelines" className="text-amber underline">Review Guidelines</Link>
      </div>
    </div>
  );
}

export function LSection({ title, children }) {
  return (
    <section>
      <h2 className="text-[15px] font-display font-semibold text-ink mb-1.5">{title}</h2>
      <div className="text-[14px] text-slate2 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
