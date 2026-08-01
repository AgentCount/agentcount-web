import Link from "next/link";
import { AgentTable } from "@/components/AgentTable";
import { AllRunsProvenance } from "@/components/AllRunsProvenance";
import { EmailCapture } from "@/components/EmailCapture";
import { CountTile, FindingTile } from "@/components/FindingTile";
import { allPassFacets } from "@/components/DirectoryControls";
import { RateBar } from "@/components/RateBar";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { RunProvenance } from "@/components/RunProvenance";
import { Section } from "@/components/Section";
import { StatusLegend } from "@/components/StatusLegend";
import { aggregateFinding, canonicalRuns, totalAgents } from "@/lib/api/aggregate";
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
import type { Finding, Findings } from "@/lib/api/schemas";
import { PUBLISHED_RUNS } from "@/lib/published-runs";
import { REPORTS } from "@/lib/reports";

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

/** The five keys this page's four tiles are built from. */
const KEYS = [
  "services_absent_or_empty",
  "registration_unclaimed",
  "attested",
  "attested_resolvable",
  "unattested_resolvable",
] as const;

/**
 * The homepage answers a different question depending on how it was reached.
 *
 * Without `?chain=` it is the census: every agent on every swept chain, one
 * population, population-weighted rates. That is the default because it is
 * the only view whose headline is true of ERC-8004 rather than of one chain's
 * most active platform — the correction the four-chain report exists to make.
 *
 * With `?chain=` (or `?run=`) it is one sweep, exactly as before. Every
 * existing deep link keeps its meaning, and the chain switcher below the hero
 * moves between the two.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; chain?: string }>;
}) {
  const sp = await searchParams;
  const allRuns = await listRuns();
  const perChain = sp.chain !== undefined || sp.run !== undefined;

  // One sweep per chain, largest population first — restricted to runs whose
  // archive has been published, because "finished most recently" is not the
  // same question as "is the census" and the API cannot tell them apart. See
  // `canonicalRuns`.
  const censusRuns = canonicalRuns(
    allRuns,
    new Set(PUBLISHED_RUNS.map((r) => r.run_id)),
  );

  // The run that the sample table, the rates and the status legend describe.
  // In all-chains mode there is no single run those could honestly be "of",
  // so they take the largest contributor and the page says which.
  const run = perChain ? await resolveRunForRequest(sp) : censusRuns[0];
  if (!run) {
    throw new Error("no completed run is available yet");
  }

  const [methodology, rates, sample] = await Promise.all([
    getMethodology(),
    getRates(run.run_id),
    listAgents({ run: run.run_id, limit: 3 }),
  ]);

  // Per-chain reads one findings document; the census reads one per chain and
  // sums them. `aggregateFinding` is the only place in this app that divides —
  // see its module doc for why the rule is suspended there and nowhere else.
  const perRunFindings: Findings[] = await Promise.all(
    (perChain ? [run] : censusRuns).map((r) => getFindings(r.run_id)),
  );
  const finding = (key: string): Finding =>
    perChain ? pick(perRunFindings[0].findings, key) : aggregateFinding(perRunFindings, key);

  const [unreachable, unclaimed, attested, attestedResolvable, unattestedResolvable] =
    KEYS.map(finding);

  const pct = (f: Finding) => (f.percent === null ? "—" : `${f.percent.toFixed(1)}%`);
  const mustCount = methodology.rung4_must_requirements.length;
  const allConditional = methodology.rung4_must_requirements.every((r) => r.conditional);
  const population = totalAgents(censusRuns);

  /**
   * The Base-only attestation investigation, which the census view must not
   * silently reattribute to the population.
   *
   * It sampled 300 agents from ONE chain at ONE pinned block. In per-chain
   * mode on Base that is simply this page's own number; in census mode the
   * paragraph still belongs on the page — it is the strongest caveat on the
   * third tile — but it has to name Base and use Base's own count, not the
   * four-chain total. On a chain with no such investigation it is omitted
   * rather than reworded into a claim nobody checked.
   */
  const baseIndex = perChain
    ? run.chain === "base"
      ? 0
      : -1
    : censusRuns.findIndex((r) => r.chain === "base");
  const baseAttested =
    baseIndex >= 0 ? pick(perRunFindings[baseIndex].findings, "attested") : null;

  const report = REPORTS[0];

  // Where /working went: the directory with every rung this run reported fixed
  // to `pass`. Built from the run's own rates, so rung 6 — which produces no
  // rows — is not among the conditions and nobody is credited for it.
  const workingHref = `/directory?chain=${encodeURIComponent(run.chain)}&${allPassFacets(
    rates,
  )
    .map((f) => `facet=${encodeURIComponent(`${f.rung}:${f.status}`)}`)
    .join("&")}`;

  /**
   * How the headline states its own scope — and it must state it.
   *
   * "We checked all N registered AI agents" is false, and falsifiable by the
   * first reader who looks: agents are registered under ERC-8004 on far more
   * chains than this census sweeps, so "all" over a bare count claims a
   * completeness nobody has. That is precisely the class of overclaim this
   * census exists to catch, and it cannot appear in its own H1.
   *
   * "All" survives only because the scope is named in the same sentence: all
   * the agents on these chains, which IS a complete count of a stated
   * population.
   *
   * The phrasing degrades with the data rather than assuming four. On a day
   * when one chain's sweep has not finished, or its archive is not yet
   * published, the sentence names the chains actually summed instead of
   * saying "four" over three — the runs table directly beneath it lists them,
   * and a headline that disagrees with the table under it destroys the trust
   * both exist to build.
   */
  const chainNames = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(censusRuns.map((r) => r.chain));
  const scope =
    censusRuns.length === 4
      ? "the four largest chains"
      : `${chainNames}`;

  return (
    <>
      <header className="border-b border-edge pb-6">
        {perChain ? (
          <>
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
              {/* "no per-agent aggregate", not "no aggregate": this page now
                  publishes a population-weighted rate, and a line claiming
                  otherwise directly under one would be the site contradicting
                  itself. The promise that actually holds — and the one that
                  matters — is that an agent's seven rungs are never summed
                  into a score. See `components/RungStrip.tsx`. */}
              <span>no score, no ranking, no per-agent aggregate</span>
            </div>
          </>
        ) : (
          <>
            {/* The population IS the claim, so it is the sentence — with its
                scope named in the same breath. See `scope` above for why "all"
                is only permissible next to the population it is all of. Both
                the number and the scope come from the runs, never typed, so a
                fifth chain or an unfinished sweep moves them without an edit
                here. */}
            <h1 className="numeral max-w-[22ch] text-[clamp(2rem,4.2vw,3.25rem)] text-text">
              We checked all {population.toLocaleString("en-US")} AI agents
              registered on {scope}.
            </h1>
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-muted">
              Seven yes/no questions per agent, every answer recomputable. No
              scores, no rankings — <span className="text-text">counts</span>.
            </p>
            <div className="mt-6">
              <AllRunsProvenance runs={censusRuns} />
            </div>
            <p className="mt-4 font-mono text-xs text-dead">
              no score, no ranking, no per-agent aggregate
            </p>
          </>
        )}
      </header>

      {/* Below the hero, not above it: the first thing a reader meets is the
          population, and the switcher is the instrument for taking it apart.
          It controls the findings section it sits on top of. */}
      <div className="mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <span className="label">Findings for</span>
        <ChainSwitcher
          chains={chainsWithRuns(allRuns)}
          current={perChain ? run.chain : ""}
          basePath="/"
          allLabel="all chains"
        />
      </div>

      <section aria-label="What this census found" className="mt-8">
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

        {/* The report is the long-form argument these figures summarise. Its
            own headline counts come from the report's metadata, not from the
            live census: the report covers the chains it covered, at the block
            it was pinned to, and interpolating today's numbers into a link to
            a dated document would misdescribe it the moment either moves. */}
        <p className="mt-10">
          <Link
            href={`/reports/${report.slug}`}
            className="font-mono text-xs uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            Read the full report: {report.chains.length} chains, {report.agents}{" "}
            agents →
          </Link>
        </p>

        {baseAttested && (
          <p className="mt-12 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
            On that third number: a separate investigation sampled 300 of the{" "}
            {baseAttested.numerator.toLocaleString("en-US")}
            {" agents carrying feedback on Base "}
            and read the Reputation Registry directly at that run&rsquo;s pinned
            block. It estimates that one client address accounts for 42–53% of
            them, and six addresses for the large majority. That is a{" "}
            <span className="text-text">sample with a confidence interval</span>,
            not a count like the four numbers above — which is exactly why it is
            not printed as one.
          </p>
        )}
      </section>

      {/* What /census used to be.

          It was never a separate subject — it is the same seven questions as
          the tiles above, answered for the whole population instead of
          summarised into four headlines. As its own nav item it asked a reader
          to already know that "Census" meant "per-rung base rates"; as a
          section directly under the findings it is simply the next level of
          detail, which is what it always was.

          Scoped to `run` — one chain, one block — because a stacked bar over
          summed chains would hide the 44x spread between them that the report
          exists to show. The chain switcher above changes it. */}
      <Section
        title="Every rung, every status"
        aside={`base rates on ${run.chain}`}
        className="mt-20 max-w-5xl"
        intro={
          <>
            Population counts, not a score for any one agent. A rung&rsquo;s
            segments do not sum to the whole population when an earlier failure
            stopped the pipeline — that gap is drawn as its own &ldquo;not
            checked&rdquo; segment rather than folded into whichever status
            happens to render widest.
          </>
        }
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
        title="One agent, seven rungs"
        aside={`first three on ${run.chain}`}
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
            Search all {population.toLocaleString("en-US")} agents →
          </Link>
          <Link
            href={workingHref}
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
            Every number on this page comes from {perChain ? "one sweep" : "one sweep per chain"},
            pinned to {perChain ? "one block" : "one block each"}. A result you
            cannot recompute is an opinion; this is what recomputes it.
          </>
        }
      >
        <RunProvenance run={run} />
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <Link
            href="/methodology"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            How each rung is measured →
          </Link>
        </p>
      </Section>

      {/* Last thing on the page, after the provenance. The ask comes after
          the reader has seen what they would be subscribing to, not before. */}
      <EmailCapture source="homepage" />
    </>
  );
}
