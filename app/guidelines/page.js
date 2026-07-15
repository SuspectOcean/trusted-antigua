import { LegalShell, LSection, ContactLine } from "@/components/LegalPage";

export const metadata = {
  title: "Review Guidelines | Trusted Antigua",
  description: "What makes a fair review on Trusted Antigua, and how reporting and disputes work.",
};

export default function GuidelinesPage() {
  return (
    <LegalShell title="Review Guidelines">
      <LSection title="The one rule that matters">
        <p>
          Write about your own, first-hand experience of work this person or business actually did for you (or for
          your household). Honest praise and honest criticism are both welcome. That is the whole point of the
          platform.
        </p>
      </LSection>

      <LSection title="Fair game">
        <p>
          The quality of the work, reliability, punctuality, communication, price fairness, professionalism, and
          how problems were handled. Specifics help everyone: what the job was, roughly when, and what happened.
        </p>
      </LSection>

      <LSection title="Not allowed">
        <p>
          Reviews of businesses you own or work for (or of your competitors). Second-hand stories
          (&ldquo;my cousin said…&rdquo;). Insults, threats, or attacks on someone as a person rather than their
          work. Private personal information, such as home addresses, ID numbers, health details, or anything similar.
          Accusations of crimes are a matter for the police, not a review. Fake or paid-for reviews of any kind.
        </p>
      </LSection>

      <LSection title="Providers: your rights">
        <p>
          If a review is about your business, you can <b>reply publicly</b> (one reply per review, shown beneath
          it) once you have claimed your profile. You can also <b>dispute</b> a review you believe breaks these
          guidelines (for example, it is not from a genuine customer). Disputes go to our moderation team.
        </p>
        <p>
          What you can never do: edit, hide, reorder, or pay to remove reviews. A dispute is a request for
          moderation, not a delete button. Reviews stay visible while we assess them.
        </p>
      </LSection>

      <LSection title="How moderation works">
        <p>
          Any signed-in user can report a review. Our team checks reports against these guidelines. If a review
          breaks them, we remove it and record why. If it doesn&rsquo;t, it stays, including negative reviews.
          Deliberately false reports and fake reviews may lead to account suspension. If you believe content about
          you is unlawful, you can send us a formal notice. <ContactLine prefix="Email" />
        </p>
      </LSection>

      <LSection title="Editing and deleting your review">
        <p>
          You can update or delete your own review at any time from your account. Nobody else can, not the
          provider, and not anyone paying on their behalf.
        </p>
      </LSection>
    </LegalShell>
  );
}
