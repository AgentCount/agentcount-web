/**
 * One function per endpoint. Pages call these, never `get()` directly, so the
 * URL shapes and their schemas stay paired in one file.
 */
import { get } from "./client";
import {
  agentDetailSchema,
  agentPageSchema,
  methodologySchema,
  ratesSchema,
  runsSchema,
  type AgentDetail,
  type AgentPage,
  type Methodology,
  type Rates,
  type Run,
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
export async function resolveRun(preferRunId?: string): Promise<Run> {
  const runs = await listRuns();
  if (preferRunId) {
    const match = runs.find((r) => r.run_id === preferRunId);
    if (match) return match;
  }
  const completed = runs.find((r) => r.finished_at !== null);
  if (!completed) {
    throw new Error("no completed run is available yet");
  }
  return completed;
}

export type ListAgentsParams = {
  run?: string;
  chain?: string;
  rung?: number;
  status?: string;
  limit?: number;
  offset?: number;
};

export async function listAgents(params: ListAgentsParams = {}): Promise<AgentPage> {
  const q = new URLSearchParams();
  if (params.run) q.set("run", params.run);
  if (params.chain) q.set("chain", params.chain);
  if (params.rung !== undefined) q.set("rung", String(params.rung));
  if (params.status) q.set("status", params.status);
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

export async function getRates(runId: string): Promise<Rates> {
  return (await get(`/api/runs/${encodeURIComponent(runId)}/rates`, ratesSchema)) as Rates;
}

/** Cached for an hour — `spec_commit` and the field list change only when the
 * checker is redeployed against a new spec pin, not per request. */
export async function getMethodology(): Promise<Methodology> {
  return (await get("/api/methodology", methodologySchema, {
    revalidate: 3600,
  })) as Methodology;
}
