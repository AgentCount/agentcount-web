/**
 * The product's name, domain and contact address — in one place, referenced
 * everywhere.
 *
 * Nav, page titles, meta tags, OG images and the footer all read from here, so
 * the 2026-07-30 rename to AgentCount was a one-line edit rather than a
 * find-replace across the codebase that inevitably misses a `<title>`
 * somewhere. It worked: this module and the probe User-Agent were the whole
 * product-facing surface.
 *
 * Deliberately NOT covered by this module: the Rust crates, the repository
 * names, the `AGENTCOUNT_API_URL` environment variable, and the database name.
 * Those are deployment and source-control identifiers, not product branding,
 * and renaming them is a separate migration with its own blast radius.
 */
export const BRAND = {
  /** The product name, as written in prose and headings. */
  name: "AgentCount",
  /** Public domain, without a scheme — used in meta tags and OG images. */
  domain: "agentcount.ai",
  contactEmail: "probes@agentcount.ai",
  /**
   * One line, observational. Appears in the document description and on the
   * homepage. It says what the census is, and — because it is the first thing
   * a search result shows — what it refuses to be.
   */
  tagline:
    "An independent ERC-8004 conformance census: seven rungs per agent, evidence attached, no score.",
  /**
   * The greeting: what makes this register unusual, in two words.
   *
   * The masthead first said "ERC-8004 conformance census", which asks a
   * first-time visitor to know what ERC-8004 is before it tells them
   * anything. It then said "Counts, not scores." for a while, which was
   * better positioning and two other problems: it is the same negation
   * construction this project's prose leans on everywhere (see the 2026-08
   * review), and it defines the product by what a competitor does, which
   * gives the competitor the frame.
   *
   * "Evidence attached" is the promise that is actually unusual and actually
   * kept: every check on this site carries the evidence that produced it, and
   * every published number can be recomputed from an archive anyone can
   * download. It says what a reader gets rather than what someone else does.
   */
  greeting: "Evidence attached.",
  /**
   * The technical self-description, kept verbatim and moved rather than
   * dropped: the footer and the meta description are where a reader who wants
   * to know exactly what this is will look, and where a search result needs
   * it to be.
   */
  selfDescription: "ERC-8004 conformance census",
} as const;

/**
 * One sentence for someone who arrived knowing nothing at all.
 *
 * Deliberately says "AI agent" before it says ERC-8004, because the reader
 * who needs this sentence does not know the second phrase. It names the
 * three things measured in the order the site measures them — what they
 * declare, what works, what the money does — and ends on the claim that
 * makes every other number checkable.
 *
 * A function, not a string, because the sentence carries scope. The registry
 * is deployed on far more chains than this census sweeps, so "every AI agent
 * registered under ERC-8004" unqualified was an overclaim — the same class
 * the census exists to catch. The caller supplies the swept-chain list,
 * derived from the published runs, so the sentence widens on its own the day
 * a new chain's archive is published.
 */
export function newcomerSentence(chainList: string): string {
  return `${BRAND.name} is an independent, open-source census of every AI agent registered under ERC-8004 on the chains it sweeps (${chainList}) — what they declare, what actually works, and what the money does. All code and data are public.`;
}

/** `<title>` for any page but the homepage. One format, one place. */
export function pageTitle(page: string): string {
  return `${page} — ${BRAND.name}`;
}

/**
 * Census-wide product choices that are not branding.
 *
 * `defaultChain` exists because "the newest completed run" stopped being a
 * safe default the moment a second chain was swept. Runs are ordered by start
 * time across all chains, so a 400-agent proof sweep of one chain finishing
 * after a 60,097-agent sweep of another silently became the homepage — every
 * headline number changed chain with nothing on the page saying so.
 *
 * A configured default is the honest fix: the site leads with one chain on
 * purpose, and says which, rather than leading with whichever sweep happened
 * to finish last. Readers reach the others through the chain switcher, and
 * `?chain=` is in the URL either way.
 *
 * If this chain has no completed run, pages fall back to the newest completed
 * run on any chain rather than erroring — an empty site is worse than a
 * different one, as long as the header names the chain it is showing.
 */
export const CENSUS = {
  defaultChain: "base",
} as const;
