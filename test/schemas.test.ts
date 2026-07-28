import { describe, expect, it } from "vitest";
import agents from "./fixtures/agents.json";
import agentDetail from "./fixtures/agent-detail.json";
import agentDetailError from "./fixtures/agent-detail-error.json";
import methodology from "./fixtures/methodology.json";
import rates from "./fixtures/rates.json";
import runs from "./fixtures/runs.json";
import {
  agentDetailSchema,
  agentPageSchema,
  methodologySchema,
  ratesSchema,
  runsSchema,
} from "@/lib/api/schemas";

describe("schemas accept what the API actually returns", () => {
  it("parses a run list, including an in-flight run with null finished_at", () => {
    const parsed = runsSchema.parse(runs);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].finished_at).toBeNull();
    expect(parsed[0].agent_count).toBeNull();
  });

  it("parses a completed run with a null pinned_block (an early dev sweep)", () => {
    const parsed = runsSchema.parse(runs);
    const dirty = parsed.find((r) => r.checker_commit.endsWith("-dirty"));
    expect(dirty?.pinned_block).toBeNull();
    expect(dirty?.finished_at).not.toBeNull();
  });

  it("parses rates — one denominator per (rung, status), never a per-agent field", () => {
    const parsed = ratesSchema.parse(rates);
    expect(parsed.rungs.length).toBeGreaterThan(0);
    // Rung 4's counts never have to sum to agent_count — a short-circuited
    // rung has fewer rows than the population, not a synthesized status.
    const rung4 = parsed.rungs.find((r) => r.rung === 4)!;
    const sum = rung4.counts.reduce((acc, c) => acc + c.count, 0);
    expect(sum).toBeLessThan(parsed.agent_count);
  });

  it("parses an agent page whose rungs array can be shorter than seven", () => {
    const page = agentPageSchema.parse(agents);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.page.total).toBeGreaterThanOrEqual(page.items.length);
    // The status word is the API's, not ours, and identity is agent_id +
    // chain + owner — never the (possibly huge, possibly empty) agent_uri.
    expect(page.items[0].rungs[0].status).toBeTruthy();
    expect(page.items[0].owner).toBeTruthy();
    // A short-circuited agent has fewer than 7 rungs recorded.
    expect(page.items[1].rungs.length).toBeLessThan(7);
  });

  it("parses an agent detail including its evidence, whatever shape it takes", () => {
    const detail = agentDetailSchema.parse(agentDetail);
    expect(detail.rungs.length).toBeGreaterThan(0);
    expect(detail.rungs[0].evidence).toBeTruthy();
    expect(detail.archive.scheme).toBeTruthy();
  });

  it("parses an agent detail whose pipeline short-circuited (error then skipped)", () => {
    const detail = agentDetailSchema.parse(agentDetailError);
    expect(detail.rungs.length).toBe(3);
    expect(detail.rungs[1].status).toBe("error");
    expect(detail.rungs[2].status).toBe("skipped");
    expect(detail.rungs[2].evidence.skipped_because_rung).toBe(2);
  });

  it("parses methodology, including the live required-field list", () => {
    const m = methodologySchema.parse(methodology);
    expect(m.spec_commit).toBeTruthy();
    expect(m.rung4_required_fields.length).toBeGreaterThan(0);
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
});
