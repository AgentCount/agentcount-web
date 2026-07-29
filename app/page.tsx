import Link from "next/link";
import { AgentTable } from "@/components/AgentTable";
import { CountTile, FindingTile } from "@/components/FindingTile";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { RunProvenance } from "@/components/RunProvenance";
import { Section } from "@/components/Section";
import { StatusLegend } from "@/components/StatusLegend";
import {
  chainsWithRuns,
  getFindings,
  getMethodology,
  getRates,
  listAgents,
  listRuns,
  resolveRunForRequest,
  statusVocabulary,
} from "@/lib/api/endpoints";
import type { Finding } from "@/lib/api/schemas";

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
  searchParams: Promise<{ run?: string; chain?: string }>;
}) {
  const sp = await searchParams;
  const run = await resolveRunForRequest(sp);
  const [{ findings }, methodology, rates, sample, allRuns] = await Promise.all([
    getFindings(run.run_id),
    getMethodology(),
    getRates(run.run_id),
    listAgents({ run: run.run_id, limit: 3 }),
    listRuns(),
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
      {/* The masthead states the scope and the pinned block on one line — the
          two facts that qualify every number below it. */}
      <header className="border-b border-edge pb-6">
        <div className="mb-6">
          <ChainSwitcher
            chains={chainsWithRuns(allRuns)}
            current={run.chain}
            basePath="/"
          />
        </div>
        <h1 className="numeral max-w-[18ch] text-[clamp(2rem,4.2vw,3.25rem)] text-text">
          What we found when we checked every ERC-8004 agent on {run.chain}
        </h1>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-xs text-dead">
          <span>
            <span className="text-muted">
              {run.agent_count?.toLocaleString("en-US") ?? "—"}
            </span>{" "}
            agents
          </span>
          <span className="text-line">|</span>
          <span>
            block{" "}
            <span className="text-muted">
              {run.pinned_block !== null
                ? run.pinned_block.toLocaleString("en-US")
                : "—"}
            </span>
          </span>
          <span className="text-line">|</span>
          <span>
            run <span className="text-muted">{run.run_id.slice(0, 8)}</span>
          </span>
          <span className="text-line">|</span>
          <span>no score, no ranking, no aggregate</span>
        </div>
      </header>

      <section aria-label="What this run found" className="mt-12">
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-4">
          <FindingTile index={1} finding={unreachable}>
            of valid registration documents declare no way to reach the agent —
            no <code className="font-mono text-text">services</code> entry at
            all, or one with nothing in it.
          </FindingTile>

          <FindingTile index={2} finding={unclaimed}>
            of conforming documents never say which agent they belong to. The
            registration entry that would bind a document to its on-chain id is
            only recommended, so most omit it and rung 5 records{" "}
            <em className="not-italic text-claim">unclaimed</em> — neither a
            pass nor a fail.
          </FindingTile>

          <FindingTile index={3} finding={attested}>
            have at least one on-chain feedback entry — and those agents are{" "}
            <em className="not-italic text-text">less</em> likely to have a
            document that resolves than agents with none:{" "}
            {pct(attestedResolvable)} against {pct(unattestedResolvable)}.
          </FindingTile>

          <CountTile
            index={4}
            value={mustCount}
            source={`spec ${methodology.spec_commit.slice(0, 12)} · checker ${methodology.checker_version}`}
          >
            the number of MUST requirements ERC-8004 places on a registration
            file
            {allConditional && (
              <>
                {mustCount === 1
                  ? " — and it is conditional"
                  : " — all of them conditional"}
                , so a document that omits{" "}
                <code className="font-mono text-text">registrations</code>{" "}
                entirely has nothing it must do at all.
              </>
            )}
          </CountTile>
        </div>

        <p className="mt-12 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          On that third number: a separate investigation sampled 300 of the{" "}
          {attested.numerator.toLocaleString("en-US")}
          {" agents carrying feedback "}
          and read the Reputation Registry directly at this run&rsquo;s pinned
          block. It estimates that one client address accounts for 42–53% of
          them, and six addresses for the large majority. That is a{" "}
          <span className="text-text">sample with a confidence interval</span>,
          not a count like the four numbers above — which is exactly why it is
          not printed as one.
        </p>
      </section>

      <Section
        title="One agent, seven rungs"
        aside="first three in the registry"
        className="mt-20 max-w-5xl"
        intro={
          <>
            Exactly as the directory renders them. A rung with no row was never
            reached this run — rung 6 is not yet implemented, so it reads as
            not checked for everyone, never as a failure.
          </>
        }
      >
        <AgentTable agents={sample.items} />
        <div className="mt-5">
          <StatusLegend statuses={statusVocabulary(rates)} />
        </div>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <Link
            href="/directory"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            Search all {run.agent_count?.toLocaleString("en-US") ?? ""} agents →
          </Link>
          <Link
            href="/working"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            Agents that passed every check →
          </Link>
        </p>
      </Section>

      <Section
        title="Provenance"
        aside="reproducible"
        className="mt-20 max-w-3xl"
        intro={
          <>
            Every number on this page comes from one sweep, pinned to one
            block. A result you cannot recompute is an opinion; this is the
            command that recomputes it.
          </>
        }
      >
        <RunProvenance run={run} />
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <Link
            href="/census"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            Base rates per rung →
          </Link>
          <Link
            href="/methodology"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            How each rung is measured →
          </Link>
        </p>
      </Section>
    </>
  );
}
