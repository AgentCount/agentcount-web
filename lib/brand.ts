/**
 * The product's name, domain and contact address — in one place, referenced
 * everywhere.
 *
 * The project is being renamed and the new name is not chosen yet. Nav, page
 * titles, meta tags, OG images and the footer all read from here, so the
 * rename is a one-line edit rather than a find-replace across the codebase
 * that inevitably misses a `<title>` somewhere.
 *
 * Deliberately NOT covered by this module: the Rust crates, the repository
 * names, the `LEDGERSCOPE_API_URL` environment variable, and the `ledgerscope`
 * database. Those are deployment and source-control identifiers, not product
 * branding, and renaming them is a separate migration with its own blast
 * radius.
 */
export const BRAND = {
  /** The product name, as written in prose and headings. */
  name: "Ledgerscope",
  /** Public domain, without a scheme — used in meta tags and OG images. */
  domain: "ledgerscope.example",
  contactEmail: "hello@ledgerscope.example",
  /**
   * One line, observational. Appears in the document description and on the
   * homepage. It says what the census is, and — because it is the first thing
   * a search result shows — what it refuses to be.
   */
  tagline:
    "An independent ERC-8004 conformance census: seven rungs per agent, evidence attached, no score.",
} as const;

/** `<title>` for any page but the homepage. One format, one place. */
export function pageTitle(page: string): string {
  return `${page} — ${BRAND.name}`;
}
