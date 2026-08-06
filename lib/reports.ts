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
  /**
   * The file under `content/reports/`, without the extension.
   *
   * `null` for a report that is its own route rather than a markdown
   * document — `/reports/linkage` is a rendered page because its argument is
   * a set of live joins and tables, not prose. It appears in this index like
   * any other report and is deliberately excluded from the markdown route's
   * `generateStaticParams`, which would otherwise try to read a file that
   * does not exist and fail the build.
   */
  file: string | null;
  /** Path of the source file in the core repo, for the provenance line. */
  source: string;
};

/**
 * Newest first. Adding a report is this entry plus the markdown file — the
 * index, the routes, the sitemap and the card all read from here.
 */
export const REPORTS: Report[] = [
  {
    slug: "linkage",
    title: "Identity and payments: what the money actually does",
    date: "2026-07-31",
    summary:
      "Where the census identity layer meets the payments layer, across 369,130 registered agents on four chains. Payments to registered agents are rare; the 2026-07-30 figures for how rare are superseded, and a pinned recomputation is in progress.",
    chains: ["base", "bsc", "mainnet", "celo"],
    // The live population, because this entry describes a page that reports on
    // the current census. The 2026-07 report below keeps its own 354,858: that
    // is the population the document was written against and editing it would
    // misdescribe a dated artifact.
    agents: "369,130",
    file: null,
    source: "analysis/linkage",
  },
  {
    slug: "2026-07-census",
    title: "ERC-8004 conformance census: four chains",
    date: "2026-07-30",
    // The payments sentence this summary used to carry was withdrawn on
    // 2026-08-06 (AgentCount/agentcount#35). The report itself is unedited —
    // a dated artifact is not rewritten to match later data — but the index
    // card is this site's own copy, and it must not put a superseded figure in
    // front of a reader as though it were current.
    summary:
      "354,858 agents across Base, BNB Chain, Ethereum mainnet and Celo, each pinned to a block. Attestation ranges 44× between chains. The report's payments figures are superseded and are being recomputed against a pinned run.",
    chains: ["base", "bsc", "mainnet", "celo"],
    agents: "354,858",
    file: "2026-07-census",
    source: "docs/reports/2026-07-30-four-chain.md",
  },
];

export function findReport(slug: string): Report | undefined {
  return REPORTS.find((r) => r.slug === slug);
}

/** The reports rendered from markdown — everything the `[slug]` route owns. */
export function markdownReports(): Report[] {
  return REPORTS.filter((r) => r.file !== null);
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
