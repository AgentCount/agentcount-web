import { describe, expect, it } from "vitest";
import { chainDisplayName, formatChainList } from "@/lib/chains";
import { sweptChains, type PublishedRun } from "@/lib/published-runs";

// Fixtures, not the committed list: these tests pin the DERIVATION, and must
// keep passing unchanged when a fifth chain's run is published.
const run = (over: Partial<PublishedRun>): PublishedRun => ({
  run_id: "r",
  chain: "base",
  pinned_block: 1,
  started_at: "2026-07-29T00:00:00+00:00",
  finished_at: "2026-07-29T01:00:00+00:00",
  schema_version: 7,
  checker_version: "v",
  checker_commit: "c",
  spec_commit: "s",
  rerun_command: "x",
  agent_count: 10,
  swept: 10,
  unreadable: null,
  unwritable: null,
  archive: "r.tar.zst",
  archive_bytes: 1,
  archive_sha256: "0",
  ...over,
});

describe("sweptChains", () => {
  it("is unique per chain, largest population first", () => {
    const chains = sweptChains([
      run({ run_id: "a", chain: "celo", agent_count: 9_747 }),
      run({ run_id: "b", chain: "bsc", agent_count: 244_208 }),
      run({ run_id: "c", chain: "base", agent_count: 60_097 }),
    ]);
    expect(chains).toEqual(["bsc", "base", "celo"]);
  });

  it("keeps only the newest run per chain", () => {
    const chains = sweptChains([
      run({ run_id: "old", chain: "base", started_at: "2026-01-01T00:00:00+00:00", agent_count: 500 }),
      run({ run_id: "new", chain: "base", started_at: "2026-07-29T00:00:00+00:00", agent_count: 60_097 }),
    ]);
    expect(chains).toEqual(["base"]);
  });

  it("a fifth chain joins the list with no code change", () => {
    const chains = sweptChains([
      run({ run_id: "a", chain: "bsc", agent_count: 244_208 }),
      run({ run_id: "b", chain: "billions", agent_count: 25_974 }),
    ]);
    expect(chains).toEqual(["bsc", "billions"]);
  });
});

describe("chain display names", () => {
  it("maps known slugs and falls back to the slug", () => {
    expect(chainDisplayName("bsc")).toBe("BNB Chain");
    expect(chainDisplayName("somenewchain")).toBe("somenewchain");
  });

  it("formats a prose list", () => {
    expect(formatChainList(["bsc", "base", "mainnet", "celo"])).toBe(
      "BNB Chain, Base, Ethereum mainnet, and Celo",
    );
  });
});
