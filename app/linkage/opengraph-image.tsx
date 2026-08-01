import { LINKAGE, oneIn } from "@/lib/linkage";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "How much of the payment activity on x402 happens at registered ERC-8004 identities";

export default function Image() {
  const { total, crossCheck, measuredOn } = LINKAGE;
  return ogCard({
    title: "Where registration meets payment",
    blurb:
      "Two layers usually discussed as one, joined on the only thing they share: an address.",
    stats: [
      { value: oneIn(total.paid, total.agents), label: "agents has ever been paid" },
      { value: oneIn(total.x402, total.agents), label: "has ever settled through x402" },
      { value: `${crossCheck.agentLinkedShare}%`, label: "of x402 top-100 volume is agent-linked" },
      { value: String(crossCheck.declaredAgentWallet), label: "of its 138 top sellers are declared agent wallets" },
    ],
    note: `${measuredOn} - four chains, each pinned to a block`,
  });
}
