import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "Pre-flight: check an ERC-8004 registration file before it goes on-chain";

export default function Image() {
  return ogCard({
    title: "Check a file before you mint it",
    blurb:
      "The same checker that judged every agent in the census, run against a document you paste. Nothing is stored.",
  });
}
