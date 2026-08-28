/**
 * The site's own map: what is in the header, what is in the footer, and one
 * line each saying what is behind the label.
 *
 * Lifted out of `app/layout.tsx` so it can be asserted — `test/instruments.test.ts`
 * checks that every href here resolves to a real route and that no label
 * ships without its explanation. It was layout-local for as long as it was
 * only ever rendered once; a list that other code now has opinions about
 * belongs where other code can read it.
 */

export type NavItem = {
  href: string;
  /** What the reader sees. Short enough for a header row. */
  label: string;
  /**
   * One line saying what is behind the label, rendered in the footer sitemap.
   *
   * The header cannot show these — a nav bar with a sentence under each item
   * is not a nav bar — so they live in the footer, which is where someone who
   * did not understand the page goes looking, beside the one sentence that
   * already explains the product. A one-word label is enough for a reader who
   * holds this vocabulary and tells a first-time reader nothing: "Findings",
   * "Reports" and "Data" are three different nouns for things this site is
   * full of, and which is which was not guessable from anywhere on it.
   */
  blurb: string;
};

/**
 * Four places, ordered from the instrument outward.
 *
 * "Findings" leads because it is the product's one live instrument — the
 * homepage is the overview OF it, so the wordmark and the first nav item are
 * different doors. A future instrument earns a nav item the day it ships,
 * and the label will be the instrument's name, not "new".
 *
 * "Agents" is the list of agents. It was called "Directory", which names the
 * shape of the page rather than what is in it. The URL stays `/directory`:
 * labels are for readers, URLs are identifiers other people have linked to.
 *
 * "Data" is the archives — promoted from the footer because downloading a
 * run is the product's whole reproducibility claim made concrete, not a
 * reference detail.
 *
 * Coverage, the pre-flight checker and Method live in the footer: they are
 * what you consult while checking a claim, not what you arrive for. The
 * census hero still links /coverage where the scope claim is made.
 *
 * "one live instrument" above is now two instruments, one of them published;
 * the header still carries only the published one, for the reason `TOOLS`
 * gives beside `/sellers`.
 */
export const NAV: readonly NavItem[] = [
  // Labelled "Findings", not "Census": the label must work for a reader —
  // including one whose first language is not English — before they know any
  // of this product's vocabulary. The URL stays `/census` because URLs are
  // identifiers other people have linked to.
  {
    href: "/census",
    label: "Findings",
    blurb: "What the sweeps found, one chain at a time.",
  },
  {
    href: "/directory",
    label: "Agents",
    blurb: "Every agent counted, searchable, each with its own record.",
  },
  {
    href: "/reports",
    label: "Reports",
    blurb: "Written analysis of a sweep, dated and cited.",
  },
  {
    href: "/data",
    label: "Data",
    blurb: "The archives — download any run and recompute it.",
  },
];

/**
 * Reference, in the footer: what you consult while checking a figure, rather
 * than what you came to read.
 *
 * `/sellers` sits here rather than in `NAV`: the header is what a reader
 * arrives for, and instrument 02 has no figures to arrive at yet. It is
 * linked prominently from the homepage's instrument list, which is where a
 * reader meets the two instruments as a pair — this is the second way in,
 * not the first.
 */
export const TOOLS: readonly NavItem[] = [
  {
    href: "/methodology",
    label: "Method",
    blurb: "How each check is measured, and what it refuses to claim.",
  },
  {
    href: "/coverage",
    label: "Coverage",
    blurb: "Which chains are swept, and what share of agents that is.",
  },
  {
    href: "/sellers",
    label: "Seller Census",
    blurb: "The second instrument: who actually sells over x402.",
  },
  {
    href: "/preflight",
    label: "Check a file",
    blurb: "Run the checks against your own agent document.",
  },
];
