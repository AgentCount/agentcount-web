import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Methodology: what each of the seven checks measures";

export default function Image() {
  return ogCard({
    title: "What we measure",
    blurb:
      "Seven checks, each a separate question with its own evidence. Six statuses that never collapse into each other.",
  });
}
