/**
 * One function per endpoint. Pages call these, never `get()` directly, so the
 * URL shapes and their schemas stay paired in one file.
 */
import { get, postNoBody, postRaw } from "./client";
import { CENSUS } from "../brand";
import {
  agentDetailSchema,
  agentPageSchema,
  findingsSchema,
  isCompletedRun,
  searchResponseSchema,
  methodologySchema,
  ratesSchema,
  runsSchema,
  spotCheckSchema,
  validateResponseSchema,
  type AgentDetail,
  type AgentPage,
  type Findings,
  type SearchGroup,
  type Methodology,
  type Rates,
  type Run,
  type SpotCheck,
  type ValidateResponse,
} from "./schemas";

export { pingApi } from "./client";

export async function listRuns(): Promise<Run[]> {
  return (await get("/api/runs", runsSchema, { revalidate: 30 })) as Run[];
}

/**
 * Newest-first, per `listRuns`. Picks the run named by `preferRunId` if it is
 * present in that list, otherwise the newest with `finished_at` set — never
 * an in-flight sweep, which carries `finished_at: null` and would make every
 * count on the page a moving target while it runs.
 *
 * A page calls this once and threads the resulting `run_id` through every
 * other fetch it makes, so a paginated listing or a stats page reads
 * consistently even if another run finishes while the reader is on the page.
 */
export async function resolveRun(preferRunId?: string, chain?: string): Promise<Run> {
  const runs = await listRuns();
  if (preferRunId) {
    const match = runs.find((r) => r.run_id === preferRunId);
    if (match) return match;
  }
  // Scoped to one chain when asked. Without this, "the newest completed run"
  // silently means "whichever chain finished sweeping most recently" — so
  // adding a second chain would make the homepage's numbers change chain
  // underneath the reader with no visible cause.
  const pool = chain ? runs.filter((r) => r.chain === chain) : runs;
  const completed = pool.find(isCompletedRun);
  if (completed) return completed;

  // A chain that was asked for but has never finished a sweep falls back to
  // whatever HAS been swept, rather than erroring: an empty site is worse than
  // a different one, and every page names the chain it is showing.
  const anyCompleted = runs.find(isCompletedRun);
  if (!anyCompleted) {
    throw new Error("no completed run is available yet");
  }
  return anyCompleted;
}

/**
 * The run a page should show, given an optional `?chain=` and `?run=`.
 *
 * Centralised so no page reinvents the default. Reading `?chain=` on one page
 * and not another is how a chain switcher quietly stops working on half the
 * site.
 */
export async function resolveRunForRequest(params: {
  run?: string;
  chain?: string;
}): Promise<Run> {
  return resolveRun(params.run, params.chain ?? CENSUS.defaultChain);
}

/**
 * The chains that have something to show, newest run first.
 *
 * Derived from the runs themselves rather than from a chain list: a chain
 * configured but never swept has no census to display, and offering it in a
 * switcher would lead to an error page. A chain appears here the moment its
 * first sweep finishes, with no code change.
 */
export function chainsWithRuns(runs: Run[]): string[] {
  const seen: string[] = [];
  for (const r of runs) {
    if (isCompletedRun(r) && !seen.includes(r.chain)) seen.push(r.chain);
  }
  return seen;
}

export type ListAgentsParams = {
  run?: string;
  chain?: string;
  rung?: number;
  status?: string;
  /** `rung:status` pairs, ANDed by the API. Serialised comma-separated. */
  facets?: RungFacet[];
  /** Free text over name and description, or an owner-address prefix. */
  q?: string;
  limit?: number;
  offset?: number;
};

/** One rung/status condition. The `status` string is never invented here — it
 * comes from the run's own rates (see `statusVocabulary`), so a filter can
 * never offer a value the API would reject. */
export type RungFacet = { rung: number; status: string };

export function serialiseFacets(facets: RungFacet[]): string {
  return facets.map((f) => `${f.rung}:${f.status}`).join(",");
}

/**
 * Parse the `facet` query parameter back into pairs, dropping anything that is
 * not a rung this run reported or a status it produced.
 *
 * Validating against the API's own vocabulary rather than a literal list here
 * is the same rule the rest of this app follows: a hand-edited URL cannot make
 * this app send a rung or status the API never had, and it cannot make the
 * page render a status word this app invented.
 */
