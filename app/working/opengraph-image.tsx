import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "The agents that passed every check this run ran";

export default function Image() {
  return ogCard({
    title: "Agents that passed every check",
    // "every rung this run ran" is the page's own qualifier and the reason the
    // list is honest: rung 6 produced no rows, so passing is not yet a claim
    // about being reachable.
    blurb:
      "Every rung this run ran, passed. Not a ranking and not an endorsement - the same seven questions, answered without a fail.",
  });
}
