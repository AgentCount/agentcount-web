import Link from "next/link";
import { AgentTable } from "@/components/AgentTable";
import { CountTile, FindingTile } from "@/components/FindingTile";
import { RunProvenance } from "@/components/RunProvenance";
import { StatusLegend } from "@/components/StatusLegend";
import {
  getFindings,
  getMethodology,
  getRates,
  listAgents,
  resolveRun,
  statusVocabulary,
} from "@/lib/api/endpoints";
import type { Finding } from "@/lib/api/schemas";
import { BRAND } from "@/lib/brand";

// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy if
// the API happens to be restarting.
export const dynamic = "force-dynamic";

/**
 * Pull one finding by key, or throw naming the key.
 *
 * Rendering "—" for a finding the API stopped sending would be worse than
 * failing: the missing number IS the page, and a homepage that quietly loses
 * its headline is the kind of breakage nobody notices for a week.
 */
function pick(findings: Finding[], key: string): Finding {
  const f = findings.find((x) => x.key === key);
  if (!f) {
    throw new Error(
      `the findings endpoint returned no '${key}' — the homepage cannot render without it`,
    );
  }
  return f;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { run: runParam } = await searchParams;
  const run = await resolveRun(runParam);
  const [{ findings }, methodology, rates, sample] = await Promise.all([
    getFindings(run.run_id),
    getMethodology(),
    getRates(run.run_id),
    listAgents({ run: run.run_id, limit: 3 }),
  ]);

  const unreachable = pick(findings, "services_absent_or_empty");
  const unclaimed = pick(findings, "registration_unclaimed");
  const attested = pick(findings, "attested");
  const attestedResolvable = pick(findings, "attested_resolvable");
  const unattestedResolvable = pick(findings, "unattested_resolvable");

  const pct = (f: Finding) => (f.percent === null ? "—" : `${f.percent.toFixed(1)}%`);
  const mustCount = methodology.rung4_must_requirements.length;
  const allConditional = methodology.rung4_must_requirements.every((r) => r.conditional);

  return (
    <>
      <h1 className="sr-only">{BRAND.name}</h1>
      <p className="max-w-prose leading-relaxed text-muted">
        An independent conformance census of every ERC-8004 agent on{" "}
        {run.chain}. Seven questions per agent, the evidence behind every
        answer, and no score anywhere — what the seven answers add up to is the
        reader&rsquo;s call, not ours.
      </p>

      <section aria-label="What this run found" className="mt-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          <FindingTile finding={unreachable}>
            of valid registration documents declare no way to reach the agent —
            no <code className="rounded bg-panel px-1">services</code> entry at
            all, or one with nothing in it.
          </FindingTile>

          <FindingTile finding={unclaimed}>
            of conforming documents never say which agent they belong to. The
            registration entry that would bind a document to its on-chain id is
            only recommended, so most omit it and rung 5 records{" "}
            <em>unclaimed</em> — neither a pass nor a fail.
          </FindingTile>

          <FindingTile finding={attested}>
            have at least one on-chain feedback entry — and those agents are{" "}
            <em>less</em> likely to have a document that resolves than agents
            with none: {pct(attestedResolvable)} against{" "}
            {pct(unattestedResolvable)}.
          </FindingTile>

          <CountTile
            value={mustCount}
            source={`spec commit ${methodology.spec_commit.slice(0, 12)}, checker ${methodology.checker_version}`}
          >
            the number of MUST requirements ERC-8004 places on a registration
            file
            {allConditional && (
              <>
                {mustCount === 1 ? " — and it is conditional" : " — all of them conditional"},
                so a document that omits{" "}
                <code className="rounded bg-panel px-1">registrations</code>{" "}
                entirely has nothing it must do at all.
              </>
            )}
          </CountTile>
        </div>

        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted">
          On that third number: a separate investigation sampled 300 of the{" "}
          {attested.numerator.toLocaleString("en-US")} agents carrying feedback
          and read the Reputation Registry directly at this run&rsquo;s pinned
          block. It estimates that one client address accounts for 42–53% of
          them, and six addresses for the large majority. That is a{" "}
          <strong className="text-text">sample with a confidence interval</strong>
          , not a count like the four numbers above — which is exactly why it is
          not printed as one.
        </p>
      </section>

      <section aria-label="What a directory row looks like" className="mt-14">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Every agent, seven rungs, side by side
        </h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
          The first three agents in the registry, exactly as the directory
          renders them. A rung with no row was never reached this run — rung 6
          is not yet implemented, so it reads as not checked for everyone,
          never as a failure.
        </p>
        <div className="mt-3 max-w-4xl">
          <AgentTable agents={sample.items} />
        </div>
        <div className="mt-3 max-w-4xl">
          <StatusLegend statuses={statusVocabulary(rates)} />
        </div>
        <p className="mt-4 text-sm">
          <Link href="/directory" className="text-accent hover:underline">
            Search all {run.agent_count?.toLocaleString("en-US") ?? ""} agents →
          </Link>
          <span className="mx-3 text-dead">·</span>
          <Link href="/working" className="text-accent hover:underline">
            Agents that passed every check we run →
          </Link>
        </p>
      </section>

      <section aria-label="Run provenance" className="mt-14 max-w-4xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          This run
        </h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
          Every number on this page comes from one sweep, pinned to one block.
          The command below reproduces it.
        </p>
        <div className="mt-3 rounded-lg border border-line bg-panel/60 px-4 py-3">
          <RunProvenance run={run} />
        </div>
        <p className="mt-4 text-sm">
          <Link href="/census" className="text-accent hover:underline">
            Base rates for every rung →
          </Link>
          <span className="mx-3 text-dead">·</span>
          <Link href="/methodology" className="text-accent hover:underline">
            Methodology →
          </Link>
        </p>
      </section>
    </>
  );
}
