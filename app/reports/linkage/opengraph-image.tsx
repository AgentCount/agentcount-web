import { LINKAGE } from "@/lib/linkage";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

/**
 * The card carries the population and the status of the payments figures, and
 * no payment figure of its own.
 *
 * A preview is read by people who never open the page, so it is the last place
 * a withdrawn number may appear: "1 in 991" on a card outlives every caveat on
 * the page it links to. Until AgentCount/agentcount#35 lands there is no
 * payments figure this card is allowed to state.
 */
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "Where the ERC-8004 census meets the payments layer, and why its payment figures are under revision";

export default function Image() {
  const { census, payments } = LINKAGE;
  return ogCard({
    title: "Where registration meets payment",
    blurb:
      "Payments to registered agents are rare. The figures for how rare are superseded, and a pinned recomputation is in progress.",
    stats: [
      {
        value: census.agents.toLocaleString("en-US"),
        label: "registered agents across four chains",
      },
    ],
    note: `census ${census.label} - ${payments.measuredOn} payments study superseded`,
  });
}
