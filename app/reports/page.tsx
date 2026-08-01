import Link from "next/link";
import { EmailCapture } from "@/components/EmailCapture";
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
  return (
    <>
      <header className="border-b border-edge pb-6">
        <h1 className="numeral text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">Reports</h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Each report covers one dated set of sweeps, every one pinned to a
          block, and carries the evidence behind every number in it — including
          the corrections made before publication. A report is an artifact of
          the day it was written: it is not edited to match later data, and if a
          finding is retracted the retraction is published beside it.
        </p>
      </header>

      <ul className="mt-10 max-w-4xl">
        {REPORTS.map((report) => (
          <li key={report.slug} className="border-b border-line py-8 first:pt-0">
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
            <h2 className="numeral mt-3 text-[clamp(1.25rem,2.2vw,1.6rem)]">
              <Link href={`/reports/${report.slug}`} className="text-text">
                {report.title}
              </Link>
            </h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              {report.summary}
            </p>
            <p className="mt-4">
              <Link
                href={`/reports/${report.slug}`}
                className="font-mono text-xs uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
              >
                Read the full report →
              </Link>
            </p>
          </li>
        ))}
      </ul>

      {/* Under the list rather than above it: someone who has just read what
          the reports are is in a position to decide whether they want the next
          one. Above, it would be asking before answering. */}
      <EmailCapture />
    </>
  );
}
