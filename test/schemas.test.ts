import { describe, expect, it } from "vitest";
import agents from "./fixtures/agents.json";
import agentDetail from "./fixtures/agent-detail.json";
import chains from "./fixtures/chains.json";
import methodology from "./fixtures/methodology.json";
import stats from "./fixtures/stats.json";
import {
  agentDetailSchema,
  agentPageSchema,
  chainsSchema,
  methodologySchema,
  statsSchema,
} from "@/lib/api/schemas";

describe("schemas accept what the API actually returns", () => {
  it("parses an agent page", () => {
    const page = agentPageSchema.parse(agents);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.page.total).toBeGreaterThanOrEqual(page.items.length);
    // The status word is the API's, not ours.
    expect(page.items[0].display.status).toBeTruthy();
  });

  it("parses an agent detail including its flags", () => {
    const detail = agentDetailSchema.parse(agentDetail);
    expect(detail.facts.length).toBeGreaterThan(0);
    expect(detail.facts[0].display.statement).toBeTruthy();
    // The fixture is chosen to have flags — flag parsing must be exercised.
    expect(detail.flags.length).toBeGreaterThan(0);
    expect(detail.flags[0].display.label).toBeTruthy();
  });

  it("parses chains, stats, and methodology", () => {
    expect(chainsSchema.parse(chains)[0].chain).toBeTruthy();
    expect(statsSchema.parse(stats).flags_by_kind[0].label).toBeTruthy();
    expect(methodologySchema.parse(methodology).liveness_window_days).toBeGreaterThan(0);
  });
});

describe("schemas reject what they should", () => {
  it("rejects an agent page whose total went missing", () => {
    const broken = { ...agents, page: { limit: 1, offset: 0 } };
    expect(agentPageSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a fact with an unknown evidence type", () => {
    const broken = structuredClone(agentDetail) as typeof agentDetail;
    // @ts-expect-error deliberately malformed
    broken.facts[0].evidence = [{ type: "seance", spirit: "yes" }];
    expect(agentDetailSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a stats payload with the old object-shaped flags_by_kind", () => {
    const broken = { ...stats, flags_by_kind: { shared_operator: 12 } };
    expect(statsSchema.safeParse(broken).success).toBe(false);
  });
});
