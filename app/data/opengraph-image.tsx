import { PUBLISHED_RUNS, archiveSize } from "@/lib/published-runs";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Every canonical run of the census, downloadable in full";

export default function Image() {
  const agents = PUBLISHED_RUNS.reduce((n, r) => n + (r.swept ?? 0), 0);
  const bytes = PUBLISHED_RUNS.reduce((n, r) => n + r.archive_bytes, 0);
  return ogCard({
    title: "Every run, downloadable",
    blurb:
      "No account, no key, no rate limit. One permanent URL per run, and the bytes at it never change.",
    stats: [
      { value: String(PUBLISHED_RUNS.length), label: "published runs" },
      { value: agents.toLocaleString("en-US"), label: "agents across them" },
      { value: archiveSize(bytes), label: "for the whole census" },
      { value: "CC BY", label: "use it for anything, cite the run id" },
    ],
    note: "sha256 committed to git - the history attests the archives",
  });
}
