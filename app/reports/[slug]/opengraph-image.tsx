import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";
import { REPORTS, findReport } from "@/lib/reports";

/**
 * A report's card carries its scope, not its findings.
 *
 * The homepage card quotes live figures because the homepage is a live view. A
 * report is a dated artifact and its numbers must never be re-fetched — a card
 * showing this week's attestation rate above a July report's title would
 * misattribute a number to a document that does not contain it. Everything
 * here comes from the registry entry, which is edited in the same commit as
 * the report itself.
 */
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "An AgentCount census report";

export function generateStaticParams() {
  return REPORTS.map((r) => ({ slug: r.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = findReport(slug);

  return ogCard({
    title: report?.title ?? "Census report",
    blurb: report
      ? `${report.agents} agents across ${report.chains.join(", ")}, each chain pinned to a block.`
      : undefined,
    note: report ? `${report.date} - evidence attached, no score` : undefined,
  });
}
