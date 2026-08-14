import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The site's one internal link treatment: an underline in `--color-line`,
 * offset 4, that sharpens on hover. Colour never distinguishes a link —
 * see the rule at the top of `globals.css` — so the underline is the whole
 * affordance, and it must be identical everywhere to stay legible as one.
 *
 * Before this component existed the class string was hand-repeated 38 times
 * and had already drifted into four hover variants. The variants that were
 * semantic survive as `tone`; the ones that were drift did not.
 *
 *   muted    the default: quiet resting colour, brightens on hover
 *   bright   for links inside prose that already carries `text-muted` —
 *            resting at full text colour so the link reads as the subject
 *   quiet    inherits its colour from a `text-dead` run (provenance lines,
 *            footers) and only rises to muted on hover
 *   inherit  inherits its colour and rises to full text on hover
 *
 * External links that leave the site stay on `OutboundLink` — its dotted
 * underline is a deliberate, different device and must not be merged here.
 */
const TONES = {
  muted: "text-muted hover:text-text hover:decoration-edge",
  bright: "text-text hover:decoration-edge",
  quiet: "hover:text-muted",
  inherit: "hover:text-text",
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
  const classes =
    `underline decoration-line underline-offset-4 transition-colors ${TONES[tone]}` +
    (className ? ` ${className}` : "");
  // Fragments (`#…`) and mailto links gain nothing from the router; plain
  // anchors keep them honest. Everything path-shaped goes through next/link.
  if (!href.startsWith("/")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
