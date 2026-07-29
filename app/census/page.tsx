import Link from "next/link";
import { RateBar } from "@/components/RateBar";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { RunProvenance } from "@/components/RunProvenance";
import { Section } from "@/components/Section";
import { StatusLegend } from "@/components/StatusLegend";
import {
  chainsWithRuns,
  getRates,
  listRuns,
  resolveRunForRequest,
  statusVocabulary,
} from "@/lib/api/endpoints";

export const metadata = { title: "Census" };
// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy if
// the API happens to be restarting.
export const dynamic = "force-dynamic";

export default async function CensusPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; chain?: string }>;
}) {
  const sp = await searchParams;
  const run = await resolveRunForRequest(sp);
  const [rates, allRuns] = await Promise.all([getRates(run.run_id), listRuns()]);

  return (
    <>
      <header className="border-b border-edge pb-5">
        <div className="mb-6">
          <ChainSwitcher
            chains={chainsWithRuns(allRuns)}
            current={run.chain}
            basePath="/census"
          />
        </div>
        <h1 className="numeral text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">Census</h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Base rates per rung. Every agent gets the same seven questions; these
          are population counts, not a score for any one of them. A rung&rsquo;s
          segments never sum to the whole population when an earlier failure
          stopped the pipeline — that gap is drawn as its own &ldquo;not
          checked&rdquo; segment rather than folded into whichever status
          happens to render widest.
        </p>
      </header>

      <Section
        title="Base rates"
        aside={`${rates.rungs.length} of 7 rungs implemented`}
        className="mt-10 max-w-5xl"
      >
        <div className="space-y-8">
          {rates.rungs.map((r) => (
            <RateBar key={r.rung} rung={r} total={rates.agent_count} />
          ))}
        </div>
        <div className="mt-10">
          <StatusLegend statuses={statusVocabulary(rates)} />
        </div>
      </Section>

      <Section
        title="Provenance"
        aside="reproducible"
        className="mt-20 max-w-3xl"
        intro={
          <>
            A result you cannot recompute is an opinion. This is everything
            needed to recompute the numbers above.
          </>
        }
      >
        <RunProvenance run={run} />
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <Link
            href="/methodology"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            What each rung measures →
          </Link>
          <Link
            href="/directory"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            Browse the agents behind these counts →
          </Link>
        </p>
      </Section>
    </>
  );
}
