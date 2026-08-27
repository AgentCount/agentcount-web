import Link from "next/link";
import type { ReactNode } from "react";
import { withArrowNudge } from "./ArrowNudge";

/**
 * The site's one internal link treatment: an underline in `--color-line`,
 * offset 4, that goes to the brand accent on hover.
 *
 * The rule at the top of `globals.css` says colour never distinguishes a
 * link, and that is still true where it matters: AT REST every link on this
 * site is bone or muted with a hairline under it, exactly like the prose
 * around it, so nothing on a page is picked out by hue before the reader
 * chooses to point at it. Hover is not that — it is the pointer confirming
 * what is already under it, on an element the reader has already found. It
 * moves colour AND `text-decoration-color` to the accent together, and it
 * does so identically at every call site on the site — prose, panel feet,
 * table cells alike — so the pointer's answer never depends on which run of
 * text a link happens to sit in.
 *
 * Because that hover is shared by every tone, `tone` now means exactly one
 * thing — the RESTING colour — which is what its name always claimed:
 *
 *   muted    the default: quiet resting colour
 *   bright   for links inside prose that already carries `text-muted` —
 *            resting at full text colour so the link reads as the subject
 *   inherit  takes its colour from the run it sits in (a `text-dead`
 *            provenance line, a footer, a table cell)
 *
 * `quiet` is gone. It and `inherit` both inherited their resting colour and
 * differed only in where they hovered TO — muted versus full text — and
 * with one hover destination for all three that was no longer a difference
 * in anything, just two names for one tone. Its five call sites now say
 * `inherit`.
 *
 * External links that leave the site stay on `OutboundLink` — its dotted
 * underline is a deliberate, different device and must not be merged here.
 * Its hover is deliberately NOT the accent: an outbound link rising to the
 * same cyan would erase the one distinction the dots exist to draw.
 *
 * A trailing " →" or leading "← " in the label also nudges on hover, via
 * `withArrowNudge` (`ArrowNudge.tsx`) — one small motion device shared by
 * every arrow-suffixed link on the site, not a colour, so it needs no entry
 * in the accent exception list in `globals.css`.
 */
const TONES = {
  muted: "text-muted",
  bright: "text-text",
  inherit: "",
} as const;

export function TextLink({
  href,
  children,
  tone = "muted",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  // The hover lives here rather than in `TONES` because it is the one part
  // of this treatment that must be identical for every tone — see the doc
  // above. `decoration-accent` alongside `text-accent`: both have to move,
  // because moving only the text leaves a `--color-line` hairline under a
  // cyan word, which reads as an underline that failed to follow.
  const classes =
    `group underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent ${TONES[tone]}` +
    (className ? ` ${className}` : "");
  // Fragments (`#…`) and mailto links gain nothing from the router; plain
  // anchors keep them honest. Everything path-shaped goes through next/link.
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
