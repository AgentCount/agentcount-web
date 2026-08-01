import probe from "@/content/coverage-probe.json";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";
import { getPublishedRuns, sweptChains } from "@/lib/published-runs";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt =
  "Coverage: every chain the registry is deployed on, and which of them the census sweeps";

type ProbedChain = { slug: string; agents: number | null; status: string };

export default async function Image() {
  const chains = (probe as { chains: ProbedChain[] }).chains;
  const swept = new Set(sweptChains(await getPublishedRuns()));
  const counted = chains.filter((c) => c.status === "ok" && c.agents !== null);
  const total = counted.reduce((n, c) => n + (c.agents ?? 0), 0);
  const sweptTotal = counted
    .filter((c) => swept.has(c.slug))
    .reduce((n, c) => n + (c.agents ?? 0), 0);
  const pct = total === 0 ? "—" : `${((sweptTotal / total) * 100).toFixed(1)}%`;
  return ogCard({
    title: "What the census covers",
    blurb:
      "Every chain the canonical registry is deployed on, counted the same way the census counts — and which of them are swept.",
    stats: [
      { value: String(counted.length), label: "deployments counted" },
      { value: total.toLocaleString("en-US"), label: "registrations found" },
      { value: pct, label: "of them on swept chains" },
      { value: "1 cmd", label: "to recompute the probe" },
    ],
    note: "ownerOf binary search - public RPCs, no keys",
  });
}
