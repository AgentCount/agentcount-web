import { describe, expect, it } from "vitest";
import agents from "./fixtures/agents.json";
import agentDetail from "./fixtures/agent-detail.json";
import agentDetailError from "./fixtures/agent-detail-error.json";
import delta from "./fixtures/delta.json";
import findings from "./fixtures/findings.json";
import methodology from "./fixtures/methodology.json";
import rates from "./fixtures/rates.json";
import runs from "./fixtures/runs.json";
import spotCheck from "./fixtures/spot-check.json";
import {
  agentDetailSchema,
  agentPageSchema,
  deltaSchema,
  findingsSchema,
  methodologySchema,
  ratesSchema,
  runsSchema,
  isTailAgent,
  spotCheckSchema,
} from "@/lib/api/schemas";

/**
 * These fixtures are CAPTURED FROM A LIVE API, not hand-written — every one but
 * `runs.json` is the literal body of a real request against run cfbfcc01.
 *
 * That distinction is the point of this file. The previous fixtures were
 * hand-maintained, and when rung 4 was split by RFC 2119 severity the API
 * stopped sending `rung4_required_fields` while the fixture kept it. This suite
 * went on passing against a fixture that no longer resembled the API, and
 * /methodology threw a ContractError on every real load for a day. A fixture
 * that is not refreshed from the thing it models tests only itself.
 *
 * `runs.json` stays hand-written on purpose: it carries an in-flight run and a
 * completed run with a null `pinned_block`, two shapes the current live API has
 * no example of but the schema must still accept.
 *
 * Refresh the captured ones with `pnpm check:api` running against a live API,
 * or by re-curling the endpoints listed above each import.
 */
