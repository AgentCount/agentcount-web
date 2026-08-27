import Link from "next/link";
import { EmailCapture } from "@/components/EmailCapture";
import { MiniPanel } from "@/components/MiniPanel";
import { TextLink } from "@/components/TextLink";
import { REPORTS } from "@/lib/reports";

export const metadata = {
  title: "Reports",
  description:
    "Every AgentCount census report, at a permanent URL. Each covers one dated sweep, pinned to a block, with the evidence behind every number.",
};

/**
 * The report index.
 *
 * Static: the list is a hand-maintained registry, not census data, so there is
 * nothing here for the API to be down for.
 */
export default function ReportsIndex() {
  // The most recent report — REPORTS[0] by the same convention `app/page.tsx`
  // reads it under ("the report" its homepage digest links out to) — fronts
  // the panel; a report index with one report has no other candidate anyway.
  const latest = REPORTS[0];

  return (
    <>
      {/* Two-column page-head: intro left, a stat box right — the same
          split the homepage hero uses for its own header/panel pair, at
          companion-page scale, so the one figure a reader wants from this
          page (how much the reports actually cover) sits beside the prose
          explaining what a report is rather than below it. Single column
          under `lg`, where two would leave neither half a usable measure.
          See `MiniPanel.tsx`. */}
      <header className="border-b border-edge pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-x-12">
        <div>
          <h1 className="headline text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">Reports</h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
            Each report covers one dated set of sweeps, every one pinned to a
            block, and carries the evidence behind every number in it — including
            the corrections made before publication. A report is an artifact of
            the day it was written: it is not edited to match later data, and if a
            finding is retracted the retraction is published beside it.
          </p>
        </div>
        <MiniPanel
          className="mt-6 lg:mt-0"
          label="Latest report coverage"
          count={latest.agents}
          foot={
            <>
              <span>{REPORTS.length} report{REPORTS.length === 1 ? "" : "s"} published</span>
              <span>{latest.chains.length} chains</span>
            </>
          }
        />
      </header>

      <ul className="mt-10 max-w-4xl">
        {/* The row underlines its title on hover (`group-hover`, not a
            colour) and its rule brightens `border-line` → `border-edge`,
            even though the title link and the "Read the full report →"
            link below both already answer for themselves — the whole row
            leads to one place, so the whole row should say so, not just
            whichever few words happen to be under the pointer. */}
        {REPORTS.map((report) => (
          <li
            key={report.slug}
            className="group border-b border-line py-8 transition-colors first:pt-0 hover:border-edge"
          >
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-xs text-dead">
              <time dateTime={report.date} className="text-muted">
                {report.date}
              </time>
              <span className="text-line">|</span>
              <span>{report.chains.join(", ")}</span>
              <span className="text-line">|</span>
              <span>
                <span className="text-muted">{report.agents}</span> agents
              </span>
            </div>
            <h2 className="headline mt-3 text-[clamp(1.25rem,2.2vw,1.6rem)]">
              <Link
                href={`/reports/${report.slug}`}
                className="text-text underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-edge"
              >
                {report.title}
              </Link>
            </h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              {report.summary}
            </p>
            <p className="mt-4">
              <TextLink
                href={`/reports/${report.slug}`}
                tone="bright"
                className="font-mono text-xs uppercase tracking-[0.1em]"
              >
                Read the full report →
              </TextLink>
            </p>
          </li>
        ))}
      </ul>

      {/* Under the list rather than above it: someone who has just read what
          the reports are is in a position to decide whether they want the next
          one. Above, it would be asking before answering. */}
      <EmailCapture source="reports" />
    </>
  );
}
