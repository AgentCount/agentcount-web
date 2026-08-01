import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Every AgentCount census report, at a permanent URL";

export default function Image() {
  return ogCard({
    title: "Census reports",
    blurb:
      "One dated set of sweeps each, every one pinned to a block, with the evidence behind every number - including the corrections.",
  });
}
