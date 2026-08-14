import type { Metadata } from "next";
import { CensusView } from "./census/CensusView";
import { FindingTiles, type CensusFindings } from "./census/FindingTiles";
import { AllRunsProvenance } from "@/components/AllRunsProvenance";
import { InstrumentRow } from "@/components/InstrumentRow";
import { Section } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import { aggregateFinding, canonicalRuns, totalAgents } from "@/lib/api/aggregate";
import { getFindings, listRuns } from "@/lib/api/endpoints";
import type { Findings } from "@/lib/api/schemas";
import { chainDisplayName } from "@/lib/chains";
import { getPublishedRuns } from "@/lib/published-runs";
import { REPORTS } from "@/lib/reports";

// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy if
// the API happens to be restarting.
export const dynamic = "force-dynamic";

/**
 * The homepage is the product overview; the census lives at `/census`. But a
 * request for `/?chain=…` or `/?run=…` is a census deep link from when the
 * census WAS the homepage, and it renders the census in place rather than
 * redirecting — `/census → /` shipped as a permanent redirect on 2026-08-01,
 * browsers cache a 308 indefinitely, and a redirect the other way would loop
 * any client still holding it (see `next.config.ts`). The canonical URL
 * points search engines at the census's real address.
 */
function isLegacyCensusLink(sp: { run?: string; chain?: string }): boolean {
  return sp.chain !== undefined || sp.run !== undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; chain?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  if (!isLegacyCensusLink(sp)) return {};
  const query = new URLSearchParams();
  if (sp.chain !== undefined) query.set("chain", sp.chain);
  if (sp.run !== undefined) query.set("run", sp.run);
  return { alternates: { canonical: `/census?${query.toString()}` } };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; chain?: string }>;
}) {
  const sp = await searchParams;
  if (isLegacyCensusLink(sp)) {
    return <CensusView sp={sp} />;
  }

  // The same population arithmetic as the census page, over the same
  // canonical runs — the overview quotes the instrument, it does not have
  // numbers of its own.
  const [allRuns, published] = await Promise.all([listRuns(), getPublishedRuns()]);
  const censusRuns = canonicalRuns(allRuns, new Set(published.map((r) => r.run_id)));
  if (censusRuns.length === 0) {
    throw new Error("no completed run is available yet");
  }
  const population = totalAgents(censusRuns);

  /**
   * The date of the most recent sweep in the census, as a bare date.
   *
   * `censusRuns` is ordered by population, not by time, so the newest is
   * found rather than assumed. RFC 3339 timestamps sort lexicographically in
   * chronological order, which is what makes the plain sort correct. The time
   * is dropped and nothing is relativised — "3 days ago" would be this site
   * computing a fact the run does not carry, and the run's own timestamp is
   * printed in full on the provenance table below.
   */
  const latestSweep = censusRuns
    .map((r) => r.finished_at)
    .filter((t): t is string => typeof t === "string")
    .sort()
    .at(-1)
    ?.slice(0, 10);

  // The census digest: the four tiles, population-weighted across every
  // published chain. `aggregateFinding` is the only place in this app that
  // divides — see its module doc.
  const perRunFindings: Findings[] = await Promise.all(
    censusRuns.map((r) => getFindings(r.run_id)),
  );
  const f: CensusFindings = {
    unreachable: aggregateFinding(perRunFindings, "services_absent_or_empty"),
    unclaimed: aggregateFinding(perRunFindings, "registration_unclaimed"),
    attested: aggregateFinding(perRunFindings, "attested"),
    attestedResolvable: aggregateFinding(perRunFindings, "attested_resolvable"),
    unattestedResolvable: aggregateFinding(perRunFindings, "unattested_resolvable"),
  };
  const report = REPORTS[0];

  return (
    <>
      {/* The hero is the site's own semantic split made into a layout: the
          claim is prose and sits left in sans, what has actually been counted
          is machine data and sits right in mono, and a hairline separates
          them rather than a box. The reader meets an argument and the
          evidence for it at the same moment, and the page gets its focal
          point from the one thing this product has that nobody else does — a
          real population count — rather than from an illustration.

          Below `lg` the two stack, claim first: on a phone the argument is
          what a first-time reader needs, and the figure follows it. */}
      <header className="border-b border-edge pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-x-14">
        <div>
          {/* The H1 is what the product IS; what it refuses to be — a score —
              sits in the deck, because refusing is a sentence, not a
              headline. */}
          <h1 className="numeral max-w-[18ch] text-[clamp(2rem,4.4vw,3.5rem)] text-text">
            Independent measurement of the agent economy.
          </h1>

          <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted">
            Numbers about the agent economy get cited as proof that it exists —
            registration counts most of all. Nobody was checking what stands
            behind them. AgentCount builds instruments that check, and
            publishes every answer with the evidence behind it. Never a score.
          </p>
        </div>

        {/* The right column IS the ledger: the population, then where it
            lives, largest chain first. Every figure derives from the
            published runs, so a new sweep moves the hero with no edit — and
            a first-time reader gets the two questions a scope claim raises
            (how many? on what?) answered in the same glance, instead of a
            chain list run into a sentence. Counts, never rates: nothing here
            says anything about any individual agent. */}
        <div className="mt-10 flex flex-col justify-end border-t border-line pt-5 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
          <p className="label">Agents counted, by chain</p>
          <p className="numeral mt-3 text-[clamp(2.75rem,5vw,4.25rem)] text-text">
            {population.toLocaleString("en-US")}
          </p>
          <dl className="mt-5 border-t border-line">
            {censusRuns.slice(0, 5).map((r) => (
              <div
                key={r.chain}
                className="flex items-baseline justify-between gap-x-6 border-b border-line py-1.5"
              >
                <dt className="font-mono text-xs text-muted">
                  {chainDisplayName(r.chain)}
                </dt>
                <dd className="font-mono text-xs tabular-nums text-text">
                  {r.agent_count?.toLocaleString("en-US") ?? "—"}
                </dd>
              </div>
            ))}
            {censusRuns.length > 5 && (
              <div className="flex items-baseline justify-between gap-x-6 border-b border-line py-1.5">
                <dt className="font-mono text-xs">
                  <TextLink href="/coverage" tone="quiet">
                    + {censusRuns.length - 5} more chains →
                  </TextLink>
                </dt>
                <dd className="font-mono text-xs tabular-nums text-muted">
                  {censusRuns
                    .slice(5)
                    .reduce((s, r) => s + (r.agent_count ?? 0), 0)
                    .toLocaleString("en-US")}
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[0.6875rem] text-dead">
            {latestSweep && <span>latest sweep {latestSweep}</span>}
            <span className="text-line">·</span>
            <TextLink href="#provenance" tone="quiet">
              provenance ↓
            </TextLink>
          </p>
        </div>
      </header>

      {/* The product, as a list of instruments. One entry today. A new
          instrument becomes a new row the day it ships — and not one day
          before: nothing unshipped is listed, linked or teased, because a
          product that audits claims cannot market a promise. */}
      <Section
        title="Instruments"
        aside="what this site measures"
        className="mt-16 max-w-5xl"
      >
        <div className="space-y-2">
          {/* "Registry check", not "registration census": the label has to
              work for a reader meeting the product cold, in plain words —
              what is checked (the registry) and what is done to it (a
              check). "Census" survives only in the URL, which is an
              identifier other people have already linked to. */}
          <InstrumentRow
            index={1}
            title="Registry check"
            href="/census"
            status="live"
            figures={
              <>
                {population.toLocaleString("en-US")} agents ·{" "}
                {censusRuns.length} chains · seven checks per agent · one
                pinned block per sweep
              </>
            }
          >
            Every AI agent registered under ERC-8004 on the swept chains,
            asked seven yes/no questions — from &ldquo;does it exist in the
            registry&rdquo; to &ldquo;has anyone vouched for it&rdquo;. Each
            answer is published with its evidence and recomputes from a
            pinned, downloadable run.
          </InstrumentRow>
        </div>
      </Section>

      {/* The digest: what the live instrument found, in its own words — the
          tiles are the findings page's tiles, shared code, so the overview
          can never paraphrase the findings into a different claim. */}
      <Section
        title="What we found"
        aside={`population-weighted · ${censusRuns.length} chains`}
        className="mt-16"
        intro={
          <>
            Four headlines from the current sweep, across every published
            chain at once. The full ladder — every check, every status, one
            chain at a time — is on the{" "}
            <TextLink href="/census">findings page</TextLink>.
          </>
        }
      >
        <FindingTiles f={f} baseCaveat={censusRuns.some((r) => r.chain === "base")} />
        <p className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <TextLink href="/census">All findings, chain by chain →</TextLink>
          <TextLink href={`/reports/${report.slug}`}>
            The report: {report.chains.length} chains, {report.agents} agents →
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
            Every number on this page comes from one sweep per chain, pinned
            to one block each. A result you cannot recompute is an opinion;
            this is what recomputes it.
          </>
        }
      >
        <AllRunsProvenance runs={censusRuns} />
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <TextLink href="/methodology">How each check is measured →</TextLink>
          <TextLink href="/data">Download any run →</TextLink>
        </p>
      </Section>
    </>
  );
}
