import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Census: base rates per rung across the whole population";

export default function Image() {
  return ogCard({
    title: "Base rates per rung",
    blurb:
      "Every agent gets the same seven questions. These are population counts, not a score for any one of them.",
  });
}