describe("schemas accept what the API actually returns", () => {
  it("parses a run list, including an in-flight run with null finished_at", () => {
    const parsed = runsSchema.parse(runs);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].finished_at).toBeNull();
    expect(parsed[0].agent_count).toBeNull();
  });

  it("parses a completed run with a null pinned_block (an early dev sweep)", () => {
    const parsed = runsSchema.parse(runs);
    // Selected by the shape under test rather than by a `-dirty` checker
    // commit, which used to identify this run and no longer does: three of
    // the four PUBLISHED census runs carry `-dirty` commits too, so that
    // proxy started matching a real sweep with a real pinned block.
    const nullBlock = parsed.find((r) => r.pinned_block === null);
    expect(nullBlock).toBeDefined();
    expect(nullBlock?.finished_at).not.toBeNull();
  });

  it("parses rates — one denominator per (rung, status), never a per-agent field", () => {
    const parsed = ratesSchema.parse(rates);
    expect(parsed.rungs.length).toBeGreaterThan(0);
    // A rung's counts may sum to LESS than the population (agents it never
    // reached have no row) but never to more — more would mean an agent was
    // counted twice under one rung, which is the one way these population
    // counts could turn into something per-agent.
    for (const rung of parsed.rungs) {
      const sum = rung.counts.reduce((acc, c) => acc + c.count, 0);
      expect(sum).toBeLessThanOrEqual(parsed.agent_count);
    }
  });

  it("leaves the 'not checked' gap to be derived, and never sends it as a status", () => {
    const parsed = ratesSchema.parse(rates);
    // In this run every REPORTED rung covers the whole population: P0 FIX 6
    // constructs rungs 4 and 5 for every agent so they can be recorded as
    // `skipped` rather than vanishing. The remaining "not checked" case is
    // rung 6, which has no rows at all — an absence, which is exactly why
    // RateBar derives that segment from `agent_count - sum` instead of
    // expecting the API to name it.
    for (const rung of parsed.rungs) {
      for (const c of rung.counts) {
        expect(c.status).not.toBe("not checked");
        expect(c.status).not.toBe("not_checked");
      }
    }
  });

  it("carries each rung's own name, so no page has to hard-code the ladder", () => {
    const parsed = ratesSchema.parse(rates);
    expect(parsed.rungs.find((r) => r.rung === 2)?.name).toBe("resolvable");
    // Renamed from `independent` on 2026-07-29. A page that had typed the old
    // word would still be showing it; reading the name is what makes the
    // rename propagate for free.
    expect(parsed.rungs.find((r) => r.rung === 7)?.name).toBe("attested");
  });

  it("reports no rung 6 at all — not implemented is an ABSENCE, never a status", () => {
    const parsed = ratesSchema.parse(rates);
    expect(parsed.rungs.find((r) => r.rung === 6)).toBeUndefined();
  });

  it("parses an agent page whose rungs array can be shorter than seven", () => {
    const page = agentPageSchema.parse(agents);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.page.total).toBeGreaterThanOrEqual(page.items.length);
    // The status word is the API's, not ours.
    expect(page.items[0].rungs[0].status).toBeTruthy();
    expect(page.items[0].owner).toBeTruthy();
    // Every agent is missing at least rung 6.
    expect(page.items[0].rungs.length).toBeLessThan(7);
  });

  it("carries the document's name, and null rather than '' when it has none", () => {
    const page = agentPageSchema.parse(agents);
    expect(page.items[0].name).toBe("Genesis Agent");
    for (const item of page.items) {
      expect(item.name).not.toBe("");
    }
  });

  it("parses an agent detail including its evidence, whatever shape it takes", () => {
    const detail = agentDetailSchema.parse(agentDetail);
    if (isTailAgent(detail)) throw new Error("census fixture parsed as tail");
    expect(detail.rungs.length).toBeGreaterThan(0);
    expect(detail.rungs[0].evidence).toBeTruthy();
    expect(detail.archive?.scheme).toBeTruthy();
    expect(detail.name).toBe("ClawNews");
  });

  // The whole point of the discriminated union: a tail agent must never
  // satisfy the census shape, so nothing downstream can read seven statuses
  // off an agent that has none.
  it("parses a tail agent and keeps it distinguishable from a census one", () => {
    const tail = agentDetailSchema.parse({
      source: "tail",
      chain: "base",
      agent_id: 60123,
      token_id: "60123",
      owner: "0x1111111111111111111111111111111111111111",
      agent_uri: "https://example.test/agent.json",
      discovery_block: 41900123,
      discovered_at: "2026-08-03T10:15:00Z",
      checks_available: false,
    });
    expect(isTailAgent(tail)).toBe(true);
    expect("rungs" in tail).toBe(false);
    expect("run_id" in tail).toBe(false);
  });

  it("parses an agent detail whose pipeline short-circuited (error then skipped)", () => {
    const detail = agentDetailSchema.parse(agentDetailError);
    if (isTailAgent(detail)) throw new Error("census fixture parsed as tail");
    const byRung = new Map(detail.rungs.map((r) => [r.rung, r]));
    expect(byRung.get(2)?.status).toBe("error");
    expect(byRung.get(3)?.status).toBe("skipped");
    expect(byRung.get(3)?.evidence.skipped_because_rung).toBe(2);
    // Its document never resolved, so there is no name to project.
    expect(detail.name).toBeNull();
  });

  it("parses methodology's three severity buckets", () => {
    const m = methodologySchema.parse(methodology);
    expect(m.spec_commit).toBeTruthy();
    expect(m.rung4_must_fields.length).toBeGreaterThan(0);
    expect(m.rung4_should_fields.length).toBeGreaterThan(0);
  });

  it("counts MUST requirements as rules, not fields, and marks them conditional", () => {
    const m = methodologySchema.parse(methodology);
    // One rule covering two fields. The homepage prints this count, so the
    // difference between 1 and 2 is a published claim about the spec.
    expect(m.rung4_must_requirements).toHaveLength(1);
    expect(m.rung4_must_requirements[0].fields).toHaveLength(2);
    expect(m.rung4_must_requirements.every((r) => r.conditional)).toBe(true);
  });

  it("parses findings, each with the denominator behind it", () => {
    const f = findingsSchema.parse(findings);
    expect(f.findings.length).toBeGreaterThan(0);
    for (const x of f.findings) {
      expect(x.denominator_label).toBeTruthy();
      // A rate whose denominator is hidden is the easiest way to mislead with
      // a true number, so it is part of the wire contract, not decoration.
      expect(x.denominator).toBeGreaterThan(0);
      expect(x.percent).not.toBeNull();
    }
  });

  it("serves findings the homepage names, at the values the report published", () => {
    const f = findingsSchema.parse(findings);
    const by = new Map(f.findings.map((x) => [x.key, x]));
    // These four are printed verbatim on the homepage. If a key is renamed or
    // a number moves, that is a change to a published claim and should fail
    // here rather than silently alter the front page.
    expect(by.get("services_absent_or_empty")?.percent).toBeCloseTo(61.0, 1);
    expect(by.get("registration_unclaimed")?.percent).toBeCloseTo(84.6, 1);
    expect(by.get("attested")?.percent).toBeCloseTo(49.2, 1);
    expect(by.get("attested_resolvable")?.percent).toBeCloseTo(46.8, 1);
    expect(by.get("unattested_resolvable")?.percent).toBeCloseTo(58.6, 1);
  });
});

