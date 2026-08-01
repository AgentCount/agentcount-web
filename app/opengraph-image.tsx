import { getFindings, getMethodology, resolveRunForRequest } from "@/lib/api/endpoints";
import type { Finding } from "@/lib/api/schemas";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard, type OgStat } from "@/lib/og";

/**
 * The homepage card, carrying the four numbers the homepage leads with.
 *
 * Live rather than baked in, because the whole claim this project makes is
 * that its numbers come from a dated sweep — a card quoting figures from a
 * sweep three months ago, shared as though current, would be the exact failure
 * the site is built to avoid. The run date is printed on the card for the same
 * reason.
 *
 * If the API cannot be reached the card still renders, without figures. A
 * plain card is a bad outcome; NO card, which is what an exception here
 * produces, is worse — an unfurled link with no preview reads as a dead
 * domain.
 */
export const runtime = "nodejs";
/**
 * Rendered on demand, for the reason every page in this app is: a build must
 * not depend on the API being reachable.
 *
 * Without this the route prerenders at build time, and CI builds against a
 * closed port on purpose — so the deployed card would be the figureless
 * fallback, baked in and served to the first crawler that asked. ISR would
 * heal it within the revalidation window, but a crawler caches what it was
 * given the first time and may not come back for days.
 *
 * The cost is a Satori render per crawl. The API calls behind it are still
 * cached by `next: { revalidate }`, which is the part that would actually
 * hurt at volume.
 */
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "AgentCount: an independent ERC-8004 conformance census, with the four findings it leads with";

/**
 * Wording taken from the homepage tiles rather than reworded for the card.
 *
 * A preview is read by people who will never open the page, so the two must
 * agree exactly. Shortened where a tile runs to three lines of prose, never
 * restated: "declare no way to reach the agent" is the tile's own phrase.
 */
const LABEL: Record<string, string> = {
  services_absent_or_empty: "declare no way to reach the agent",
  registration_unclaimed: "never say which agent they are",
  attested: "have on-chain feedback",
};

function pct(f: Finding | undefined): string | null {
  if (!f || f.percent === null) return null;
  return `${f.percent.toFixed(1)}%`;
}

export default async function Image() {
  // Both calls are best-effort. `Promise.all` would fail the pair if either
  // rejected, so they are settled independently — losing the spec's MUST count
  // should not also cost the three census figures.
  const findings = await resolveRunForRequest({})
    .then((run) => getFindings(run.run_id))
    .catch(() => null);
  const methodology = await getMethodology().catch(() => null);

  const stats: OgStat[] = [];
  for (const key of Object.keys(LABEL)) {
    const value = pct(findings?.findings.find((f) => f.key === key));
    if (value) stats.push({ value, label: LABEL[key] });
  }
  if (methodology) {
    stats.push({
      value: String(methodology.rung4_must_requirements.length),
      label: "MUST requirements in the spec",
    });
  }

  return ogCard({
    title: "Every ERC-8004 agent, checked",
    stats,
    // The date qualifies the figures above it. Without a run there are no
    // figures either, so the fallback names the census rather than a date.
    note: findings?.run_id
      ? `run ${findings.run_id.slice(0, 8)} - evidence attached, no score`
      : "evidence attached - no score",
  });
}
