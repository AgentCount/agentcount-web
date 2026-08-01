/**
 * The published census reports.
 *
 * ## Why the markdown lives in this repo
 *
 * Each report is written in the core repo, beside the `analysis/` documents it
 * cites and the runs that produced it, and a copy is published here. That is a
 * duplicate, and duplicates drift — so every report page links to the source
 * file by its exact path, and a reader who suspects drift can diff the two
 * without asking anyone.
 *
 * The alternative — fetching the markdown from GitHub at render time — would
 * make a permanent, citable URL depend on a third party being up, and would
 * mean the page a citation resolves to could change without a deploy. A report
 * is a dated artifact. It is published, not served.
 *
 * ## Why the slug is not the filename
 *
 * The core repo names reports by date and scope (`2026-07-30-four-chain.md`)
 * because that is what makes sense in a directory listing. A URL is cited in
 * other people's writing and must never move, so it names the census rather
 * than the day the file was written: the four-chain sweep IS the July 2026
 * census, and if a correction is issued next week it belongs at the same URL
 * with a note, not at a new one.
 */

export type Report = {
  /** The URL segment. Permanent — see the module doc. */
  slug: string;
  /** Rendered as the page's `h1`, replacing the markdown's own. */
  title: string;
  /** ISO date the report covers, for ordering and for the dateline. */
  date: string;
  /** One or two sentences for the index and the meta description. */
  summary: string;
  /** Chains covered, in the order the report presents them. */
  chains: string[];
  /** Total agents the report covers, formatted for display. */
  agents: string;
  /** The file under `content/reports/`, without the extension. */
  file: string;
  /** Path of the source file in the core repo, for the provenance line. */
  source: string;
};

/**
 * Newest first. Adding a report is this entry plus the markdown file — the
 * index, the routes, the sitemap and the card all read from here.
 */
export const REPORTS: Report[] = [
  {
    slug: "2026-07-census",
    title: "ERC-8004 conformance census: four chains",
    date: "2026-07-30",
    summary:
      "354,858 agents across Base, BNB Chain, Ethereum mainnet and Celo, each pinned to a block. Attestation ranges 44× between chains, 358 agents have ever been paid, and 34 have ever settled through x402.",
    chains: ["base", "bsc", "mainnet", "celo"],
    agents: "354,858",
    file: "2026-07-census",
    source: "docs/reports/2026-07-30-four-chain.md",
  },
];

export function findReport(slug: string): Report | undefined {
  return REPORTS.find((r) => r.slug === slug);
}

/** The core repository, where every report and every document it cites lives. */
export const CORE_REPO = "https://github.com/AgentCount/agentcount";

/**
 * Turn a link written for the repository into one that works on the web.
 *
 * Reports are written as repo documents, so their links are relative paths to
 * sibling files — `../../METHODOLOGY.md`, `2026-07-29-base-cfbfcc01.md`. Left
 * alone those resolve against the URL of the page, which produces a 404 on
 * this site for a document that exists and is public.
 *
 * Resolving against the SOURCE path rather than the published one is what
 * makes this correct: `../../analysis/celo.md` means two levels up from
 * `docs/reports/`, which is the repository root, and has nothing to do with
 * how deep `/reports/2026-07-census` happens to be.
 *
 * External links and in-page anchors are returned untouched.
 */
export function resolveReportLink(href: string, sourcePath: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("//")) {
    return href;
  }
  // `URL` does the `..` arithmetic; the origin is a throwaway that never
  // reaches the output.
  const base = new URL(sourcePath, "https://resolve.invalid/");
  const resolved = new URL(href, base).pathname.replace(/^\//, "");
  return `${CORE_REPO}/blob/main/${resolved}`;
}
