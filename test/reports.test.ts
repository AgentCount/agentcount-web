import { describe, expect, it } from "vitest";
import { CORE_REPO, REPORTS, findReport, resolveReportLink } from "../lib/reports";

/**
 * Reports are written as repository documents and published as web pages, and
 * the link rewriting is the whole join between those two facts. It gets no
 * visual feedback — a link resolved one directory wrong still renders as a
 * link, and only 404s when somebody clicks it.
 */
describe("resolveReportLink", () => {
  const SOURCE = "docs/reports/2026-07-30-four-chain.md";

  it("resolves a sibling report against the source directory, not the URL", () => {
    // The published URL is /reports/2026-07-census — two segments deep in a
    // completely different tree. Resolving against THAT is the bug this
    // function exists to prevent.
    expect(resolveReportLink("2026-07-29-base-cfbfcc01.md", SOURCE)).toBe(
      `${CORE_REPO}/blob/main/docs/reports/2026-07-29-base-cfbfcc01.md`,
    );
  });

  it("walks `..` up to the repository root", () => {
    expect(resolveReportLink("../../METHODOLOGY.md", SOURCE)).toBe(
      `${CORE_REPO}/blob/main/METHODOLOGY.md`,
    );
    expect(resolveReportLink("../../analysis/celo.md", SOURCE)).toBe(
      `${CORE_REPO}/blob/main/analysis/celo.md`,
    );
  });

  it("leaves absolute URLs and in-page anchors alone", () => {
    expect(resolveReportLink("https://example.com/x", SOURCE)).toBe("https://example.com/x");
    expect(resolveReportLink("mailto:probes@agentcount.ai", SOURCE)).toBe(
      "mailto:probes@agentcount.ai",
    );
    expect(resolveReportLink("#section-4", SOURCE)).toBe("#section-4");
    // Protocol-relative. Rewriting one would produce a repo path out of
    // somebody else's host.
    expect(resolveReportLink("//example.com/x", SOURCE)).toBe("//example.com/x");
  });

  it("cannot escape above the repository root", () => {
    // `URL` clamps the walk, so an over-deep `..` lands at the root rather
    // than producing a path with `..` still in it.
    expect(resolveReportLink("../../../../../etc/passwd", SOURCE)).toBe(
      `${CORE_REPO}/blob/main/etc/passwd`,
    );
  });
});

describe("the report registry", () => {
  it("has a unique slug per report", () => {
    const slugs = REPORTS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("finds a report by slug and returns undefined for anything else", () => {
    expect(findReport("2026-07-census")?.title).toContain("four chains");
    expect(findReport("no-such-report")).toBeUndefined();
  });

  it("dates every report as a plain ISO day", () => {
    // The dateline renders this into a `<time dateTime=…>`, and the OG card
    // prints it verbatim. A `Date`-parsed value would be rendered in the
    // server's timezone and could show the wrong day.
    for (const r of REPORTS) expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