/**
 * `delta.json` is HAND-WRITTEN, transcribed field by field from
 * `crates/api/src/routes/deltas.rs`'s `DeltaResponse` (agentcount#57) — the
 * endpoint is not deployed yet, so there is no live body to capture. Replace
 * it with a captured one the day the API ships, per this file's header. Its
 * values are the 2026-08 BSC shape from the methodology changelog: the pair
 * the `refused` rule was written for.
 */
describe("a delta carries its own caveats", () => {
  it("parses, and the confound fields cannot be absent", () => {
    const d = deltaSchema.parse(delta);
    expect(d.method_changed).toBe(true);
    expect(d.checker_before).not.toBe(d.checker_after);
  });

  it("the declined volume the headline series exclude stays visible", () => {
    const d = deltaSchema.parse(delta);
    // The famous shape: 10 real losses, 19,962 declined — the number that
    // was briefly published as 19,983 agents going dark.
    expect(d.stopped_resolving).toBe(10);
    expect(d.rung2_declined).toBe(19962);
    // The excluded transitions remain in flips, per METHODOLOGY §9.
    const refused = d.flips.filter(
      (f) => f.rung === 2 && (f.from === "refused" || f.to === "refused"),
    );
    expect(refused.length).toBeGreaterThan(0);
  });
});

/**
 * `spot-check.json` is HAND-WRITTEN, and that is a weaker fixture than the
 * captured ones above — the endpoint is not deployed yet (agentcount#25), so
 * there is no live response to capture. It is transcribed field by field from
 * that PR's `SpotCheckResponse` serde structs, and it should be replaced with
 * a real captured body the day the API ships, exactly as this file's header
 * argues: a fixture that is not refreshed from the thing it models tests only
 * itself.
 */
describe("the spot check is not a census result, and its schema says so", () => {
  it("parses an on-demand spot check", () => {
    const s = spotCheckSchema.parse(spotCheck);
    expect(s.source).toBe("spot_check");
    expect(s.notice).toBeTruthy();
    expect(s.checks.length).toBeGreaterThan(0);
  });

  it("borrows none of the census detail's structural names, and no run_id", () => {
    const s = spotCheckSchema.parse(spotCheck);
    const detail = agentDetailSchema.parse(agentDetail);
    // The API's own guarantee, asserted from this side too. The two shapes do
    // share the names that IDENTIFY an agent — `chain` and `agent_id` name
    // the same agent either way — but they share none of the names that carry
    // a measurement, which is what stops a spot check being read, pasted or
    // rendered as a census result.
    const shared = Object.keys(s).filter((k) => k in detail);
    expect(shared.sort()).toEqual(["agent_id", "chain"]);
    for (const censusOnly of ["run_id", "rungs", "archive", "snapshot"]) {
      expect(s).not.toHaveProperty(censusOnly);
    }
    for (const spotOnly of ["source", "notice", "checks", "fetch", "identity"]) {
      expect(detail).not.toHaveProperty(spotOnly);
    }
  });

  it("says why rung 6 was not checked, rather than giving it a status", () => {
    const s = spotCheckSchema.parse(spotCheck);
    const six = s.not_checked.find((n) => n.rung === 6);
    expect(six?.reason).toBeTruthy();
    // Absence is the claim; the reason explains it. A rung in `not_checked`
    // must never also appear in `checks` wearing a guessed status.
    expect(s.checks.some((c) => c.rung === 6)).toBe(false);
  });

  it("accepts a check that sent no request at all", () => {
    // Rung 1 did not pass, so nothing was fetched — `fetch` is null rather
    // than an object full of nulls, and the panel says so in words.
    const noFetch = { ...structuredClone(spotCheck), fetch: null };
    expect(spotCheckSchema.safeParse(noFetch).success).toBe(true);
  });
});

describe("schemas reject what they should", () => {
  it("rejects an agent page whose total went missing", () => {
    const broken = { ...agents, page: { limit: 1, offset: 0 } };
    expect(agentPageSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects rates whose counts lost their status", () => {
    const broken = structuredClone(rates) as typeof rates;
    // @ts-expect-error deliberately malformed
    broken.rungs[0].counts[0] = { count: 5 };
    expect(ratesSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a run list with a non-nullable finished_at turned into a number", () => {
    const broken = structuredClone(runs) as typeof runs;
    // @ts-expect-error deliberately malformed
    broken[0].finished_at = 12345;
    expect(runsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects methodology missing the MUST requirement list the homepage prints", () => {
    const broken = structuredClone(methodology) as Record<string, unknown>;
    delete broken.rung4_must_requirements;
    expect(methodologySchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a spot check that lost the notice it must be published with", () => {
    const broken = structuredClone(spotCheck) as Record<string, unknown>;
    delete broken.notice;
    expect(spotCheckSchema.safeParse(broken).success).toBe(false);
  });
});
