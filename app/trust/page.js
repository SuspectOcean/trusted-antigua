import Link from "next/link";

export const metadata = {
  title: "What the badges mean · Trusted Antigua",
  description:
    "What each Trusted Antigua badge means, how a provider gets one, and what a badge does not tell you.",
};

// An unexplained badge is worse than no badge: it implies vetting we may not
// have done. This page states plainly what each level does and does not mean.
// Only the levels the platform actually assigns are described here.

function Level({ chip, tone, title, means, notMeans }) {
  const tones = {
    slate: "bg-white/10 text-slate2 border-white/15",
    amber: "bg-amber/15 text-amber border-amber/40",
    none: "bg-transparent text-muted border-white/15",
  };
  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${tones[tone]}`}>
          {chip}
        </span>
        <span className="font-display font-semibold text-ink">{title}</span>
      </div>
      <p className="text-[13px] text-slate2 mt-2"><b className="text-ink">What it means:</b> {means}</p>
      <p className="text-[13px] text-muted mt-1.5"><b className="text-slate2">What it does not mean:</b> {notMeans}</p>
    </div>
  );
}

export default function TrustPage() {
  return (
    <div className="pt-2 pb-10">
      <h1 className="text-xl font-display font-semibold text-ink">What the badges mean</h1>
      <p className="text-[13px] text-slate2 mt-1.5 mb-5">
        A badge on Trusted Antigua describes <em>how a listing came to exist</em> — nothing more.
        It is never a judgement of how good someone is at their job. That comes from reviews,
        and reviews come only from the community.
      </p>

      <div className="space-y-3">
        <Level
          chip="No badge"
          tone="none"
          title="Listed"
          means="Someone in the community added this tradesperson so others could find them. Most listings start here."
          notMeans="It does not mean we have met them, checked them, or that they know they are listed."
        />
        <Level
          chip="Claimed"
          tone="slate"
          title="Claimed"
          means="The person or business has proved this profile is theirs and now manages their own description, photo and contact details."
          notMeans="It is not a quality check. Claiming proves ownership of the listing, not competence, insurance or licensing."
        />
        <Level
          chip="Verified Business"
          tone="amber"
          title="Verified Business"
          means="In addition to claiming the profile, the business has provided documentation to our team confirming it is a real, identifiable business."
          notMeans="It is not a licence check, an insurance check, a guarantee of workmanship, or a recommendation from us."
        />
      </div>

      <div className="mt-6 bg-surface2 border border-white/10 rounded-2xl p-4">
        <h2 className="font-display font-semibold text-ink text-[15px]">Three things that are always true</h2>
        <ul className="mt-2 space-y-2 text-[13px] text-slate2 list-disc pl-5">
          <li><b className="text-ink">Badges cannot be bought.</b> Not through advertising, not through any paid tier, not at any price.</li>
          <li><b className="text-ink">Advertising never affects ratings.</b> A sponsored card carries no rating at all, and paying to advertise changes nothing about a provider&apos;s score, reviews or position in search.</li>
          <li><b className="text-ink">A provider cannot review themselves</b>, and cannot edit, hide or delete a review left about them. They may post one public reply.</li>
        </ul>
      </div>

      <p className="text-[12px] text-muted mt-5">
        Further levels are planned as the platform grows. We will publish what each one requires
        before any provider is given it — a badge nobody can explain is worth nothing.
      </p>

      <p className="text-[13px] text-slate2 mt-5">
        See also our{" "}
        <Link href="/guidelines" className="text-amber font-semibold">review guidelines</Link>{" "}
        and how we handle{" "}
        <Link href="/about" className="text-amber font-semibold">reports and disputes</Link>.
      </p>
    </div>
  );
}
