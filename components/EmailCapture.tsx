import { BRAND } from "@/lib/brand";

/**
 * "Get each census report by email."
 *
 * ## No backend, deliberately
 *
 * A plain HTML form that POSTs straight to a hosted list provider. No API
 * route, no database table, no address ever touching this project's
 * infrastructure — which means there is nothing here to leak, nothing to
 * migrate, and no unsubscribe flow to get wrong. The provider already solves
 * double opt-in, bounce handling and one-click unsubscribe, and solves them
 * better than a weekend's work would.
 *
 * It also needs no JavaScript. This is a server component and the form is a
 * form: it works with scripting disabled, which is a reasonable thing to
 * expect of a page whose whole audience is people who check things.
 *
 * ## It renders NOTHING until it is configured
 *
 * `NEWSLETTER_ACTION` is the provider's subscribe endpoint. Unset — which is
 * the state until someone creates the list — this component returns `null`
 * rather than a form. A form that silently posts nowhere is worse than no
 * form: a reader believes they subscribed, and finds out they did not when
 * the report they were waiting for never arrives.
 *
 * **Setting it needs a redeploy, not just an environment change.** This
 * renders on `/` (dynamic, reads the variable per request) and on `/reports`
 * (static, reads it at build time). Changing the value without rebuilding
 * would show the form on one and not the other — which is the sort of
 * half-configured state that gets noticed by a reader rather than by us.
 */
export function EmailCapture({
  /** Small variant for the foot of a long page; `lead` for the homepage. */
  variant = "lead",
}: {
  variant?: "lead" | "quiet";
}) {
  const action = process.env.NEWSLETTER_ACTION;
  if (!action) return null;

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
        action={action}
        method="post"
        // The provider's confirmation page opens beside this one rather than
        // replacing it. A reader mid-report should not lose their place to
        // subscribe to the report.
        target="_blank"
        rel="noopener"
        className="mt-5 flex flex-wrap items-stretch gap-3"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        {/* Buttondown's marker for "this came from an embedded form", which is
            what makes it answer with a human confirmation page instead of a
            raw API response. Harmless anywhere else — every provider worth
            using ignores a field it does not know — so it stays unconditional
            rather than becoming a second environment variable that has to
            agree with the first one. */}
        <input type="hidden" name="embed" value="1" />
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 border border-edge bg-panel px-4 py-2.5 font-mono text-sm text-text placeholder:text-dead focus:border-muted focus:outline-none"
        />
        <button
          type="submit"
          className="border border-edge px-5 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-muted transition-colors hover:border-muted hover:text-text"
        >
          Subscribe
        </button>
      </form>
      <p className="mt-3 text-xs leading-relaxed text-dead">
        Your address goes to the list provider, not to {BRAND.name}. We keep no
        copy of it and it is never used for anything but the report.
      </p>
    </section>
  );
}
