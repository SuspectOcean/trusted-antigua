import { LegalShell, LSection, ContactLine } from "@/components/LegalPage";
import { OPERATOR, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Terms of Service | Trusted Antigua",
  description: "The rules for using Trusted Antigua.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <LSection title="The service">
        <p>
          {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;the platform&rdquo;) is a community directory and review platform
          for service providers in Antigua &amp; Barbuda, operated by {OPERATOR}. By using the platform you agree
          to these terms, our <a className="text-amber underline" href="/privacy">Privacy Policy</a>, and our{" "}
          <a className="text-amber underline" href="/guidelines">Review Guidelines</a>.
        </p>
      </LSection>

      <LSection title="What we are, and what we are not">
        <p>
          We are a directory of community experiences. We are not a party to any work you arrange with a provider,
          we do not vet, employ, guarantee, or insure providers, and badges such as &ldquo;Verified Business&rdquo;
          describe checks on identity or documentation, not a guarantee of work quality. Always use your own
          judgement before hiring anyone.
        </p>
      </LSection>

      <LSection title="Reviews">
        <p>
          Reviews are written by users and reflect their own experience and opinions, not ours. You are responsible
          for what you post. Reviews must follow the{" "}
          <a className="text-amber underline" href="/guidelines">Review Guidelines</a>: first-hand experience,
          honest, no personal attacks, no private information about individuals.
        </p>
        <p>
          <b>The trust rule:</b> providers control how they are described (their own profile), and the community
          controls how they are rated. Providers can reply publicly to reviews of their business, and can dispute a
          review through our reporting process, but providers can never edit, hide, reorder, or pay to remove
          reviews. We do not remove lawful negative reviews in exchange for payment, subscriptions, or anything
          else.
        </p>
      </LSection>

      <LSection title="Reporting and takedown">
        <p>
          Anyone signed in can report a review (for example: not a genuine experience, abusive content, private
          personal information, or a conflict of interest). Providers can dispute reviews of their own business the
          same way. Reports go to our moderation team, who will assess them against the Review Guidelines and
          applicable law and either keep or remove the content. Reported content normally stays visible while under
          review, unless it plainly exposes private personal information.
        </p>
        <p>
          For formal legal notices (for example an alleged defamation takedown request), include the specific
          content, the reason, and your contact details. We review every notice and act where the law or our
          guidelines require it. <ContactLine prefix="Send notices to" />
        </p>
      </LSection>

      <LSection title="Provider profiles">
        <p>
          Profiles may be created by community members naming a business or tradesperson they have used. If a
          profile describes you or your business, you may claim it (subject to verification) and manage its public
          description, or contact us if you believe a profile is inaccurate or should not exist. Reputation data
          (counts, percentages, and scores) is derived from community reviews and is not editable by anyone,
          including us, except through the moderation process described above.
        </p>
      </LSection>

      <LSection title="Acceptable use">
        <p>
          No fake reviews, no reviewing your own business or a competitor&rsquo;s dishonestly, no multiple
          accounts, no scraping, no attempts to bypass access controls, and nothing unlawful. We may remove content
          and suspend accounts that break these terms.
        </p>
      </LSection>

      <LSection title="Liability">
        <p>
          The platform is provided &ldquo;as is&rdquo;, free of charge. To the fullest extent permitted by law, we
          are not liable for the acts or omissions of any provider or user, for the content of reviews, or for any
          loss arising from work you arrange with a provider found through the platform.
        </p>
      </LSection>

      <LSection title="Governing law">
        <p>These terms are governed by the laws of Antigua &amp; Barbuda.</p>
      </LSection>

      <LSection title="Contact">
        <p>
          <ContactLine prefix="Questions, notices, and complaints:" />
        </p>
      </LSection>
    </LegalShell>
  );
}
