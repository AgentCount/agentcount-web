import { canonicalRuns, totalAgents } from "@/lib/api/aggregate";
import { listRuns } from "@/lib/api/endpoints";
import { OG_CONTENT_TYPE, OG_SIZE, OG_TAGLINE, ogCard, type OgStat } from "@/lib/og";
import { getPublishedRuns } from "@/lib/published-runs";

/**
 * The homepage card: the product overview's claim, with the live population
 * behind it. The census's own figures live on `/census/opengraph-image`,
 * with the page that explains them.
 *
 * Live rather than baked in, because the whole claim this project makes is
 * that its numbers come from a dated sweep. If the API cannot be reached the
 * card still renders, without figures — a plain card is a bad outcome; NO
 * card, which is what an exception here produces, is worse.
 */
export const runtime = "nodejs";
/**
 * Rendered on demand, for the reason every page in this app is: a build must
 * not depend on the API being reachable. See `/census/opengraph-image` for
 * the full rationale — crawlers cache the first card they are given.
 */
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "AgentCount: independent measurement of the agent economy — evidence attached, no score";

export default async function Image() {
  // Best-effort, settled independently: losing the published-runs list
  // should not also cost the population figure.
  const runs = await listRuns().catch(() => null);
  const published = await getPublishedRuns().catch(() => null);

  const stats: OgStat[] = [];
  if (runs && published) {
    const censusRuns = canonicalRuns(runs, new Set(published.map((r) => r.run_id)));
    if (censusRuns.length > 0) {
      stats.push(
        {
          value: totalAgents(censusRuns).toLocaleString("en-US"),
          label: "agents counted - registration census",
        },
        { value: String(censusRuns.length), label: "chains swept" },
      );
    }
  }

  return ogCard({
    title: "The agent economy, audited",
    blurb: OG_TAGLINE,
    stats,
    note: "evidence attached - no score",
  });
}
