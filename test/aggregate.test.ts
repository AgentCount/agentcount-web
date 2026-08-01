import { describe, expect, it } from "vitest";
import {
  aggregateFinding,
  canonicalRuns,
  latestRunPerChain,
  totalAgents,
} from "@/lib/api/aggregate";
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

describe("canonicalRuns", () => {
  /**
   * The case this function exists for, taken from real production data: on
   * 2026-07-29 a 400-agent proof sweep of bsc completed 93 minutes before the
   * 244,208-agent census sweep. Had the order been reversed — and nothing in
   * the API stops it — "latest completed" would have made a proof sweep the
   * homepage headline.
   */
  it("never lets a later proof sweep beat the published census run", () => {
    const runs = [
      run({ run_id: "proof", chain: "bsc", started_at: "2026-07-30T09:00:00Z", agent_count: 400 }),
      run({ run_id: "census", chain: "bsc", started_at: "2026-07-29T19:31:31Z", agent_count: 244208 }),
    ];
    // Latest-completed picks the proof sweep. Canonical does not.
    expect(latestRunPerChain(runs)[0].run_id).toBe("proof");
    expect(canonicalRuns(runs, new Set(["census"])).map((r) => r.run_id)).toEqual([
      "census",
    ]);
  });

  it("drops a chain whose runs are all unpublished rather than guessing", () => {
    const runs = [
      run({ run_id: "pub", chain: "base", agent_count: 60097 }),
      run({ run_id: "unpub", chain: "newchain", agent_count: 12 }),
    ];
    expect(canonicalRuns(runs, new Set(["pub"])).map((r) => r.chain)).toEqual(["base"]);
  });

  it("takes the newest published run when a chain has several", () => {
    const runs = [
      run({ run_id: "older", chain: "base", started_at: "2026-07-01T00:00:00Z", agent_count: 59999 }),
      run({ run_id: "newer", chain: "base", started_at: "2026-07-29T08:43:02Z", agent_count: 60097 }),
    ];
    expect(
      canonicalRuns(runs, new Set(["older", "newer"])).map((r) => r.run_id),
    ).toEqual(["newer"]);
  });

  it("still ignores an in-flight run even if its id is published", () => {
    const runs = [
      run({ run_id: "flying", chain: "base", started_at: "2026-08-01T00:00:00Z", finished_at: null, agent_count: 900 }),
      run({ run_id: "done", chain: "base", agent_count: 60097 }),
    ];
    expect(canonicalRuns(runs, new Set(["flying", "done"])).map((r) => r.run_id)).toEqual(
      ["done"],
    );
  });

  it("falls back to latest-completed when nothing is published at all", () => {
    // A blank homepage is worse than a correctly-labelled degraded one, and
    // the copy names the chains it actually summed either way.
    const runs = [run({ run_id: "a", chain: "base", agent_count: 60097 })];
    expect(canonicalRuns(runs, new Set()).map((r) => r.run_id)).toEqual(["a"]);
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

  it("carries a scope-neutral denominator label through untouched", () => {
    expect(aggregateFinding([findings("a", 1, 2)], "k").denominator_label).toBe(
      "valid documents",
    );
  });

  it("re-scopes a per-run label once more than one run is summed", () => {
    const perRun = (runId: string): Findings => ({
      run_id: runId,
      findings: [
        {
          key: "k",
          numerator: 1,
          denominator: 2,
          percent: 50,
          denominator_label: "agents in this run",
        },
      ],
    });
    // One run: the API's own words, because they are still true.
    expect(aggregateFinding([perRun("a")], "k").denominator_label).toBe(
      "agents in this run",
    );
    // Three: "this run" would misdescribe the number it qualifies.
    expect(
      aggregateFinding([perRun("a"), perRun("b"), perRun("c")], "k")
        .denominator_label,
    ).toBe("agents in these 3 runs");
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
