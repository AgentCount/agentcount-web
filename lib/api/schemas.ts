/**
 * The wire contract, as Zod schemas.
 *
 * These mirror the serde structs in the Rust `api` crate. That is duplication
 * of the wire SHAPE, which is deliberate and different from duplicating
 * derivation: a shape mismatch fails loudly on the first request and names the
 * field, whereas a duplicated derivation renders a page that quietly
 * contradicts the API. Nothing in this file interprets a value — `display`
 * strings are passed through untouched.
 */
import { z } from "zod";

export const endpointDisplaySchema = z.object({
  status: z.string(),
  statement: z.string(),
});

export const agentSummarySchema = z.object({
  chain: z.string(),
  agent_id: z.number(),
  domain: z.string(),
  address: z.string(),
  registered_at: z.string(),
  endpoint_alive: z.boolean(),
  flag_count: z.number(),
  display: endpointDisplaySchema,
});

export const agentPageSchema = z.object({
  items: z.array(agentSummarySchema),
  page: z.object({
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
  }),
});

/**
 * Evidence is a tagged union on `type`. We keep every variant's fields so a
 * future evidence renderer has them, but the pages render
 * `display.evidence_summary` — the API's own wording.
 */
export const evidenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("tx"), chain: z.string(), tx_hash: z.string() }),
  z.object({ type: z.literal("snapshot"), snapshot_id: z.number() }),
  z.object({
    type: z.literal("probe_window"),
    from: z.string(),
    to: z.string(),
    probes: z.number(),
  }),
  z.object({ type: z.literal("registry"), chain: z.string() }),
]);

export const factSchema = z.object({
  kind: z.string(),
  // Deliberately unmodelled: `value` differs per kind and is the machine-
  // readable form. This app renders `display`.
  value: z.unknown(),
  observed_at: z.string(),
  evidence: z.array(evidenceSchema),
  display: z.object({
    label: z.string(),
    statement: z.string(),
    evidence_summary: z.string(),
  }),
});

export const flagSchema = z.object({
  kind: z.string(),
  evidence: z.unknown(),
  raised_at: z.string(),
  display: z.object({ label: z.string(), statement: z.string() }),
});

export const agentDetailSchema = z.object({
  summary: agentSummarySchema,
  facts: z.array(factSchema),
  flags: z.array(flagSchema),
});

export const chainSchema = z.object({
  chain: z.string(),
  chain_id: z.number(),
  agents: z.number(),
});
export const chainsSchema = z.array(chainSchema);

export const statsSchema = z.object({
  total_agents: z.number(),
  live_endpoints: z.number(),
  payable_endpoints: z.number(),
  metadata_resolving: z.number(),
  flagged_agents: z.number(),
  flags_by_kind: z.array(
    z.object({ kind: z.string(), label: z.string(), count: z.number() }),
  ),
});

export const methodologySchema = z.object({
  liveness_window_days: z.number(),
  rot_after_days: z.number(),
});

export type AgentSummary = z.infer<typeof agentSummarySchema>;
export type AgentPage = z.infer<typeof agentPageSchema>;
export type Fact = z.infer<typeof factSchema>;
export type Flag = z.infer<typeof flagSchema>;
export type AgentDetail = z.infer<typeof agentDetailSchema>;
export type Chain = z.infer<typeof chainSchema>;
export type Stats = z.infer<typeof statsSchema>;
export type Methodology = z.infer<typeof methodologySchema>;
