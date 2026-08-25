import Link from "next/link";
import type { ReactNode } from "react";
import { withArrowNudge } from "./ArrowNudge";

/**
 * The one CTA-button-style link on the site: a border-bottom read as a
 * button, in a primary and a ghost tone.
 *
 * Deliberately NOT built on `TextLink`: that component's own doc states
 * this site's one link affordance is an underline, "identical everywhere
 * ... so the underline is the whole affordance" — a border-bottom read as
 * a button is a second, different device, not a variant of the first, so
 * it earns its own small component rather than a new `TextLink` tone that
 * would make that claim false the moment someone reads the two together.
 *
 * Scoped to the one place that pairs a primary and a ghost — the hero's
 * action row on `app/page.tsx`. Nowhere else on the site offers a reader
 * two next steps at once, and a lone button with nothing to be primary
 * against is a link wearing a border for no reason. `app/not-found.tsx` is
 * the near miss: it is a small bordered note rather than a hero, and
 * inventing a second link there purely to complete a pair would be adding
 * content nobody asked for. Left as its one plain `TextLink` unless that
 * page ever grows a real second action.
 *
 * `tone="primary"` puts the brand accent on a CTA rather than a
 * measurement — one more of the handful of places that is allowed at all;
 * see the design-system comment in `globals.css`. `tone="ghost"` is its
 * companion: dim at rest, rising only to full text colour on hover, never
 * to the accent, so a pair never reads as two competing calls to action.
 *
 * The trailing "↓"/"→" also nudges on hover, via `withArrowNudge`
 * (`ArrowNudge.tsx`) — the same shared device `TextLink` uses, so a reader
 * who has seen the motion on a prose link sees the identical thing here.
 */
const TONES = {
  primary: "text-accent border-accent hover:text-text hover:border-text",
  ghost: "text-muted border-edge hover:text-text hover:border-muted",
} as const;

export function CtaLink({
  href,
  children,
  tone = "ghost",
}: {
  href: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  const classes =
    `group inline-flex items-center gap-2 border-b pb-0.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors ${TONES[tone]}`;
  // Same split as `TextLink`: fragments and absolute URLs skip the router.
  if (!href.startsWith("/")) {
    return (
      <a href={href} className={classes}>
        {withArrowNudge(children)}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {withArrowNudge(children)}
    </Link>
  );
}
