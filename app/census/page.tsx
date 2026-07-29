import Link from "next/link";
import { RateBar } from "@/components/RateBar";
import { RunProvenance } from "@/components/RunProvenance";
import { StatusLegend } from "@/components/StatusLegend";
import { getRates, resolveRun, statusVocabulary } from "@/lib/api/endpoints";

export const metadata = { title: "Census" };
// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy if
// the API happens to be restarting.
export const dynamic = "force-dynamic";

export default async function CensusPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { run: runParam } = await searchParams;
  const run = await resolveRun(runParam);
  const rates = await getRates(run.run_id);

  return (
    <>
      <h1 className="text-2xl font-bold">Census</h1>
      <p className="mt-2 max-w-prose leading-relaxed text-muted">
        Base rates per rung. Every agent gets the same seven questions; these
        are population counts, not a score for any one of them. A rung&rsquo;s
        segments never sum to the whole population when an earlier failure
        stopped the pipeline — that gap is drawn as its own &ldquo;not
        checked&rdquo; segment rather than folded into whichever status happens
        to render widest.
      </p>

      <div className="mt-5 max-w-5xl">
        <StatusLegend statuses={statusVocabulary(rates)} />
      </div>

      <section className="mt-6 max-w-5xl space-y-7">
        {rates.rungs.map((r) => (
          <RateBar key={r.rung} rung={r} total={rates.agent_count} />
        ))}
      </section>

      <section className="mt-12 max-w-4xl">
        <h2 className="text-lg font-semibold">Provenance</h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
          A result you cannot recompute is an opinion. This is everything
          needed to recompute the numbers above.
        </p>
        <div className="mt-3 rounded-lg border border-line bg-panel/60 px-4 py-3">
          <RunProvenance run={run} />
        </div>
        <p className="mt-4 text-sm">
          <Link href="/methodology" className="text-accent hover:underline">
            What each rung measures →
          </Link>
          <span className="mx-3 text-dead">·</span>
          <Link href="/directory" className="text-accent hover:underline">
            Browse the agents behind these counts →
          </Link>
        </p>
      </section>
    </>
  );
}
