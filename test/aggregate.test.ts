import { describe, expect, it } from "vitest";
import { aggregateFinding, latestRunPerChain, totalAgents } from "@/lib/api/aggregate";
import type { Findings, Run } from "@/lib/api/schemas";

const run = (over: Partial<Run>): Run => ({
  run_id: "r",
  chain: "base",
  pinned_block: 1,
  started_at: "2026-07-30T00:00:00Z",
  finished_at: "2026-07-30T01:00:00Z",
  agent_count: 10,
  schema_version: 1,
  checker_version: "v",
  checker_commit: "c",
  spec_commit: "s",
  rerun_command: "x",
  ...over,
});

describe("latestRunPerChain", () => {
  it("keeps one run per chain, largest population first", () => {
    const runs = [
      run({ run_id: "new-base", chain: "base", started_at: "2026-07-30T00:00:00Z", agent_count: 60097 }),
      run({ run_id: "old-base", chain: "base", started_at: "2026-01-01T00:00:00Z", agent_count: 500 }),
      run({ run_id: "bsc", chain: "bsc", agent_count: 244208 }),
    ];
    expect(latestRunPerChain(runs).map((r) => r.run_id)).toEqual(["bsc", "new-base"]);
  });

  it("ignores a sweep still in flight", () => {
    const runs = [
      run({ run_id: "running", chain: "celo", started_at: "2026-08-01T00:00:00Z", finished_at: null, agent_count: 9999 }),
      run({ run_id: "done", chain: "celo", agent_count: 9747 }),
    ];
    expect(latestRunPerChain(runs).map((r) => r.run_id)).toEqual(["done"]);
  });
});

describe("totalAgents", () => {
  it("sums the population", () => {
    expect(
      totalAgents([
        run({ agent_count: 244208 }),
        run({ agent_count: 60097 }),
        run({ agent_count: 40806 }),
        run({ agent_count: 9747 }),
      ]),
    ).toBe(354858);
  });

  it("treats a null count as zero rather than NaN", () => {
    expect(totalAgents([run({ agent_count: null }), run({ agent_count: 7 })])).toBe(7);
  });
});

const findings = (runId: string, num: number, den: number): Findings => ({
  run_id: runId,
  findings: [
    {
      key: "k",
      numerator: num,
      denominator: den,
      percent: den ? (num / den) * 100 : null,
      denominator_label: "valid documents",
    },
  ],
});

describe("aggregateFinding", () => {
  it("weights by population, not by chain", () => {
    // 1 of 10 on one chain, 89 of 90 on another. The population rate is 90%;
    // a mean of the two chain rates would say 54.4%. The four-chain report
    // exists to correct exactly that distortion.
    const got = aggregateFinding([findings("a", 1, 10), findings("b", 89, 90)], "k");
    expect(got.numerator).toBe(90);
    expect(got.denominator).toBe(100);
    expect(got.percent).toBeCloseTo(90, 10);
  });

  it("carries the denominator label through", () => {
    expect(aggregateFinding([findings("a", 1, 2)], "k").denominator_label).toBe(
      "valid documents",
    );
  });

  it("returns a null percent over an empty population", () => {
    expect(aggregateFinding([findings("a", 0, 0)], "k").percent).toBeNull();
  });

  it("skips a run that never reported the key", () => {
    const missing: Findings = { run_id: "b", findings: [] };
    const got = aggregateFinding([findings("a", 3, 4), missing], "k");
    expect(got.numerator).toBe(3);
    expect(got.denominator).toBe(4);
  });

  it("throws naming the key when no run reported it", () => {
    expect(() => aggregateFinding([findings("a", 1, 2)], "unheard_of")).toThrow(
      /unheard_of/,
    );
  });
});
