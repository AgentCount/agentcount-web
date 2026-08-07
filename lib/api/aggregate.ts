/**
 * All-chains aggregation — the census population, not one chain's slice.
 *
 * ## The exception this module is
 *
 * `lib/api/schemas.ts` states the rule this app otherwise follows without
 * exception: percentages are computed by the API, because "a percentage
 * derived in this app is a second implementation of the census's arithmetic,
 * free to drift from the published report. This app formats; it does not
 * divide."
 *
 * That rule stands everywhere except here, and the exception is deliberate
 * and bounded. The API has no all-chains endpoint: `/findings` is per run,
 * and a run sweeps one chain. The homepage's whole claim is about the
 * population, so the choice was between dividing in one audited place and
 * publishing a headline figure nobody can recompute — and an unrecomputable
 * number on this site would contradict the thing the site is for.
 *
 * So: division happens in `aggregateFinding` and nowhere else in the
 * application. If the API grows an all-chains findings endpoint, delete this
 * module and read that instead rather than keeping both.
 *
 * ## Population-weighted, never a mean of chains
 *
 * Rates are re-derived from summed numerators and denominators, never
 * averaged across chains. Averaging would let Celo's 9,747 agents weigh as
 * much as BSC's 244,208 — the precise distortion the four-chain report was
 * written to correct, and the reason its headline attestation rate is 12.2%
 * rather than the 33.7% a per-chain mean produces.
 */
import { isCompletedRun } from "./schemas";
import type { Finding, Findings, Run } from "./schemas";

/**
 * The newest completed run for each chain, largest population first.
 *
 * In-flight sweeps (`finished_at: null`) are skipped for the same reason
 * `resolveRun` skips them: their counts move while the page is being read.
 *
 * So are runs that ended badly. `finished_at` is stamped when a sweep *stops*,
 * including when it dies, so it does not distinguish a complete run from a
 * failed one — and this function picking the most recent by date meant a
 * failed run outranked a good one. Base run `24d4d0e0` failed after two and a
 * half minutes on 2026-08-05 having written nothing, and the directory
 * consequently told readers there were **0 agents on Base** while a
 * 60,589-agent run sat directly behind it.
 *
 * `status` is the field that settles it, and it did not exist here until the
 * API began serving it on 2026-08-07 — which is why this could not simply have
 * been written correctly the first time. Runs from an older API carry no
 * status; those are kept, because dropping every run an older API describes
 * would empty the site rather than correct it.
 *
 * Ordered by population rather than by date so the reader meets the chains in
 * the order they weigh on every aggregate — the top row of the provenance
 * table is the chain doing most of the work in the headline number.
 */
export function latestRunPerChain(runs: Run[]): Run[] {
  const newest = new Map<string, Run>();
  for (const r of runs) {
    if (!isCompletedRun(r)) continue;
    const held = newest.get(r.chain);
    if (!held || r.started_at > held.started_at) newest.set(r.chain, r);
  }
  return [...newest.values()].sort((a, b) => (b.agent_count ?? 0) - (a.agent_count ?? 0));
}

/**
 * The runs the headline may quote: newest COMPLETED and PUBLISHED, per chain.
 *
 * ## Why "latest completed" is not safe enough for a headline
 *
 * `/api/runs` has no field distinguishing a census sweep from a proof sweep,
 * and no field marking a run superseded or retracted. `latestRunPerChain`
 * therefore answers "which finished most recently", which is a different
 * question from "which one is the census" — and production data already
 * contains the collision: on 2026-07-29 a 400-agent proof sweep of bsc
 * completed 93 minutes before the 244,208-agent census sweep of the same
 * chain, and base carries ten runs of which six are sweeps of 25 to 1,998
 * agents. Nothing but arrival order kept a proof sweep out of the headline,
 * and arrival order is not a property anyone controls.
 *
 * ## Publication is the canonicality signal
 *
 * A published run has an archive at a permanent URL and a sha256 committed to
 * git in the core repository (see `lib/published-runs.ts`). That commit is a
 * human act, made once per census sweep and never for a proof sweep — which
 * makes it exactly the marker the API lacks. As of 2026-08-01 the four
 * published runs are precisely the four the report is built on, and they sum
 * to its 354,858.
 *
 * The cost is staleness rather than error: a genuine new sweep does not reach
 * the headline until its archive is published. That is the correct direction
 * to fail for a claim of this weight — a number whose archive anyone can
 * download, slightly behind, beats a fresher number nobody can check.
 *
 * A chain with no published run is DROPPED, not guessed at; the caller's copy
 * names the chains it actually summed, so the sentence can never claim a
 * chain the figures do not include.
 */
