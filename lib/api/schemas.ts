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
  /**
   * `running`, `finished`, `failed` or `stalled`.
   *
   * A free string, like every other status here, so a state the sweeper adds
   * later parses instead of throwing a ContractError.
   *
   * Optional because runs published before 2026-08-07 were served without it.
   * `undefined` means "this API does not say", which is treated as usable —
   * the alternative is a schema bump that empties the site against an older
   * API. Once nothing serves the old shape this can become required.
   */
  status: z.string().optional(),
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

/** One run's slice of a cross-run search: the caller's run, its chain, how
 * many matched in total, and the first few matches in the directory's own
 * row shape. */
export const searchGroupSchema = z.object({
  run_id: z.string(),
  chain: z.string(),
  total: z.number(),
  items: z.array(agentSummarySchema),
});

export const searchResponseSchema = z.array(searchGroupSchema);

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

/**
 * An agent the registry contains but no census run has swept yet.
 *
 * Deliberately shares only `chain` and `agent_id` with the census shape: no
 * `run_id`, no `snapshot`, and no `rungs` — not an empty array, no array at
 * all. "All seven checks are missing" and "all seven checks failed" render
 * identically in most UIs, so the absence has to be structural. A discriminated
 * union on `source` makes the compiler enforce that a caller handles both.
 */
export const tailAgentSchema = z.object({
  source: z.literal("tail"),
  chain: z.string(),
  agent_id: z.number(),
  token_id: z.string(),
  owner: z.string(),
  agent_uri: z.string(),
  discovery_block: z.number(),
  discovered_at: z.string(),
  checks_available: z.literal(false),
});

