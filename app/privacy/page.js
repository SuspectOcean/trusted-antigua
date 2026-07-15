import { LegalShell, LSection, ContactLine } from "@/components/LegalPage";
import { OPERATOR, SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy | Trusted Antigua",
  description: "How Trusted Antigua collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <LSection title="Who we are">
        <p>
          {SITE_NAME} is a community directory and review platform for service providers in Antigua &amp; Barbuda.
          It is operated by {OPERATOR}. <ContactLine prefix="For anything in this policy, contact" />
        </p>
      </LSection>

      <LSection title="What we collect">
        <p>We collect only what the platform needs to work:</p>
        <p>
          <b>Account holders:</b> your email address (for sign-in), your first name, and the area you live in
          (shown alongside your reviews, e.g. &ldquo;Maria, Jolly Harbour&rdquo;). We do not ask for your surname,
          address, or payment details.
        </p>
        <p>
          <b>Reviews and reports:</b> the content you submit, including reviews, scores, tags, private notes to our team,
          reports, and (for business owners) replies and profile details.
        </p>
        <p>
          <b>Service providers:</b> business profiles include a name or nickname, trade, service area, description,
          photo, and contact number. Profiles may be created by the community; providers can claim and manage their
          own profile.
        </p>
        <p>
          <b>Technical data:</b> basic logs kept by our hosting and database providers (such as IP addresses in
          server logs) for security and reliability. We do not run advertising trackers.
        </p>
      </LSection>

      <LSection title="How we use it">
        <p>
          To operate the directory: showing reviews with your chosen display (first name + area), calculating
          provider reputation statistics, contacting you about your account or content, moderating reviews, and
          keeping the platform safe. We do not sell personal information, and we do not send marketing without
          asking you first.
        </p>
      </LSection>

      <LSection title="Who can see what">
        <p>
          Public visitors can see provider profiles and summary statistics. Signed-in users can additionally see
          review content and provider contact details. Private notes and reports are visible only to our team.
          Your email address is never shown publicly.
        </p>
      </LSection>

      <LSection title="Where your data lives">
        <p>
          Data is stored with Supabase (database and authentication) and the site is served by Vercel. Both are
          reputable international hosting providers; data may be stored outside Antigua &amp; Barbuda. We use
          access controls so that private data is only readable by the account it belongs to and our team.
        </p>
      </LSection>

      <LSection title="Your rights">
        <p>
          In line with the Data Protection Act, 2013 of Antigua &amp; Barbuda, you can ask us for a copy of the
          personal data we hold about you, ask us to correct it, or ask us to delete it. You can delete your own
          reviews at any time from your account, and you can request account deletion. Because reviews about
          businesses serve a public interest, removing a review you wrote is your choice, but a provider cannot
          demand removal of lawful reviews about them (see our{" "}
          <a className="text-amber underline" href="/guidelines">Review Guidelines</a> for how disputes work).
        </p>
        <p>
          <ContactLine prefix="To exercise any of these rights, email" /> We aim to respond within 14 days of any
          request.
        </p>
      </LSection>

      <LSection title="Retention">
        <p>
          We keep account data while your account exists. Deleted reviews are retained internally for a period for
          moderation and legal purposes, then removed. Private reports are kept as long as needed to handle them.
        </p>
      </LSection>

      <LSection title="Children">
        <p>{SITE_NAME} is not intended for anyone under 18.</p>
      </LSection>

      <LSection title="Changes">
        <p>
          If this policy changes materially, we will update the effective date above and note the change on the
          site.
        </p>
      </LSection>
    </LegalShell>
  );
}
