import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Who pays for AgentCount, and what that money cannot buy";

export default function Image() {
  return ogCard({
    title: "Who pays for this",
    blurb:
      "No payment from anyone we audit. No badges, no certification, no placement. No payment can include, exclude, delay or alter a finding.",
  });
}
