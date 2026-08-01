import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OutboundLink } from "@/components/OutboundLink";
import { ReportBody } from "@/components/ReportBody";
import { CORE_REPO, REPORTS, findReport } from "@/lib/reports";
import { readReportMarkdown, stripLeadingH1 } from "@/lib/reports-content";

type Params = { slug: string };

/**
 * Prerendered, one page per registry entry.
 *
 * Unlike the agent permalinks — which cannot be built at deploy time and are
 * therefore rendered on demand — there are a handful of reports, their content
 * is a file in this repo, and none of it comes from the API. Building them is
 * cheap and means a citation resolves even if everything else is down.
 *
 * `dynamicParams: false` makes an unknown slug a 404 at the edge rather than
 * an attempt to read a file that is not there.
 */
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return REPORTS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = findReport(slug);
  if (!report) return {};
  return {
    title: report.title,
    description: report.summary,
    openGraph: {
      title: report.title,
      description: report.summary,
      type: "article",
      publishedTime: report.date,
    },
  };
}

export default async function ReportPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const report = findReport(slug);
  if (!report) notFound();

  const markdown = stripLeadingH1(await readReportMarkdown(report.file));

  return (
    <article>
      <header className="border-b border-edge pb-7">
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
          <span className="text-line">|</span>
          <span>no score, no ranking, no aggregate</span>
        </div>
        <h1 className="numeral mt-3 max-w-[24ch] text-[clamp(2rem,4vw,3rem)] text-text">
          {report.title}
        </h1>
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-muted">
          {report.summary}
        </p>
      </header>

      <div className="mt-4 max-w-none">
        <ReportBody markdown={markdown} sourcePath={report.source} />
      </div>

      {/* Provenance, in the same shape the rest of the site uses: where this
          document is written, so a reader can diff the published copy against
          the working one rather than take this page's word for it. */}
      <footer className="mt-20 max-w-prose border-t border-edge pt-6">
        <span className="label">This document</span>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Written in the core repository at{" "}
          <OutboundLink href={`${CORE_REPO}/blob/main/${report.source}`}>
            <code className="font-mono text-xs">{report.source}</code>
          </OutboundLink>
          , beside the analysis documents and run manifests it cites, and
          published here unchanged. Every link in it points back into that
          repository.
        </p>
        <p className="mt-5 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <Link
            href="/methodology"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            How each rung is measured →
          </Link>
          <Link
            href="/neutrality"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            Who pays for this →
          </Link>
          <Link
            href="/reports"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            All reports →
          </Link>
        </p>
      </footer>
    </article>
  );
}
