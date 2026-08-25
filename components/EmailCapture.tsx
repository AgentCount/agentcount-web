import { BRAND } from "@/lib/brand";
import { TextLink } from "./TextLink";

/**
 * "Get each census report by email."
 *
 * ## The list is ours, not a provider's
 *
 * This posted to a hosted list provider until 2026-08-01. It now posts to
 * `/api/subscribe` on this origin, which calls the census API server-side,
 * which writes a row. The reason for the change is that a provider is a
 * subscription and a configuration to maintain before anyone has shown they
 * want the reports at all — and the sending side, which is the genuinely hard
 * part, is not needed until there is something to send.
 *
 * What that costs is stated on the page rather than glossed: **nothing here
 * sends mail, so nothing here can run a double opt-in.** Anyone can type
 * anyone else's address in. Every row is stored unconfirmed and the first send
 * has to confirm before it goes anywhere — see migration 0017 and
 * `crates/api/src/routes/subscribe.rs`.
 *
 * It still needs no JavaScript. A plain form, posting to a route handler that
 * answers with a 303 to a real page: the back button behaves, a refresh does
 * not resubmit, and none of it depends on script. That seems the least a page
 * can offer an audience whose reason for being here is checking things.
 *
 * ## It renders NOTHING until it is switched on
 *
 * `NEWSLETTER_ENABLED` must be `true`. Unset — which is the state until
 * someone decides to collect addresses — this returns `null` rather than a
 * form. A form that records nothing is worse than no form: a reader believes
 * they subscribed and finds out otherwise when the report never arrives.
 *
 * A flag rather than the provider URL it replaced, because there is no longer
 * a URL to configure. It is still an environment variable rather than a
 * constant so that collecting addresses stays a deliberate act with a date on
 * it, and so a preview deploy can be left inert.
 *
 * **Switching it on needs a redeploy, not just an environment change.** This
 * renders on `/` (dynamic, reads the variable per request) and on `/reports`
 * (static, reads it at build time). Changing the value without rebuilding
 * would show the form on one and not the other — the sort of half-configured
 * state that gets noticed by a reader rather than by us.
 */
export function EmailCapture({
  /** Small variant for the foot of a long page; `lead` for the homepage. */
  variant = "lead",
  /** Which page this instance is on, recorded so the two can be compared. */
  source,
}: {
  variant?: "lead" | "quiet";
  source?: string;
}) {
  if (process.env.NEWSLETTER_ENABLED !== "true") return null;

  const lead = variant === "lead";
  return (
    <section
      aria-labelledby="newsletter-heading"
      className={lead ? "mt-20 max-w-prose" : "mt-16 max-w-prose"}
    >
      <h2 id="newsletter-heading" className="label text-text">
        Get each census report by email
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        One message per report. No other mail, ever — not announcements, not
        anything else this project might do later. Unsubscribe from any of
        them.
      </p>
      <form
        action="/api/subscribe"
        method="post"
        className="mt-5 flex flex-wrap items-stretch gap-3"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        {/* Which page this was, so "does the report page convert better than
            the homepage" is answerable. About the site, not the person. */}
        <input type="hidden" name="source" value={source ?? ""} />
        {/* The honeypot. Hidden from people and irresistible to naive bots;
            anything that fills it gets a success response and no row.
            `tabIndex={-1}` and `autoComplete="off"` keep it away from keyboard
            users and password managers, and `aria-hidden` from screen readers
            — a field only a bot should ever see must be invisible to every
            way a person navigates, not just to sighted mouse users. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        {/* `focus:border-muted` only, no `focus:outline-none`: this
            input used to suppress the site's accessible focus ring and
            replace it with a border barely a shade lighter — a keyboard
            user tabbing here got almost nothing. Dropping the
            suppression lets the global `:focus-visible` ring (see
            `globals.css`) return for keyboard focus, while the border
            tint — plain `:focus`, not `:focus-visible` — still answers
            a mouse click same as before; the two now stack instead of
            one silently winning. */}
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 border border-edge bg-panel px-4 py-2.5 font-mono text-sm text-text placeholder:text-dead focus:border-muted"
        />
        <button
          type="submit"
          className="border border-edge px-5 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-muted transition hover:border-muted hover:text-text active:scale-[0.97]"
        >
          Subscribe
        </button>
      </form>
      {/* This said "your address goes to the list provider, not to
          AgentCount — we keep no copy of it" while the form posted to a hosted
          provider. The list moved in-house on 2026-08-01 and that sentence
          became false, so it changed in the same commit. A privacy claim is
          the last piece of copy that should be allowed to lag its
          implementation. */}
      <p className="mt-3 text-xs leading-relaxed text-dead">
        Your address is stored by {BRAND.name} and used for nothing but the
        census reports. Nothing is sent yet — there is no sending side built,
        so there is no confirmation email to expect, and you will be asked to
        confirm before the first report goes anywhere. Email{" "}
        <TextLink href={`mailto:${BRAND.contactEmail}`} tone="inherit">
          {BRAND.contactEmail}
        </TextLink>{" "}
        at any point and it is deleted.
      </p>
    </section>
  );
}
