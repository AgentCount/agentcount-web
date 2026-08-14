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
   * homepage. It says what the product is, and — because it is the first thing
   * a search result shows — what it refuses to be.
   *
   * "agent economy", not "ERC-8004": the census is the first instrument, not
   * the product. The instrument names itself on its own page.
   */
  tagline:
    "Independent measurement of the agent economy — evidence attached, no score.",
  // No slogan. The wordmark and the headline say what this is; a tagline
  // beside them was a third voice saying it again.
  /**
   * The technical self-description: the footer and the meta description are
   * where a reader who wants to know exactly what this is will look, and
   * where a search result needs it to be.
   */
  selfDescription: "the independent audit layer for the agent economy",
} as const;

/**
 * One sentence for someone who arrived knowing nothing at all.
 *
 * Leads with what the product IS and what it does, and names ERC-8004 only
 * as the scope of the first instrument — because that is the true shape of
 * the thing: 8004 is what one instrument reads, not what the product is. It
 * still says "AI agent" before it says ERC-8004, because the reader who needs
 * this sentence does not know the second phrase.
 *
 * "on the chains it sweeps" is the scope, and it stays: the registry is
 * deployed on far more chains than this census reads, so the sentence
 * without it claims a completeness nobody has. The chains are no longer
 * listed here — /coverage names every one of them and says what share they
 * are, which is a better answer than a parenthetical that grows with every
 * sweep.
 *
 * "first instrument" is deliberate and is as far as the sentence goes:
 * it says the product is bigger than the census without naming, promising
 * or dating anything that has not shipped. Nothing unshipped gets marketed
 * on this site — a product that audits claims cannot open with one.
 */
export const NEWCOMER_SENTENCE = `${BRAND.name} is an independent, open-source audit layer for the agent economy: it counts what gets claimed, checks what actually stands behind it, and publishes the evidence for both. Its first instrument checks every AI agent registered under ERC-8004 on the chains it sweeps. All code and data are public.`;

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
