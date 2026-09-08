import type { Metadata } from "next";
import { CensusView } from "./census/CensusView";
import { FindingTiles, type CensusFindings } from "./census/FindingTiles";
import { AllRunsProvenance } from "@/components/AllRunsProvenance";
import { CountUp } from "@/components/CountUp";
import { CtaLink } from "@/components/CtaLink";
import { InstrumentRow } from "@/components/InstrumentRow";
import { Section } from "@/components/Section";
import { StatusTag } from "@/components/StatusTag";
import { TallyMark } from "@/components/TallyMark";
import { TextLink } from "@/components/TextLink";
import { aggregateFinding, canonicalRuns, totalAgents } from "@/lib/api/aggregate";
import { getFindings, latestSellerCensus, listRuns } from "@/lib/api/endpoints";
import type { Findings } from "@/lib/api/schemas";
import { BRAND } from "@/lib/brand";
import { chainDisplayName } from "@/lib/chains";
import { CHECKS } from "@/lib/checks";
import { INSTRUMENTS } from "@/lib/instruments";
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

  // Both instruments, fetched in parallel — the overview quotes them, it has
  // no numbers of its own. The registration side is the same population
  // arithmetic as the census page, over the same canonical runs.
  //
  // `latestSellerCensus()` returns `null` when the deployed API predates the
  // seller endpoints, which is a real state in the window between the two
  // repos' deploys. Instrument 02's row is downgraded then, rather than
  // printing "live" over an empty one.
  const [allRuns, published, sellerCensus] = await Promise.all([
    listRuns(),
    getPublishedRuns(),
    latestSellerCensus(),
  ]);
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
      {/* No `border-b` any more: the `full-bleed-rule` directly below this
          header is now the break between the hero and the first chapter, and
          a hairline stopping at the content edge 75px above a second one
          crossing the whole viewport read as a mistake rather than as two
          decisions. `pb-8` stays — the rule sets the gap below it, this sets
          the gap above. */}
      <header className="relative overflow-hidden pt-8 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:gap-x-14">
        {/* The mark again, oversized and almost silent, behind the hero
            reading — the count made into a watermark rather than repeated as
            an icon. `-z-10` is load-bearing: an absolutely-positioned element
            with no z-index still paints above ordinary in-flow content
            regardless of DOM order, so without this the "silent" watermark
            draws itself over the copy instead of behind it. Hidden below
            `lg`: at the width where the hero itself stacks to one column,
            340px of watermark has nowhere to sit that does not collide with
            the reading. */}
        <TallyMark
          strokeWidth={2.6}
          className="pointer-events-none absolute top-1/2 right-[-6%] hidden h-[340px] w-[340px] -translate-y-1/2 -z-10 text-text opacity-5 lg:block"
        />
        <div>
          {/* The eyebrow: what this site is, and how current it is, before
              the headline makes its claim — so a reader who has never heard
              of the project knows what kind of page they are on. Its own
              copy now, not `BRAND.selfDescription`: the hero wants the same
              two facts — audit layer, agent economy — as a dot-joined pair
              rather than one run-on sentence, so the eyebrow still reads
              cleanly once `latestSweep` appends its own `· updated …`
              clause beside them. `BRAND.selfDescription` is unchanged and
              still what the footer's meta description reads. */}
          <p className="label">
            independent audit layer · agent economy
            {latestSweep && <> · updated {latestSweep}</>}
          </p>

          {/* The H1 is what the product IS; what it refuses to be — a score —
              sits in the deck, because refusing is a sentence, not a
              headline.

              Set in `headline` (mono), not `numeral` (condensed display):
              this is where that call was first made, before it became the
              utility every page title on the site now sets — see the Type
              section in `globals.css`. "agent economy" stays the one place
              in running prose the new accent is allowed to appear —
              besides the tally mark and the focus ring — even though the
              headline treatment itself is no longer unique to this page.

              Italic: `app/layout.tsx` already loads JetBrains Mono's italic
              700 cut for exactly this emphasis, and `not-italic` here was
              silently cancelling the one thing that cut was loaded for. The
              slant does the work the colour cannot do alone — it survives
              greyscale, a screenshot, and a reader who cannot tell cyan
              from bone. */}
          <h1 className="mt-3 max-w-[18ch] headline text-[clamp(2rem,3.7vw,3.15rem)] text-text">
            Independent measurement of the{" "}
            <em className="italic text-accent">agent economy.</em>
          </h1>

          <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-muted">
            Numbers about the agent economy get cited as proof that it exists —
            how many agents are registered, how many sellers take payment.
            Nobody was checking what stands behind them.{" "}
            {/* The one clause in this paragraph that is a claim about what
                this project DOES rather
                than about the state of the world. Weight and full text
                colour, not the accent: the accent is spent on the headline's
                "agent economy" two lines above, and a second cyan phrase in
                the same block would make the eye read them as a pair of
                links rather than as one emphasis. `strong` rather than a
                styled `span` because this is emphasis in the semantic
                sense — a reader hearing the page read aloud should get it
                too. */}
            <strong className="font-semibold text-text">
              {BRAND.name} builds instruments that check
            </strong>
            , and publishes every answer with the evidence behind it. Never a
            score.
          </p>

          {/* Two doors out of the claim, as a primary/ghost button pair
              (`CtaLink.tsx`) rather than the plain mono-link row this
              section used before — see that component's doc for why it is
              not a `TextLink` tone. The first jumps to the section below on
              THIS page, so a reader can see the evidence without leaving;
              the second leaves it, for `/methodology`, because "how a sweep
              works" is a real page and an in-page anchor would be a promise
              this hero cannot keep. */}
          <p className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <CtaLink href="#what-we-found" tone="primary">
              See what we found ↓
            </CtaLink>
            <CtaLink href="/methodology" tone="ghost">
              How a sweep works →
            </CtaLink>
          </p>
        </div>

        {/* The right column IS the ledger: the population, then where it
            lives, largest chain first. Every figure derives from the
            published runs, so a new sweep moves the hero with no edit — and
            a first-time reader gets the two questions a scope claim raises
            (how many? on what?) answered in the same glance, instead of a
            chain list run into a sentence. Counts, never rates: nothing here
            says anything about any individual agent. */}
        {/* The one bordered panel on the site — see `globals.css`'s `panel`
            utility for why this is the deliberate exception. It replaces the
            border-t/
            border-l hairline this column used to lean on for separation
            from the prose beside it: the panel's own edge does that job
            now, on every breakpoint, so the responsive border-side swap
            that hairline needed is gone with it. */}
        <div className="panel mt-10 lg:mt-0">
          {/* The panel's own header row: label left, a "live" tag right.
              The tag is `StatusTag` — the same component `InstrumentRow`
              uses below to state the same "is the product live" fact, read
              a second time from the panel that opens the page, rather than
              a second hand-rolled tag that could drift from it. `StatusTag`
              carries the cyan dot itself; see that file's doc for why the
              site is allowed to colour this one sentence about itself and
              what it costs. */}
          <div className="flex items-baseline justify-between gap-3">
            <p className="label">Agents counted, by chain</p>
            <StatusTag status="live" />
          </div>
          <p className="headline mt-3 text-[clamp(2.6rem,4.2vw,3.4rem)] text-text">
            <CountUp value={population} />
            {/* A resting, unblinking cursor: the figure reads as something
                a machine just finished printing rather than as a headline
                somebody typed — true again once the count above it
                settles. The count itself now animates on mount; see
                `CountUp.tsx` for why this app spends its one purely
                decorative client component on this figure and every
                `MiniPanel` count alongside it, and no other standalone
                number on the site.

                A drawn block, not a typed `_`. The underscore glyph is
                whatever the display face decides it is — here a hairline
                sitting well under the baseline, far too light to read as a
                cursor beside digits this size. The block is sized against
                the digits instead: 0.61 of cap height wide and 0.16 of it
                tall, which at this face's ~0.7em cap height is 0.43em by
                0.11em. `align-baseline` puts the
                box's bottom ON the baseline, so it is pushed down by its
                own height plus a hair to sit just below, where a terminal
                cursor sits.

                `aria-hidden` because it is now a rectangle rather than a
                character: a screen reader announcing "underscore" after the
                population was noise the glyph version was quietly making. */}
            <span
              aria-hidden
              className="ml-[0.12em] inline-block h-[0.11em] w-[0.43em] translate-y-[0.14em] bg-dead align-baseline"
            />
          </p>

          {/* A single-hue proportion bar: length is the only carrier, same
              principle as `RateBar`'s own `pct` helper driving a different
              stacked bar just below on `/census`. This is not a second
              implementation of the census's arithmetic (see `lib/api/aggregate.ts`'s module
              doc on why percentages are computed once, by the API): nothing
              here is a published figure or a claim about any rung — it's a
              bar's width, dividing the same `agent_count`/`population`
              already printed a few lines below, largest chain first since
              `censusRuns` already sorts that way. */}
          <div
            className="mt-4 flex h-2 gap-0.5 bg-line"
            role="img"
            aria-label="Population share by chain, largest first"
          >
            {censusRuns.map((r, i) => (
              <span
                key={r.chain}
                className={i === 0 ? "h-full bg-accent" : "h-full bg-muted/55"}
                style={{
                  width: `${population > 0 ? ((r.agent_count ?? 0) / population) * 100 : 0}%`,
                }}
              />
            ))}
          </div>

          {/* The chain list: one hairline under each row and nothing else.
              The per-row cyan bar that used to sit here is gone — the
              stacked bar directly above already carries every chain's
              share, so a second set of bars restated the same proportion
              twice in the same 200px. The proportion device is not dropped
              from the design, only from the one place it was redundant: it
              still carries the bar above, each finding's percentage, and
              every row of the provenance table. */}
          {/* `[&>div:last-child]:border-b-0`: the footer below carries its
              own `border-t`, so without this the list's last row and the
              footer draw two hairlines a row's height apart — a double rule
              that reads as an empty sixth row. One line closes the list. */}
          <dl className="mt-5 border-t border-line [&>div:last-child]:border-b-0">
            {censusRuns.slice(0, 5).map((r) => (
              <div
                key={r.chain}
                className="flex items-baseline justify-between gap-x-6 border-b border-line py-2.5"
              >
                <dt className="font-mono text-[0.8125rem] text-muted">
                  {chainDisplayName(r.chain)}
                </dt>
                <dd className="font-mono text-[0.8125rem] tabular-nums text-text">
                  {r.agent_count?.toLocaleString("en-US") ?? "—"}
                </dd>
              </div>
            ))}
            {censusRuns.length > 5 && (
              <div className="flex items-baseline justify-between gap-x-6 border-b border-line py-2.5">
                <dt className="font-mono text-[0.8125rem]">
                  <TextLink href="/coverage" tone="inherit">
                    + {censusRuns.length - 5} more chains →
                  </TextLink>
                </dt>
                <dd className="font-mono text-[0.8125rem] tabular-nums text-muted">
                  {censusRuns
                    .slice(5)
                    .reduce((s, r) => s + (r.agent_count ?? 0), 0)
                    .toLocaleString("en-US")}
                </dd>
              </div>
            )}
          </dl>
          {/* Ends of the row, not a `·`-separated run: the sweep date and
              the way out to the evidence sit at opposite edges, which is the
              same left-fact/right-fact rhythm the chain rows above and the
              panel's own header already keep. */}
          <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-3 font-mono text-[0.6875rem] text-dead">
            {latestSweep && <span>latest sweep {latestSweep}</span>}
            <TextLink href="#provenance" tone="inherit">
              provenance ↓
            </TextLink>
          </p>
        </div>
      </header>

      {/* The day `InstrumentRow` was built for. This section described one
          instrument in a paragraph for as long as there was one; there are
          two now, so it is the list that component was written to be —
          see its doc for the rule about what may appear in it, and
          `lib/instruments.ts` for why the Reconciliation page is not here
          despite being designed and wanted.

          It sits directly under the hero, above the seven checks, because
          the checks are ONE instrument's questions: a reader who meets them
          first — as every reader did until now — reasonably concludes that
          checking ERC-8004 registrations is the whole product. */}
      <hr className="full-bleed-rule mt-20" />
      <Section
        title="Instruments"
        /* Derived, not typed: this label was "one published" for the two
           hours between the Seller Census getting a page and getting an
           endpoint, and a hand-written count is exactly the sort of string
           that stays wrong for a year after it stops being true. */
        aside={
          sellerCensus === null ? "two · one published" : "two · both published"
        }
        className="mt-14"
        heading="display"
        intro={
          <>
            Two populations, measured separately and never blended: who is{" "}
            <em>registered</em>, and who actually <em>sells</em>. Each
            instrument publishes its own figures with its own evidence, and
            neither stands in for the other.
          </>
        }
      >
        <div className="mt-8 max-w-5xl">
          {INSTRUMENTS.map((instrument) => (
            <InstrumentRow
              key={instrument.index}
              index={instrument.index}
              title={instrument.title}
              href={instrument.href}
              /* Downgraded when the figures are not reachable — see
                 `lib/instruments.ts` on status meaning publication. */
              status={
                instrument.index === 2 && sellerCensus === null
                  ? "in development"
                  : instrument.status
              }
              /* Only the published instrument gets a figures line, and it
                 reads the same `censusRuns` arithmetic as the hero panel
                 above rather than a second count of its own. Instrument 02
                 has completed a sweep, but nothing serves it yet — a row
                 without numbers must not imply any. */
              figures={
                instrument.index === 1 ? (
                  <>
                    {population.toLocaleString("en-US")} agents ·{" "}
                    {censusRuns.length} chains
                    {latestSweep && <> · swept {latestSweep}</>}
                  </>
                ) : instrument.index === 2 && sellerCensus !== null ? (
                  <>
                    {sellerCensus.rates.seller_count.toLocaleString("en-US")}{" "}
                    sellers ·{" "}
                    {sellerCensus.rates.host_count.toLocaleString("en-US")}{" "}
                    hosts
                    {sellerCensus.run.finished_at && (
                      <> · swept {sellerCensus.run.finished_at.slice(0, 10)}</>
                    )}
                  </>
                ) : undefined
              }
            >
              {instrument.measures}
            </InstrumentRow>
          ))}
        </div>
      </Section>

      {/* No `max-w-5xl` on this section: the seven-check grid below is a
          table of cells, which wants the column, and at 1440px the cap was
          holding it to 1024px inside a 1384px page — the grid ended
          two-thirds of the way across while "What we found" directly
          beneath it ran the full width, which is the single thing that made
          this section read as a different, older page. The paragraph below
          keeps its own measure from `max-w-prose`. */}
      {/* A chapter break, at full width — see the `full-bleed-rule`
          utility in `globals.css`. `<hr>` rather than a
          styled `<div>`: this IS a thematic break between the page's four
          parts, and the element that says so is the one that already
          means it. The three top-level sections below carry their spacing
          on this rule instead of their own `mt-`, so the gap above a
          heading and the gap below the rule stay one number. */}
      <hr className="full-bleed-rule mt-20" />
      {/* Titled for the instrument it belongs to, not "Instruments" — that
          title now names the list above, and these seven cells are one of
          its two rows expanded. While there was a single instrument the two
          were the same thing and the heading could be either; with two they
          cannot, and a reader meeting "Instruments" over a grid of seven
          would count seven of them. */}
      <Section
        title="Inside the Registration Census"
        aside="seven checks · ordered, except #7"
        className="mt-14"
        heading="display"
      >
        {/* States the dependency the `aside` label only names: the seven
            checks are a ladder, not a checklist, and rung 7 is called out
            here for the same reason it is called out there — it reads the
            Reputation Registry directly rather than the document the other
            six depend on, so a document that never resolved still leaves
            rung 7 answerable. */}
        <p className="max-w-prose text-[0.9375rem] leading-relaxed text-muted">
          Every agent climbs the same ladder. Each rung only makes sense once
          the one below it passed — except the last, which is readable
          whether or not a document ever resolved, so it runs on its own
          track.
        </p>

        {/* The seven checks the one instrument above is built from, drawn
            from `lib/checks.ts` rather than from copy written for this
            grid: each card carries the real question and meaning already
            used at every other check surface — `RungStrip`'s popover,
            `/methodology` — so the seven cannot drift into seven slightly
            different descriptions of themselves.

            No per-check totals. This app has no cross-chain aggregate for
            "how many agents passed check N", and building one would be new
            plumbing rather than a layout decision, so no card claims a
            number nobody has computed. Check 6 reads "in development", not
            "live": that is `CHECKS[5].meaning` verbatim ("Not implemented
            yet, so nobody passes or fails it"), and marking it live to
            complete the set would be the one thing this site exists not to
            do.

            The hairlines are the 1px GAPS between cells, with the grid's
            own background showing through them — not borders on the cells.
            Rules only ever BETWEEN cells, never around the block, so the
            seven checks read as one ruled
            table rather than as a bordered card, and "cards never get a
            border on all four sides" needs no third exception here. Borders
            would have needed per-breakpoint `nth-child` arithmetic to strip
            the outer edges at 1, 2 and 4 columns; a gap needs none, because
            a gap between two cells only exists where there are two cells.
            The single `aria-hidden` filler at the end pays for that: with 7
            cells the last slot of the 2- and 4-column grids is empty, and
            without something opaque in it the grid's own hairline colour
            would show through as a block. It is hidden at one column, where
            seven cells already fill every row. */}
        {/* `flex flex-col` on each cell, `mt-auto` on the footer: a row's
            four cards rarely have equal description length, but the grid
            gives every card in a row the same height regardless — without
            this, the shorter cards' hairline-and-`internal:` line would
            float wherever their own text ends, landing at a different
            height in every card and reading as four misaligned tables
            rather than one. Pinning the footer to each card's own bottom
            edge is what makes the row's hairlines line up into a single
            straight rule again. */}
        <div className="mt-8 grid grid-cols-1 gap-px bg-edge sm:grid-cols-2 xl:grid-cols-4">
          {CHECKS.map((check) => (
            <div key={check.number} className="flex flex-col bg-bg p-5">
              <span className="label">{String(check.number).padStart(2, "0")}</span>
              <h3 className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-xl font-bold text-text">
                {check.internal.charAt(0).toUpperCase() + check.internal.slice(1)}
                <StatusTag status={check.number === 6 ? "in development" : "live"} />
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {check.question} {check.meaning}
              </p>
              <p className="mt-auto border-t border-line pt-2 font-mono text-[0.6875rem] text-dead">
                internal: {check.internal}
              </p>
            </div>
          ))}
          <div aria-hidden className="hidden bg-bg sm:block" />
        </div>
      </Section>

      {/* The digest: what the live instrument found, in its own words — the
          tiles are the findings page's tiles, shared code, so the overview
          can never paraphrase the findings into a different claim. */}
      {/* A chapter break, at full width — see the `full-bleed-rule`
          utility in `globals.css`. `<hr>` rather than a
          styled `<div>`: this IS a thematic break between the page's four
          parts, and the element that says so is the one that already
          means it. The three top-level sections below carry their spacing
          on this rule instead of their own `mt-`, so the gap above a
          heading and the gap below the rule stay one number. */}
      <hr className="full-bleed-rule mt-20" />
      <Section
        id="what-we-found"
        title="What we found"
        aside={`population-weighted · ${censusRuns.length} chains`}
        className="mt-14"
        heading="display"
        intro={
          <>
            Four headlines from the current sweep, across every published
            chain at once. The full ladder — every check, every status, one
            chain at a time — is on the{" "}
            <TextLink href="/census" tone="bright">findings page</TextLink>.
          </>
        }
      >
        <FindingTiles f={f} baseCaveat={censusRuns.some((r) => r.chain === "base")} />
        <p className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <TextLink href="/census" tone="bright">All findings, chain by chain →</TextLink>
          <TextLink href={`/reports/${report.slug}`} tone="bright">
            The report: {report.chains.length} chains, {report.agents} agents →
          </TextLink>
        </p>
      </Section>

      {/* A chapter break, at full width — see the `full-bleed-rule`
          utility in `globals.css`. `<hr>` rather than a
          styled `<div>`: this IS a thematic break between the page's four
          parts, and the element that says so is the one that already
          means it. The three top-level sections below carry their spacing
          on this rule instead of their own `mt-`, so the gap above a
          heading and the gap below the rule stay one number. */}
      <hr className="full-bleed-rule mt-20" />
      <Section
        id="provenance"
        title="Provenance"
        aside="reproducible"
        className="mt-14"
        heading="display"
      >
        {/* Two columns rather than `Section`'s single `intro` slot: the
            left column is the claim this section makes, the right is what
            the table under it actually is and where to go next. `intro`
            caps itself at `max-w-prose` for one paragraph, which would have
            stacked these two into one narrow measure and lost the pairing.
            Collapses to one column below `md`, where two columns of prose
            would each be too narrow to read. */}
        <div className="mb-8 grid gap-x-10 gap-y-4 text-[0.96875rem] leading-relaxed text-muted md:grid-cols-2">
          <p>
            Every number on this page comes from{" "}
            {/* The emphasis goes on the clause that makes the
                reproducibility claim falsifiable — one sweep, one block —
                rather than on the sentence that merely asserts it. */}
            <strong className="font-semibold text-text">
              one sweep per chain, pinned to one block each.
            </strong>{" "}
            A result you cannot recompute is an opinion; this is what
            recomputes it.
          </p>
          <p>
            The completed sweep behind each chain in the figures above —
            download any run, or read{" "}
            <TextLink href="/methodology" tone="bright">
              how each check is measured →
            </TextLink>
          </p>
        </div>
        <AllRunsProvenance runs={censusRuns} />
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <TextLink href="/methodology">How each check is measured →</TextLink>
          <TextLink href="/data">Download any run →</TextLink>
        </p>
      </Section>
    </>
  );
}
