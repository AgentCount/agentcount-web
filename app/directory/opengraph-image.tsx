import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Directory: search and filter every agent in the census";

export default function Image() {
  return ogCard({
    title: "Search every agent",
    blurb:
      "Filter by any check and any status, search names, descriptions and owner addresses. Every row links to its evidence.",
  });
}