export const censusAgentDetailSchema = z.object({
  /** Absent on an API that predates the tail; treated as census either way. */
  source: z.literal("census").optional(),
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

/** Either shape. Callers branch on `source`. */
export const agentDetailSchema = z.union([
  tailAgentSchema,
  censusAgentDetailSchema,
]);

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

/** One status transition between the two runs of a delta's pair. */
export const flipSchema = z.object({
  rung: z.number(),
  from: z.string(),
  to: z.string(),
  agents: z.number(),
});

/**
 * What changed between one run and the previous finished run on its chain —
 * computed once at sweep time by the census, never here. Two rules travel
 * with it (METHODOLOGY §9):
 *
 * `stopped_resolving` and `newly_resolving` already exclude transitions
 * into or out of `refused` (an origin declining a probe is not the agent
 * going away); `rung2_declined` is the excluded volume, served so the
 * exclusion is visible without this app summing `flips` itself.
 *
 * When `method_changed` is true, the checker or evidence schema differs
 * across the pair and an unknown share of the movement is method, not the
 * world — any rendering of this object must say so. The API precomputes the
 * flag; this app must not re-derive it from the four version fields.
 */
export const deltaSchema = z.object({
  run_id: z.string(),
  previous_run_id: z.string(),
  chain: z.string(),
  agents_before: z.number(),
  agents_after: z.number(),
  newly_registered: z.number(),
  disappeared: z.number(),
  newly_resolving: z.number(),
  stopped_resolving: z.number(),
  rung2_declined: z.number(),
  rung2_errored: z.number(),
  flips: z.array(flipSchema),
  checker_before: z.string(),
  checker_after: z.string(),
  schema_before: z.number(),
  schema_after: z.number(),
  method_changed: z.boolean(),
  computed_at: z.string(),
});

export type Run = z.infer<typeof runSchema>;

/**
 * Whether a run may be shown to a reader as a census.
 *
 * The one predicate, in one place, because it was previously written out at
 * four call sites as `finished_at !== null` and every one of them was wrong in
 * the same way. `finished_at` records when a sweep STOPPED, and a sweep that
 * dies is stamped with the moment it died — so a failed run and a complete one
 * are indistinguishable by that column alone.
 *
 * Base run `24d4d0e0` is the cost of the omission: it failed after two and a
 * half minutes on 2026-08-05 having written zero agents, and being the most
 * recent base run with a `finished_at`, it became the default everywhere. The
 * directory reported **0 agents on Base** with a complete 60,589-agent run one
 * row behind it.
 *
 * A run whose `status` is absent is accepted: that is an API older than
 * 2026-08-07, which did not serve the column. Rejecting those would empty the
 * site against an older API rather than correct it.
 */
export function isCompletedRun(r: Run): boolean {
  if (r.finished_at === null) return false;
  return r.status === undefined || r.status === "finished";
}

export type RateCount = z.infer<typeof rateCountSchema>;
export type RungRate = z.infer<typeof rungRateSchema>;
export type Rates = z.infer<typeof ratesSchema>;
export type RungSummary = z.infer<typeof rungSummarySchema>;
export type AgentSummary = z.infer<typeof agentSummarySchema>;
export type AgentPage = z.infer<typeof agentPageSchema>;
export type SearchGroup = z.infer<typeof searchGroupSchema>;
export type RungDetail = z.infer<typeof rungDetailSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Archive = z.infer<typeof archiveSchema>;
export type AgentDetail = z.infer<typeof agentDetailSchema>;
export type TailAgent = z.infer<typeof tailAgentSchema>;
export type CensusAgentDetail = z.infer<typeof censusAgentDetailSchema>;
export type Delta = z.infer<typeof deltaSchema>;
export type Flip = z.infer<typeof flipSchema>;

/** Narrows the union. The one place the discriminator is read. */
export function isTailAgent(a: AgentDetail): a is TailAgent {
  return "source" in a && a.source === "tail";
}
/**
 * The pre-flight checker's answer.
 *
 * `rungs` carries only the rungs that could be asked of a draft — a rung
 * ABSENT from it was not checked, which is the same vocabulary the census uses
 * for a rung a run never reached. `not_applicable` says why each absent one is
 * absent, in the API's words rather than this app's.
 */
export const validateRungSchema = z.object({
  rung: z.number(),
  name: z.string(),
  status: z.string(),
  evidence: z.record(z.string(), z.unknown()),
  checked_at: z.string(),
});

export const notApplicableSchema = z.object({
  rung: z.number(),
  name: z.string(),
  reason: z.string(),
});

export const validateResponseSchema = z.object({
  checker_version: z.string(),
  schema_version: z.number(),
  spec_commit: z.string(),
  body_bytes: z.number(),
  body_sha256: z.string(),
  rungs: z.array(validateRungSchema),
  not_applicable: z.array(notApplicableSchema),
});

export type ValidateRung = z.infer<typeof validateRungSchema>;
export type NotApplicable = z.infer<typeof notApplicableSchema>;
export type ValidateResponse = z.infer<typeof validateResponseSchema>;

export type Rung4Field = z.infer<typeof rung4FieldSchema>;
export type MustRequirement = z.infer<typeof mustRequirementSchema>;
export type Methodology = z.infer<typeof methodologySchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Findings = z.infer<typeof findingsSchema>;

/**
 * The on-demand spot check: one agent, right now, belonging to no run.
 *
 * ## Why this is not `agentDetailSchema` with a flag
 *
 * The API deliberately shares NO top-level field name with the census's agent
 * detail: `checks`/`fetch`/`identity` here against `rungs`/`archive`/
 * `snapshot`/`run_id` there, and there is no `run_id` at all because there is
 * no run. That separation is the API's own safeguard against a spot check
 * being read — or screenshotted, or pasted — as a census measurement, and it
 * only holds if this app keeps the two shapes apart too. A shared schema with
 * an optional `run_id` would quietly re-merge them on the first refactor that
 * looked at the two files together.
 *
 * `source` is the discriminator and `notice` is the sentence the API wants
 * carried with the data. Both are parsed as free strings rather than pinned to
 * literals: this app renders the API's words untouched, and a reworded notice
 * must not become a ContractError that hides the result entirely.
 */
export const spotIdentitySchema = z.object({
  chain_id: z.number(),
  registry: z.string(),
  /** Decimal STRING: a `uint256` token id does not survive a JSON number. */
  token_id: z.string(),
  owner: z.string(),
  agent_uri: z.string(),
});

/**
 * What the one document fetch looked like — never the body.
 *
 * Same fields as the census's `archive` plus `via_gateway`, and deliberately
 * NOT called an archive on either side: nothing was archived, these bytes were
 * read and dropped. Every field is nullable for the same reason the archive's
 * are, and the whole object is nullable because no fetch is attempted at all
 * when rung 1 did not pass.
 */
export const spotFetchSchema = z.object({
  scheme: z.string(),
  request_url: z.string().nullable(),
  final_url: z.string().nullable(),
  http_status: z.number().nullable(),
  content_type: z.string().nullable(),
  body_bytes: z.number().nullable(),
  body_sha256: z.string().nullable(),
  truncated: z.boolean(),
  error: z.string().nullable(),
  elapsed_ms: z.number().nullable(),
  via_gateway: z.string().nullable(),
});

export const spotCheckRungSchema = z.object({
  rung: z.number(),
  name: z.string(),
  status: z.string(),
  evidence: z.record(z.string(), z.unknown()),
  checked_at: z.string(),
});

/** A rung this check never asked, and the API's own reason. Same shape as the
 * pre-flight checker's `not_applicable`, and kept as its own schema because
 * the two lists answer different questions and the API is free to change one
 * without the other. */
export const spotNotCheckedSchema = z.object({
  rung: z.number(),
  name: z.string(),
  reason: z.string(),
});

export const spotCheckSchema = z.object({
  source: z.string(),
  notice: z.string(),
  chain: z.string(),
  agent_id: z.number(),
  checked_at: z.string(),
  block_number: z.number(),
  checker_version: z.string(),
  checker_commit: z.string(),
  schema_version: z.number(),
  spec_commit: z.string(),
  identity: spotIdentitySchema,
  // `Option<SpotFetch>` in Rust: null when rung 1 did not pass and the ladder
  // would have discarded the answer, so no request was ever sent.
  fetch: spotFetchSchema.nullable(),
  checks: z.array(spotCheckRungSchema),
  not_checked: z.array(spotNotCheckedSchema),
});

export type SpotIdentity = z.infer<typeof spotIdentitySchema>;
export type SpotFetch = z.infer<typeof spotFetchSchema>;
export type SpotCheckRung = z.infer<typeof spotCheckRungSchema>;
export type SpotNotChecked = z.infer<typeof spotNotCheckedSchema>;
export type SpotCheck = z.infer<typeof spotCheckSchema>;
