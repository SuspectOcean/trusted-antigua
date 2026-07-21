import { LegalShell, LSection, ContactLine } from "@/components/LegalPage";
import Link from "next/link";

export const metadata = {
  title: "About | Trusted Antigua",
  description:
    "What Trusted Antigua is, how our reviews work, and how we moderate. A community review platform for services across Antigua & Barbuda.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalShell title="About Trusted Antigua">
      <LSection title="What this is">
        <p>
          Trusted Antigua is a community review platform for services across Antigua &amp; Barbuda. Residents,
          businesses, visitors and property owners use it to find people who do good work, from electricians and
          plumbers to boat captains, mechanics, tutors and photographers.
        </p>
        <p>
          The idea is simple. Good tradespeople in Antigua are found by word of mouth, and that word of mouth
          currently lives in WhatsApp groups and conversations that disappear. This is a place to keep it, so the
          next person asking &ldquo;who do you use for…&rdquo; gets a real answer.
        </p>
      </LSection>

      <LSection title="How reviews work">
        <p>
          Anyone with a free account can review a provider they have actually used. Reviews score ten areas out of
          ten, covering quality, reliability, communication, punctuality, professionalism, knowledge, value for
          money, care and cleanliness, problem resolution and overall recommendation. Those ten scores produce a
          Trust Rating percentage and an average out of ten.
        </p>
        <p>
          Every score comes from a customer review. Nothing else moves it. Advertising, featured placement,
          claiming a profile and any commercial relationship with us have no effect whatsoever on a provider&rsquo;s
          rating. Providers cannot edit, hide, reorder or pay to remove reviews about them.
        </p>
      </LSection>

      <LSection title="How we moderate">
        <p>
          Anyone signed in can report a review, and a provider can dispute a review of their business. Reported
          content goes to our moderation queue, where we check it against the published{" "}
          <Link href="/guidelines" className="text-amber underline">Review Guidelines</Link>. We check whether the
          content follows the rules. We do not decide who was right in a disagreement about a job.
        </p>
        <p>
          Honest negative reviews stay published. A provider disagreeing with a review is not, by itself, a reason
          to remove it. Providers get one public right of reply on every review about them.
        </p>
      </LSection>

      <LSection title="Advertising">
        <p>
          Trusted Antigua is supported by advertising from local businesses. Adverts are clearly labelled as
          sponsored, and they are kept completely separate from reviews and ratings. Advertisers get no access to
          reviews, reputation data, rankings or anything about our users, and no amount of money moves a provider
          up the page.
        </p>
        <p>
          Featured providers are editorial choices made by us, never paid placement, and they are labelled as such.
        </p>
      </LSection>

      <LSection title="Who runs it">
        <p>
          Trusted Antigua is operated by a small independent team based in Antigua. It is not affiliated with any
          government body, trade association or provider listed on the platform. Formal company details will be
          published here once registration is complete.
        </p>
        <p>
          Questions, corrections, or something we have got wrong? We would rather hear it.{" "}
          <ContactLine prefix="Email" />
        </p>
      </LSection>
    </LegalShell>
  );
}
