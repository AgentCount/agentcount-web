import Link from "next/link";
import { AgentTable } from "@/components/AgentTable";
import { AllRunsProvenance } from "@/components/AllRunsProvenance";

import { FindingTile, NoteTile } from "@/components/FindingTile";
import { allPassFacets } from "@/components/DirectoryControls";
import { StatusWord } from "@/components/StatusWord";
import { MissingRateBar, RateBar } from "@/components/RateBar";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { RunProvenance } from "@/components/RunProvenance";
import { Section } from "@/components/Section";
import { StatusLegend } from "@/components/StatusLegend";
import { aggregateFinding, canonicalRuns, totalAgents } from "@/lib/api/aggregate";
import { CHECKS } from "@/lib/checks";
import {
  chainsWithRuns,
  getFindings,
  getRates,
  listAgents,
  listRuns,
  resolveRunForRequest,
  statusVocabulary,
} from "@/lib/api/endpoints";
import type { Finding, Findings } from "@/lib/api/schemas";
import { chainDisplayName, formatChainList } from "@/lib/chains";
import { LINKAGE } from "@/lib/linkage";
import { getPublishedRuns } from "@/lib/published-runs";
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
  // Both read before anything is chosen: the run list says what exists, the
  // published list says which of those this site is willing to quote.
  const [allRuns, published] = await Promise.all([listRuns(), getPublishedRuns()]);
  const perChain = sp.chain !== undefined || sp.run !== undefined;

  // One sweep per chain, largest population first — restricted to runs whose
  // archive has been published, because "finished most recently" is not the
  // same question as "is the census" and the API cannot tell them apart. See
  // `canonicalRuns`.
  const censusRuns = canonicalRuns(
    allRuns,
    new Set(published.map((r) => r.run_id)),
  );

  // The run that the sample table, the rates and the status legend describe.
  // In all-chains mode there is no single run those could honestly be "of",
  // so they take the largest contributor and the page says which.
  const run = perChain ? await resolveRunForRequest(sp) : censusRuns[0];
  if (!run) {
    throw new Error("no completed run is available yet");
  }

  const [rates, sample] = await Promise.all([
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
  const population = totalAgents(censusRuns);

  /**
   * The per-chain attestation line rendered between the tiles and the rate
   * bars. Two jobs: it puts the report's central finding — attestation varies
   * by more than an order of magnitude between chains — on the page that
   * quotes the population-weighted average, and it marks the moment the page
   * narrows from every chain to one. Census mode only: on a per-chain page
   * there is nothing to compare.
   */
  const perChainAttested = perChain
    ? []
    : censusRuns.map((r, i) => ({
        chain: r.chain,
        attested: pick(perRunFindings[i].findings, "attested"),
      }));

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
   * The chains are named, always. Until 2026-08-01 this read "the four
   * largest chains" whenever four were published — a ranking nobody had
   * verified, and false: counting registrations on every deployed registry
   * with the census's own ownerOf method put the swept chains at #1, #2, #3
   * and #8. Naming the chains is the claim that stays true by construction,
   * and it degrades with the data: an unpublished sweep drops out of the
   * sentence because it drops out of `censusRuns`, so the headline can never
   * disagree with the runs table under it.
   */
  const scope = formatChainList(censusRuns.map((r) => r.chain));

  return (
    <>
      <header className="border-b border-edge pb-6">
        {perChain ? (
          <>
            <h1 className="numeral max-w-[18ch] text-[clamp(2rem,4.2vw,3.25rem)] text-text">
              What we found when we checked every ERC-8004 agent on{" "}
              {chainDisplayName(run.chain)}
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
              
            </div>
          </>
        ) : (
          <>
            {/* The claim is short enough to read in one breath; the scope
                it is true of sits under it as data.

                It used to be one sentence carrying both — "We checked all
                354,858 AI agents registered on BNB Chain, Base, Ethereum
                mainnet, and Celo." Naming the chains was the honest fix for
                a false ranking, but it cost the headline four lines of
                display type and put a link underline through the middle of
                it. Splitting the two keeps every fact and gives each one the
                weight it can carry: the claim as a headline, the population,
                chains and sweep count as the mono line that qualifies it.

                Both halves still derive from the runs, so a fifth chain
                moves them without an edit here. */}
            <h1 className="numeral max-w-[18ch] text-[clamp(2rem,4.4vw,3.5rem)] text-text">
              We check every AI agent registered under{" "}
              <span className="whitespace-nowrap">ERC-8004</span>.
            </h1>

            {/* The scope, immediately under the claim and derived from the
                published runs: the headline says what we do, this says what
                it is true of. The chain list carries the /coverage link, so
                the claim and the evidence for its scope are one click apart.

                "N sweeps" used to sit here and was redundant by
                construction — `canonicalRuns` takes exactly one published run
                per chain, so the sweep count is always the chain count. */}
            <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-xs text-dead">
              <span>
                <span className="text-muted">
                  {population.toLocaleString("en-US")}
                </span>{" "}
                agents
              </span>
              <span className="text-line">·</span>
              <Link
                href="/coverage"
                className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
              >
                {scope}
              </Link>
              <span className="text-line">·</span>
              <a
                href="#provenance"
                className="underline decoration-line underline-offset-4 transition-colors hover:text-muted"
              >
                provenance ↓
              </a>
            </p>

            <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted">
              Registration counts get cited as proof that an agent economy
              exists. Nobody was checking what stands behind them. This census
              asks seven checkable questions of every registered agent and
              publishes each answer with the evidence behind it.
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

          {/* Leads with the plain fact; the vocabulary (conformant, check 5,
              unclaimed) follows it instead of gatekeeping it. */}
          <FindingTile index={2} finding={unclaimed}>
            of registration files never say which on-chain agent they belong
            to — the spec only recommends the field that would bind them.
            Check 5 (Claims its identity?) records those as{" "}
            <StatusWord status="unclaimed" />: neither a pass nor a fail.
          </FindingTile>

          {/* The Base caveat rides the tile it qualifies, as one clause. The
              full paragraph — 300-agent sample, 42–53% interval, why it is
              not printed as a count — lives in the report the sentence links
              to; the tile only has to stop a reader taking the feedback
              number at face value. */}
          <FindingTile index={3} finding={attested}>
            have at least one on-chain feedback entry.{" "}
            <span className="text-text">
              Agents with feedback are less likely to have a document that
              resolves than agents with none
            </span>{" "}
            — {pct(attestedResolvable)} against {pct(unattestedResolvable)}.
            {baseAttested && (
              <>
                {" "}
                A sampled read traces most of Base&rsquo;s feedback to a
                handful of client addresses.
              </>
            )}
          </FindingTile>

          {/* The fourth tile answers the economy question the other three
              lead up to, and it is the one tile whose number this site cannot
              currently stand behind.

              It printed 358 agents ever paid until 2026-08-06. That figure
              came from a log study that ran once, on a declared-wallet basis,
              pinned to no run and recomputable from no published archive; the
              maintainer withdrew it and every variant of it as a headline
              claim pending a rebuilt pipeline (AgentCount/agentcount#35). The
              first three tiles read from the findings endpoint at render time
              and this one never could, which is the whole difference.

              It stays in the row rather than being deleted: the question is
              still one of the four this census exists to ask, and the report
              still carries the withdrawn figures with their dates. */}
          <NoteTile
            index={4}
            lead="under revision"
            source={`${LINKAGE.payments.measuredOn} study superseded · ${LINKAGE.payments.issue}`}
          >
            Payments to registered agents are rare, and how rare is under
            revision. AgentCount withdrew the figure it published here on{" "}
            {LINKAGE.payments.measuredOn} and is rebuilding the pipeline that
            would replace it under a pinned run.{" "}
            <Link
              href="/reports/linkage"
              className="text-text underline decoration-line underline-offset-4 transition-colors hover:decoration-edge"
            >
              The join, and the superseded figures, are its own report.
            </Link>
          </NoteTile>
        </div>

        {/* The report's central finding, on the page that quotes the average
            it corrects: attestation is not one number, it spans the chains by
            an order of magnitude. This line is also the visible seam where
            the page narrows from the whole census to one chain at a time. */}
        {perChainAttested.length > 1 && (
          <div className="mt-10 flex flex-wrap items-baseline gap-x-7 gap-y-2 border-t border-line pt-4">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
              Has feedback? by chain
            </span>
            {perChainAttested.map(({ chain, attested: a }) => (
              <span key={chain} className="font-mono text-xs">
                <span className="text-muted">{chain}</span>{" "}
                <span className="text-text">{pct(a)}</span>
              </span>
            ))}
            <span className="text-xs leading-relaxed text-dead">
              — one population-weighted average would hide this spread, so the
              sections below show one chain at a time
            </span>
          </div>
        )}

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
        title="Every check, every status"
        aside={`base rates on ${run.chain}`}
        className="mt-20 max-w-5xl"
        intro={
          <>
            Population counts, not a score for any one agent. A check&rsquo;s
            segments do not sum to the whole population when an earlier failure
            stopped the pipeline — that gap is drawn as its own &ldquo;not
            checked&rdquo; segment rather than folded into whichever status
            happens to render widest.
          </>
        }
      >
        <div className="space-y-8">
          {/* The full ladder, 1 through 7, never the subset with data: a list
              that runs 1, 2, 3, 4, 5, 7 reads as a bug. A position the run
              carries no rates for renders hatched, and takes real data the
              moment a run reports it — `MissingRateBar` renders only when the
              lookup fails. */}
          {CHECKS.map((c) => {
            const r = rates.rungs.find((x) => x.rung === c.number);
            return r ? (
              <RateBar key={c.number} rung={r} total={rates.agent_count} />
            ) : (
              <MissingRateBar key={c.number} rungNumber={c.number} />
            );
          })}
        </div>
        <div className="mt-10">
          <StatusLegend statuses={statusVocabulary(rates)} />
        </div>
      </Section>

      <Section
        title="One agent, seven checks"
        aside={`first three on ${run.chain}`}
        className="mt-20 max-w-5xl"
        intro={
          <>
            Exactly as the directory renders them. Hover or tap any badge for
            the question it answers. A check with no row was never reached this
            run — check 6 (Answers?) is not yet implemented, so it reads as not
            checked for everyone, never as a failure.
          </>
        }
      >
        <AgentTable agents={sample.items} />
        <div className="mt-5">
          <StatusLegend statuses={statusVocabulary(rates)} />
        </div>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          {/* True again: /search covers every published chain at once, so
              the promise this label briefly could not make is back. */}
          <Link
            href="/search"
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
        id="provenance"
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
        {/* The runs table lived in the hero, where it was administrative
            furniture between the claim and the findings. It is provenance, so
            it lives with the provenance — the hero's one-line summary links
            here. */}
        {!perChain && (
          <div className="mb-8">
            <AllRunsProvenance runs={censusRuns} />
          </div>
        )}
        <RunProvenance run={run} />
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <Link
            href="/methodology"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            How each check is measured →
          </Link>
        </p>
      </Section>

      {/* The homepage EmailCapture left with the review's delete list: the
          reports page keeps it, and that is where a reader who wants reports
          by email is standing. */}
    </>
  );
}
