import { AgentTable } from "@/components/AgentTable";
import { AllRunsProvenance } from "@/components/AllRunsProvenance";

import { DeltaLedger } from "./DeltaLedger";
import { FindingTiles, pickFinding } from "./FindingTiles";
import { allPassFacets } from "@/components/DirectoryControls";
import { MissingRateBar, RateBar } from "@/components/RateBar";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { RunProvenance } from "@/components/RunProvenance";
import { Section } from "@/components/Section";
import { StatusLegend } from "@/components/StatusLegend";
import { StatusTag } from "@/components/StatusTag";
import { TextLink } from "@/components/TextLink";
import { aggregateFinding, canonicalRuns, totalAgents } from "@/lib/api/aggregate";
import { CHECKS } from "@/lib/checks";
import {
  chainsWithRuns,
  getDelta,
  getFindings,
  getRates,
  listAgents,
  listRuns,
  resolveRunForRequest,
  statusVocabulary,
} from "@/lib/api/endpoints";
import type { Finding, Findings } from "@/lib/api/schemas";
import { chainDisplayName, compressChainList } from "@/lib/chains";
import { getPublishedRuns } from "@/lib/published-runs";
import { REPORTS } from "@/lib/reports";

/** The five keys this view's four tiles are built from. */
const KEYS = [
  "services_absent_or_empty",
  "registration_unclaimed",
  "attested",
  "attested_resolvable",
  "unattested_resolvable",
] as const;

/**
 * The census, in full: instrument 01 of the audit layer.
 *
 * This was the homepage until the homepage became the product overview. It is
 * a shared component rather than page code because it renders at TWO
 * addresses: `/census` (its canonical home) and `/` when a legacy census deep
 * link (`?chain=`, `?run=`) arrives there — those URLs predate the overview
 * and must keep resolving to the content they always meant, and they cannot
 * redirect because `/census → /` shipped as a browser-cached permanent
 * redirect on 2026-08-01 (see `next.config.ts`).
 *
 * The view answers a different question depending on how it was reached.
 * Without `?chain=` it is the census: every agent on every swept chain, one
 * population, population-weighted rates. That is the default because it is
 * the only view whose headline is true of ERC-8004 rather than of one chain's
 * most active platform — the correction the four-chain report exists to make.
 *
 * With `?chain=` (or `?run=`) it is one sweep, exactly as before. Every
 * existing deep link keeps its meaning, and the chain switcher below the hero
 * moves between the two.
 */
export async function CensusView({ sp }: { sp: { run?: string; chain?: string } }) {
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
  // `allRuns` is already in hand from the `Promise.all` above — passed
  // through so this does not fetch `/api/runs` a second time to resolve the
  // same request's run. See `resolveRun`'s own doc.
  const run = perChain ? await resolveRunForRequest(sp, allRuns) : censusRuns[0];
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

  // One stored comparison per run on show, fetched alongside its findings.
  // `null` — a first sweep, or an API without the endpoint yet — renders as
  // stated absence, never as zeros. See `DeltaLedger`.
  const deltaRuns = perChain ? [run] : censusRuns;
  const deltas = await Promise.all(deltaRuns.map((r) => getDelta(r.run_id)));
  const finding = (key: string): Finding =>
    perChain
      ? pickFinding(perRunFindings[0].findings, key)
      : aggregateFinding(perRunFindings, key);

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
        attested: pickFinding(perRunFindings[i].findings, "attested"),
      }));

  // Whether the Base-only attestation investigation applies to the
  // population on show — see the note on `FindingTiles`' `baseCaveat` prop.
  const baseCaveat = perChain
    ? run.chain === "base"
    : censusRuns.some((r) => r.chain === "base");

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
   *
   * At eleven chains the full list stopped being scannable, so the scope
   * line compresses past four — largest three named, the rest counted — and
   * the /coverage link it carries still names every chain in full. See
   * `compressChainList` for why this stays honest.
   */
  const scope = compressChainList(censusRuns.map((r) => r.chain));

  return (
    <>
      <header className="border-b border-edge pb-6">
        {/* The page names its place in the product before it makes its
            claim: this is one instrument of the audit layer, and the tag is
            the site talking about itself, never about any agent. */}
        <p className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="label">Instrument 01 · Registry check</span>
          <StatusTag status="live" />
        </p>
        {perChain ? (
          <>
            <h1 className="headline max-w-[18ch] text-[clamp(2rem,4.2vw,3.25rem)] text-text">
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
            <h1 className="headline max-w-[18ch] text-[clamp(2rem,4.4vw,3.5rem)] text-text">
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
              <TextLink href="/coverage">{scope}</TextLink>
              <span className="text-line">·</span>
              <TextLink href="#provenance" tone="inherit">
                provenance ↓
              </TextLink>
            </p>

            <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted">
              Registration counts get cited as proof that an agent economy
              exists. Nobody was checking what stands behind them. We ask
              seven checkable questions of every registered agent and publish
              each answer with the evidence behind it.
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
          basePath="/census"
          allLabel="all chains"
        />
      </div>

      <section aria-label="What this census found" className="mt-8">
        <FindingTiles
          f={{ unreachable, unclaimed, attested, attestedResolvable, unattestedResolvable }}
          baseCaveat={baseCaveat}
        />

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
          <TextLink
            href={`/reports/${report.slug}`}
            tone="bright"
            className="font-mono text-xs uppercase tracking-[0.1em]"
          >
            Read the full report: {report.chains.length} chains, {report.agents}{" "}
            agents →
          </TextLink>
        </p>

      </section>

      {/* The number nobody else can produce: what stopped working since the
          previous sweep. Registration counts only ever go up and everyone
          publishes them; this table is the other direction, and it exists
          because the same seven questions were asked of the same population
          at two pinned blocks and both answers were kept. */}
      <Section
        title="Changed since the last sweep"
        aside={
          perChain
            ? `${run.chain} · against its previous sweep`
            : "each chain · against its previous sweep"
        }
        className="mt-20 max-w-5xl"
        intro={
          <>
            Each row compares a chain&rsquo;s current sweep against the
            previous one — both pinned to a block, so the comparison itself
            recomputes. &ldquo;No longer reachable&rdquo; is check 2
            (Reachable?) moving from pass to not-pass: the quiet decay that
            registration counts never show.
          </>
        }
      >
        <DeltaLedger
          rows={deltaRuns.map((r, i) => ({ run: r, delta: deltas[i] }))}
        />
      </Section>

      {/* The same seven questions as the tiles above, answered for the whole
          population instead of summarised into four headlines — the next
          level of detail.

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
          <TextLink href="/search" tone="bright">
            Search all {population.toLocaleString("en-US")} agents →
          </TextLink>
          <TextLink href={workingHref} tone="bright">
            Agents that passed every check →
          </TextLink>
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
          <TextLink href="/methodology" tone="bright">
            How each check is measured →
          </TextLink>
        </p>
      </Section>
    </>
  );
}