export function canonicalRuns(runs: Run[], publishedIds: ReadonlySet<string>): Run[] {
  const published = runs.filter((r) => publishedIds.has(r.run_id));
  const picked = latestRunPerChain(published);
  // Nothing published at all — a fresh deployment, or a `published-runs.json`
  // that has fallen out of step with the API's run ids. An empty homepage is
  // worse than a degraded one, and the copy names what it summed either way,
  // so this falls back rather than rendering nothing.
  return picked.length > 0 ? picked : latestRunPerChain(runs);
}

/**
 * The population the homepage headline counts.
 *
 * A `null` agent_count contributes 0 rather than poisoning the sum to NaN —
 * a handful of early dev runs recorded no count, and one of them reaching
 * this function must not blank the headline.
 */
export function totalAgents(runs: Run[]): number {
  return runs.reduce((sum, r) => sum + (r.agent_count ?? 0), 0);
}

/**
 * One finding, summed across runs and re-rated over the whole population.
 *
 * Runs that never reported the key are skipped rather than counted as zero:
 * a chain whose sweep predates a finding has no opinion about it, and
 * treating that as "0 of 0" is arithmetically harmless but semantically a
 * lie. Only if NO run reported it does this throw — the same stance
 * `app/page.tsx` takes for a missing headline number, because rendering "—"
 * where the page's argument should be is worse than failing loudly.
 */
/**
 * Re-scope a per-run denominator label to the population.
 *
 * The API labels one finding's denominator "agents in this run", which is
 * exactly right for the page it was written for and false under a figure
 * summed over several. This app's standing rule is to print the API's words
 * untouched — but printing a qualifier that misdescribes the number it
 * qualifies is the worse failure, and this is a census whose whole promise is
 * that the qualifier is true.
 *
 * So the substitution is deliberately narrow: only the exact phrase "this
 * run", only when more than one run went into the figure. Every other label
 * ("documents that parsed and reached rung 4") is scope-neutral and passes
 * through untouched.
 */
function rescope(label: string, runCount: number): string {
  if (runCount < 2) return label;
  return label.replace(/\bthis run\b/, `these ${runCount} runs`);
}

export function aggregateFinding(perRun: Findings[], key: string): Finding {
  const rows = perRun
    .map((f) => f.findings.find((x) => x.key === key))
    .filter((x): x is Finding => x !== undefined);
  if (rows.length === 0) {
    throw new Error(
      `no run reported the finding '${key}' — the all-chains view cannot render without it`,
    );
  }
  const numerator = rows.reduce((s, r) => s + r.numerator, 0);
  const denominator = rows.reduce((s, r) => s + r.denominator, 0);
  return {
    key,
    numerator,
    denominator,
    // The one division in the application. `null` over an empty population,
    // matching the API's own contract: a rate over nobody is undefined, not
    // 0%, and `FindingTile` already renders that case as an em dash.
    percent: denominator === 0 ? null : (numerator / denominator) * 100,
    // Every run labels this denominator the same way, so the first is the
    // API's word for it — re-scoped only where that word says "this run".
    denominator_label: rescope(rows[0].denominator_label, rows.length),
  };
}
