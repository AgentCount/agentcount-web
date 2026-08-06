import { LINKAGE } from "@/lib/linkage";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

/**
 * The card carries the population and the subject, and no payment figure.
 *
 * A preview is read by people who never open the page, so it is the last place
 * a number may appear that the page itself does not carry: a rate on a card
 * outlives every qualification on the page it links to. The card states what
 * the page states, and the page states no rate.
 */
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "Where the ERC-8004 census identity layer meets the payments layer, and the population it is read against";

export default function Image() {
  const { census } = LINKAGE;
  return ogCard({
    title: "Where registration meets payment",
    blurb:
      "Two layers usually discussed as one, joined on the only thing they share: an address.",
    stats: [
      {
        value: census.agents.toLocaleString("en-US"),
        label: "registered agents across four chains",
      },
      {
        value: String(census.chains.length),
        label: "chains, each pinned to a block",
      },
    ],
    note: `census ${census.label} - evidence attached, no score`,
  });
}
