/**
 * The wire contract, as Zod schemas.
 *
 * These mirror the serde structs in the Rust `api` crate. That is duplication
 * of the wire SHAPE, which is deliberate and different from duplicating
 * derivation: a shape mismatch fails loudly on the first request and names
 * the field, whereas a duplicated derivation renders a page that quietly
 * contradicts the API.
 *
 * `evidence` is deliberately left as a loose record: its keys differ per rung
 * (rung 1's evidence has `registry`/`tx_hash`; rung 4's has
 * `fields_found`/`fields_missing`) and per status (a `skipped` row carries
 * `skipped_because_rung`/`skipped_because_status` instead of that rung's
 * usual fields; an `error` row carries `reason`). Modelling every variant as
 * a discriminated union would mean guessing at a closed set that the API
 * never promises is closed — and this app renders evidence generically
 * (key/value), so it never needs to narrow the type. Same reasoning applies
 * to `status`: it is a free string, not a fixed enum, so a rung the API adds
 * later still parses instead of throwing a ContractError for a status this
 * app simply doesn't have special color handling for yet.
 */
import { z } from "zod";

export const runSchema = z.object({
  run_id: z.string(),
  chain: z.string(),
  // Nullable: a handful of early dev/test runs (`checker_commit` ending
  // `-dirty`) recorded no pinned block at all. A real sweep always sets
  // this, but the schema must accept what the API actually stored rather
  // than assume every historical row is well-formed.
  pinned_block: z.number().nullable(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  agent_count: z.number().nullable(),
  schema_version: z.number(),
  checker_version: z.string(),
  checker_commit: z.string(),
  spec_commit: z.string(),
  rerun_command: z.string(),
});
export const runsSchema = z.array(runSchema);

export const rateCountSchema = z.object({
  status: z.string(),
  count: z.number(),
});

export const rungRateSchema = z.object({
  rung: z.number(),
  /** The checker's own word for this rung. Read, never typed here: rung 7 was
   * `independent` until 2026-07-29, and anything holding a literal copy would
   * still be showing the retracted name. */
  name: z.string(),
  counts: z.array(rateCountSchema),
});

export const ratesSchema = z.object({
  run_id: z.string(),
  agent_count: z.number(),
  rungs: z.array(rungRateSchema),
});

/** The per-rung shape a directory listing carries: bare status, no evidence.
 * A rung this run never reached (short-circuited by an earlier failure, or
 * not yet implemented) is simply absent from the array — never synthesised
 * as a fourth status. */
export const rungSummarySchema = z.object({
  rung: z.number(),
  name: z.string(),
  status: z.string(),
});

export const agentSummarySchema = z.object({
  chain: z.string(),
  agent_id: z.number(),
  owner: z.string(),
  agent_uri: z.string(),
  block_number: z.number(),
  observed_at: z.string(),
  /** What the document called itself. `null` when it declared no usable name
   * or never parsed — the API never sends "" and never sends a synthesised
   * "Agent #N", so the fallback is this app's to render. */
  name: z.string().nullable(),
  rungs: z.array(rungSummarySchema),
});

export const agentPageSchema = z.object({
  items: z.array(agentSummarySchema),
  page: z.object({
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
  }),
});

export const rungDetailSchema = z.object({
  rung: z.number(),
  name: z.string(),
  status: z.string(),
  evidence: z.record(z.string(), z.unknown()),
  checked_at: z.string(),
});

export const snapshotSchema = z.object({
  token_id: z.string(),
  owner: z.string(),
  agent_uri: z.string(),
  block_number: z.number(),
  observed_at: z.string(),
});

export const archiveSchema = z.object({
  scheme: z.string(),
  request_url: z.string().nullable(),
  final_url: z.string().nullable(),
  http_status: z.number().nullable(),
  content_type: z.string().nullable(),
  body_bytes: z.number().nullable(),
  body_sha256: z.string().nullable(),
  truncated: z.boolean(),
  error: z.string().nullable(),
  // `Option<i32>` in the Rust `ArchiveSummary`, so nullable here. It was
  // declared non-nullable until 2026-07-29, which would have thrown a
  // ContractError — and shown "the API may be down" — for any archive row
  // that recorded no elapsed time.
  elapsed_ms: z.number().nullable(),
});

export const agentDetailSchema = z.object({
  run_id: z.string(),
  chain: z.string(),
  agent_id: z.number(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  snapshot: snapshotSchema,
  rungs: z.array(rungDetailSchema),
  // `Option<ArchiveSummary>` in Rust: an agent with no archive row at all
  // sends `null`. Same drift as `elapsed_ms` above, same consequence.
  archive: archiveSchema.nullable(),
});

export const rung4FieldSchema = z.object({
  field: z.string(),
  condition: z.string(),
});

/** One MUST rule from the spec, with the fields it covers. Counted as
 * REQUIREMENTS, not fields: the current pin has one rule covering two fields,
 * and rendering "2" would read as two unconditional obligations when there are
 * none. The API decides this, never this app. */
export const mustRequirementSchema = z.object({
  requirement: z.string(),
  fields: z.array(z.string()),
  conditional: z.boolean(),
});

/**
 * Rung 4's three severity buckets.
 *
 * This schema asked for `rung4_required_fields` until 2026-07-29 — a field the
 * API stopped sending when P0 FIX 3 split rung 4 by RFC 2119 severity. Every
 * load of /methodology threw a ContractError as a result. The lesson is the
 * one this file's header already claims: a shape mismatch fails loudly and
 * names the field, which is exactly what happened — nobody was looking.
 */
export const methodologySchema = z.object({
  spec_commit: z.string(),
  checker_version: z.string(),
  schema_version: z.number(),
  rung4_must_fields: z.array(rung4FieldSchema),
  rung4_should_fields: z.array(z.string()),
  rung4_may_fields: z.array(z.string()),
  rung4_must_requirements: z.array(mustRequirementSchema),
});

/**
 * A headline census number, as the populations behind it.
 *
 * `percent` is computed by the API rather than here on purpose: a percentage
 * derived in this app is a second implementation of the census's arithmetic,
 * free to drift from the published report. This app formats; it does not
 * divide. `null` when the denominator is zero — a rate over nobody is
 * undefined, not 0%.
 */
export const findingSchema = z.object({
  key: z.string(),
  numerator: z.number(),
  denominator: z.number(),
  percent: z.number().nullable(),
  denominator_label: z.string(),
});

export const findingsSchema = z.object({
  run_id: z.string(),
  findings: z.array(findingSchema),
});

export type Run = z.infer<typeof runSchema>;
export type RateCount = z.infer<typeof rateCountSchema>;
export type RungRate = z.infer<typeof rungRateSchema>;
export type Rates = z.infer<typeof ratesSchema>;
export type RungSummary = z.infer<typeof rungSummarySchema>;
export type AgentSummary = z.infer<typeof agentSummarySchema>;
export type AgentPage = z.infer<typeof agentPageSchema>;
export type RungDetail = z.infer<typeof rungDetailSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Archive = z.infer<typeof archiveSchema>;
export type AgentDetail = z.infer<typeof agentDetailSchema>;
export type Rung4Field = z.infer<typeof rung4FieldSchema>;
export type MustRequirement = z.infer<typeof mustRequirementSchema>;
export type Methodology = z.infer<typeof methodologySchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Findings = z.infer<typeof findingsSchema>;
