import { TextLink } from "@/components/TextLink";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "Subscribed",
  // Nothing here should ever appear in a search result.
  robots: { index: false, follow: false },
};

/**
 * Where the subscribe form lands.
 *
 * A real page rather than a query parameter on the page they came from,
 * because the form is a plain HTML POST with no JavaScript: there is no
 * in-place success state to show, and pretending otherwise would need script
 * this deliberately does without.
 *
 * ## It does not claim more than happened
 *
 * The success text says the address was recorded and that no mail is being
 * sent yet. Both are true, and the second one matters: a "check your inbox to
 * confirm" message would be a lie until there is something sending
 * confirmations, and a reader who went looking for that email and found
 * nothing would reasonably assume the whole thing was broken.
 */
const STATES: Record<string, { heading: string; body: React.ReactNode }> = {
  ok: {
    heading: "You're on the list",
    body: (
      <>
        Your address is recorded, and nothing has been sent to it. There is no
        confirmation email to look for yet — the reports are written before
        they are mailed, and the sending side is not built. When the first one
        goes out you will be asked to confirm before it does.
      </>
    ),
  },
  invalid: {
    heading: "That address didn't look right",
    body: (
      <>
        Nothing was recorded. It is worth a second look for a missing{" "}
        <code className="font-mono text-xs text-text">@</code> or a typo in the
        domain — and if you think the address is fine and this page is wrong,
        that is a bug worth telling us about.
      </>
    ),
  },
  throttled: {
    heading: "Too many attempts from your connection",
    body: (
      <>
        Nothing was recorded this time. Give it ten minutes and try again. This
        is a crude limit that also catches shared office and mobile networks,
        so it may well not be about you.
      </>
    ),
  },
  error: {
    heading: "Something on our side failed",
    body: (
      <>
        Your address was <span className="text-text">not</span> recorded, and
        this is ours to fix rather than yours. Trying again later is reasonable;
        so is emailing the address below and letting us do it by hand.
      </>
    ),
  },
};

export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  // An unrecognised value renders the failure, never the success. Someone
  // hand-editing the URL should not be able to produce a page telling them
  // they subscribed when they did not.
  const s = STATES[state ?? "ok"] ?? STATES.error;
  const ok = !state;

  return (
    <div className="mx-auto max-w-prose py-16">
      <span className="label">{ok ? "Subscribed" : "Not subscribed"}</span>
      <h1 className="numeral mt-3 text-[clamp(1.75rem,3.4vw,2.5rem)] text-text">
        {s.heading}
      </h1>
      <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">{s.body}</p>

      <p className="mt-8 text-sm leading-relaxed text-muted">
        Your address is stored by {BRAND.name} and used for nothing but the
        census reports. To be removed at any point — including before anything
        is ever sent — email{" "}
        <TextLink
          href={`mailto:${BRAND.contactEmail}`}
          tone="inherit"
          className="font-mono text-xs"
        >
          {BRAND.contactEmail}
        </TextLink>{" "}
        and it is deleted.
      </p>

      <p className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
        <TextLink href="/">Back to the findings →</TextLink>
        <TextLink href="/reports">The reports →</TextLink>
      </p>
    </div>
  );
}
