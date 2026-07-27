/**
 * One function per endpoint. Pages call these, never `get()` directly, so the
 * URL shapes and their schemas stay paired in one file.
 */
import { get } from "./client";
import {
  agentDetailSchema,
  agentPageSchema,
  chainsSchema,
  methodologySchema,
  statsSchema,
  type AgentDetail,
  type AgentPage,
  type Chain,
  type Methodology,
  type Stats,
} from "./schemas";

export { pingApi } from "./client";

export type ListAgentsParams = {
  chain?: string;
  limit?: number;
  offset?: number;
  sort?: "registered" | "alive";
};

export async function listAgents(params: ListAgentsParams = {}): Promise<AgentPage> {
  const q = new URLSearchParams();
  if (params.chain) q.set("chain", params.chain);
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  if (params.sort) q.set("sort", params.sort);
  const qs = q.toString();
  return (await get(`/api/agents${qs ? `?${qs}` : ""}`, agentPageSchema)) as AgentPage;
}

export async function getAgent(chain: string, id: string): Promise<AgentDetail | null> {
  return get(
    `/api/agents/${encodeURIComponent(chain)}/${encodeURIComponent(id)}`,
    agentDetailSchema,
    { allow404: true },
  );
}

export async function listChains(): Promise<Chain[]> {
  return (await get("/api/chains", chainsSchema)) as Chain[];
}

export async function getStats(): Promise<Stats> {
  return (await get("/api/stats", statsSchema)) as Stats;
}

/** Cached for an hour — these are compile-time constants in the Rust binary. */
export async function getMethodology(): Promise<Methodology> {
  return (await get("/api/methodology", methodologySchema, {
    revalidate: 3600,
  })) as Methodology;
}
