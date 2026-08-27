import { describe, expect, it } from "vitest";
import probe from "@/content/coverage-probe.json";
import { canonicalChainSlug, chainDisplayName } from "@/lib/chains";
import { getPublishedRuns, sweptChains } from "@/lib/published-runs";

/**
 * The coverage page compares two vocabularies: the census names Optimism
 * `op` in its runs, the deployment probe names it `optimism`. Comparing the
 * raw strings published a swept chain as "not swept" and dropped its agents
 * from the coverage percentage — a wrong claim that looked like an ordinary
 * table row, which is exactly the kind of error nobody reports.
 *
 * These assert the reconciliation, not the current chain list, so adding a
 * chain does not fail them.
 */
describe("chain slugs reconcile across the census and the probe", () => {
  it("the probe's spelling of Optimism resolves to the census's", () => {
    expect(canonicalChainSlug("optimism")).toBe("op");
    // ...and the census's own spelling is already canonical.
    expect(canonicalChainSlug("op")).toBe("op");
  });

  it("leaves every other slug untouched", () => {
    for (const slug of ["base", "bsc", "mainnet", "celo", "megaeth"]) {
      expect(canonicalChainSlug(slug)).toBe(slug);
    }
  });

  it("every chain with a published run is recognised by the probe's list", async () => {
    // The regression that shipped: a swept chain the coverage page could not
    // match, and therefore reported as uncovered.
    const probedSlugs = new Set(
      (probe as { chains: { slug: string }[] }).chains.map((c) =>
        canonicalChainSlug(c.slug),
      ),
    );
    const unmatched = sweptChains(await getPublishedRuns())
      .map(canonicalChainSlug)
      .filter((slug) => !probedSlugs.has(slug));
    expect(unmatched).toEqual([]);
  });

  it("both spellings still have a display name, since a slug is what a run says", () => {
    expect(chainDisplayName("op")).toBeTruthy();
    expect(chainDisplayName("optimism")).toBeTruthy();
  });
});