export function parseFacets(
  raw: string | string[] | undefined,
  validRungs: number[],
  validStatuses: string[],
): RungFacet[] {
  if (!raw) return [];
  // A checkbox group posts `facet=2:pass&facet=5:pass`, which Next hands over
  // as an array; a hand-written or shared link may use the comma-separated
  // form the API itself takes. Both are accepted and normalise to the same
  // list, so a filtered view stays linkable however it was produced.
  const parts = (Array.isArray(raw) ? raw : [raw]).flatMap((r) => r.split(","));
  const seen = new Set<string>();
  const out: RungFacet[] = [];
  for (const part of parts) {
    const [rungStr, status] = part.split(":");
    const rung = Number(rungStr);
    if (!Number.isInteger(rung) || !validRungs.includes(rung)) continue;
    if (!status || !validStatuses.includes(status)) continue;
    const key = `${rung}:${status}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ rung, status });
  }
  return out;
}

export async function listAgents(params: ListAgentsParams = {}): Promise<AgentPage> {
  const q = new URLSearchParams();
  if (params.run) q.set("run", params.run);
  if (params.chain) q.set("chain", params.chain);
  if (params.rung !== undefined) q.set("rung", String(params.rung));
  if (params.status) q.set("status", params.status);
  if (params.facets && params.facets.length > 0) {
    q.set("facet", serialiseFacets(params.facets));
  }
  if (params.q) q.set("q", params.q);
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  const qs = q.toString();
  return (await get(`/api/agents${qs ? `?${qs}` : ""}`, agentPageSchema)) as AgentPage;
}

export async function getAgent(
  chain: string,
  id: string,
  run?: string,
): Promise<AgentDetail | null> {
  const qs = run ? `?run=${encodeURIComponent(run)}` : "";
  return get(
    `/api/agents/${encodeURIComponent(chain)}/${encodeURIComponent(id)}${qs}`,
    agentDetailSchema,
    { allow404: true },
  );
}

/**
 * Cross-run search — one query over an explicit set of runs, grouped per run
 * in the order given. The caller passes its canonical run ids because
 * "published" is decided by a git commit this API has no view of (see
 * `lib/api/aggregate.ts`).
 *
 * Returns `null` when the API predates the endpoint (404), so the search
 * page can fall back to per-chain links instead of erroring — the site must
 * keep working against an older API during a deploy window.
 */
export async function searchAgents(
  q: string,
  runIds: string[],
): Promise<SearchGroup[] | null> {
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("runs", runIds.join(","));
  return get(`/api/search?${params.toString()}`, searchResponseSchema, {
    allow404: true,
  }) as Promise<SearchGroup[] | null>;
}

export async function getRates(runId: string): Promise<Rates> {
  return (await get(`/api/runs/${encodeURIComponent(runId)}/rates`, ratesSchema)) as Rates;
}

/** The numbers the homepage leads with, as numerator/denominator/percent. */
export async function getFindings(runId: string): Promise<Findings> {
  return (await get(
    `/api/runs/${encodeURIComponent(runId)}/findings`,
    findingsSchema,
  )) as Findings;
}

/**
 * Which rungs this run actually reported, and which status words it produced.
 *
 * Both are read from the run's own rates rather than written down here. The
 * ladder is seven rungs by design, but rung 6 is not implemented and produces
 * no rows at all — so "the rungs a filter may offer" and "the rungs that
 * exist" are different lists, and only the API knows the first one. The same
 * goes for statuses: `unclaimed` appeared on 2026-07-29 and this app needed no
 * change to start offering it.
 */
export function rungVocabulary(rates: Rates): number[] {
  return rates.rungs.map((r) => r.rung).sort((a, b) => a - b);
}

export function statusVocabulary(rates: Rates): string[] {
  return Array.from(
    new Set(rates.rungs.flatMap((r) => r.counts.map((c) => c.status))),
  ).sort();
}

/** The identity a builder intends to register under. All three or none — the
 * API rejects a partial one rather than half-applying it. */
export type IntendedIdentity = {
  agentId: string;
  chainId: string;
  registry: string;
};

/**
 * Judge a draft registration document. Rung 5 is only answered when an
 * intended identity is supplied; without one the API omits that rung entirely
 * and the UI renders it "not checked", same as any rung a run never reached.
 */
export async function validateDocument(
  document: string,
  intended?: IntendedIdentity,
): Promise<ValidateResponse> {
  const q = new URLSearchParams();
  if (intended) {
    q.set("agent_id", intended.agentId);
    q.set("chain_id", intended.chainId);
    q.set("registry", intended.registry);
  }
  const qs = q.toString();
  return postRaw(`/api/validate${qs ? `?${qs}` : ""}`, document, validateResponseSchema);
}

/**
 * Run the ladder for one agent, right now. Belongs to no run and is stored
 * nowhere — see the API's `routes::spot_check`.
 *
 * POST, and never called from a page render: it makes the API send a real
 * request to a third party's server, so it must only ever run because somebody
 * pressed something. Everything that follows links speculatively — prefetch,
 * link unfurlers, crawlers, `<img src>` — issues GET, which this endpoint does
 * not answer.
 *
 * Returns `null` when the API predates the endpoint, exactly as `searchAgents`
 * does: the site must keep working against an older API during a deploy
 * window, and the button's own panel says so rather than the page erroring.
 * Every other refusal arrives as a `RefusedError` for the caller to render.
 */
export async function spotCheckAgent(
  chain: string,
  id: string,
): Promise<SpotCheck | null> {
  return postNoBody(
    `/api/agents/${encodeURIComponent(chain)}/${encodeURIComponent(id)}/spot-check`,
    spotCheckSchema,
  );
}

/** Cached for an hour — `spec_commit` and the field list change only when the
 * checker is redeployed against a new spec pin, not per request. */
export async function getMethodology(): Promise<Methodology> {
  return (await get("/api/methodology", methodologySchema, {
    revalidate: 3600,
  })) as Methodology;
}
