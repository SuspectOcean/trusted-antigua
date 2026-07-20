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
        <p>
          Negative experiences are welcome when they describe what actually happened to you.
          &ldquo;The provider arrived late and did not respond to my messages&rdquo; is a fair review.
          A provider disagreeing with a review is never, on its own, a reason for us to remove it.
        </p>
      </LSection>

      <LSection title="Not allowed">
        <p>
          Threats or harassment. Hate speech. Private personal information, such as home addresses, ID numbers,
          health details, or anything similar. Fake or paid-for reviews of any kind. Reviews of businesses you own
          or work for, or of your competitors, or written because of a personal falling-out rather than a service
          experience. Second-hand stories (&ldquo;my cousin said…&rdquo;). Content unrelated to a genuine service
          experience.
        </p>
        <p>
          There is a difference between a bad experience and an accusation. Saying the work was poor, late, or
          overpriced is your experience. Accusing someone of theft, fraud, or other crimes is a serious claim:
          without something to support it, that content may be hidden, and genuinely criminal matters belong with
          the police. Describe what happened to you; let readers draw their own conclusions.
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
          Any signed-in user can report a review, and providers can dispute reviews of their business. Reported
          content goes into a moderation queue, where our team checks it against these guidelines, nothing more
          and nothing less. We don&rsquo;t judge who was right in a disagreement about a job; we only judge whether
          the content follows the rules above. If it breaks them, it may be hidden and the action is recorded.
          If it doesn&rsquo;t, it stays published, including negative reviews. Deliberately false reports and fake
          reviews may lead to account suspension. Questions about any of this? <ContactLine prefix="Email" />
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
