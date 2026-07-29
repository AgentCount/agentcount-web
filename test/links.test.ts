import { describe, expect, it } from "vitest";
import {
  addressUrl,
  blockUrl,
  evidenceHref,
  explorerFor,
  resourceLink,
  tokenUrl,
  txUrl,
} from "@/lib/links";

const ADDR = "0x89e9e1ab11dd1b138b1dce6d6a4a0926aafd5029";
const REGISTRY = "0x8004a169fb4a3325136eb29fa0ceb6d2e539a432";
const TX = "0x" + "a".repeat(64);

describe("explorers", () => {
  it("knows the chains the census can serve", () => {
    expect(explorerFor("base")?.name).toBe("BaseScan");
    expect(explorerFor("ethereum")?.name).toBe("Etherscan");
    expect(explorerFor("bsc")?.name).toBe("BscScan");
    expect(explorerFor("celo")?.name).toBe("Celoscan");
  });

  it("is case- and whitespace-insensitive about the chain name", () => {
    expect(explorerFor(" BASE ")?.base).toBe("https://basescan.org");
  });

  it("returns null for a chain it does not know, rather than guessing a URL", () => {
    // Guessing `https://<chain>scan.io` would produce confident links to
    // nowhere, and a reader cannot tell a dead link from a wrong one.
    expect(explorerFor("arbitrum")).toBeNull();
    expect(addressUrl("arbitrum", ADDR)).toBeNull();
    expect(blockUrl("solana", 1)).toBeNull();
  });

  it("builds address, tx, block and token URLs", () => {
    expect(addressUrl("base", ADDR)).toBe(`https://basescan.org/address/${ADDR}`);
    expect(txUrl("base", TX)).toBe(`https://basescan.org/tx/${TX}`);
    expect(blockUrl("base", 49262617)).toBe("https://basescan.org/block/49262617");
    expect(tokenUrl("base", REGISTRY, "1")).toBe(
      `https://basescan.org/token/${REGISTRY}?a=1`,
    );
  });

  it("refuses values that are not the thing they claim to be", () => {
    expect(addressUrl("base", "0xdeadbeef")).toBeNull();
    expect(addressUrl("base", "not an address")).toBeNull();
    expect(txUrl("base", ADDR)).toBeNull(); // 20 bytes, not 32
    expect(blockUrl("base", -1)).toBeNull();
    expect(blockUrl("base", "abc")).toBeNull();
    // token_id is a uint256 and can exceed i64, so it stays a string — but it
    // still has to be digits.
    expect(tokenUrl("base", REGISTRY, "1e9")).toBeNull();
    expect(
      tokenUrl("base", REGISTRY, "115792089237316195423570985008687907853269984665640564039457584007913129639935"),
    ).toContain("?a=115792089237316195423570985008687907853269984665640564039457584007913129639935");
  });
});

describe("resourceLink — agent-supplied URIs are hostile input", () => {
  it("passes http and https straight through", () => {
    expect(resourceLink("https://clawnews.io/card.json")).toEqual({
      href: "https://clawnews.io/card.json",
      via: null,
    });
    expect(resourceLink("http://example.com/a")?.via).toBeNull();
  });

  it("rewrites ipfs:// through the same gateway the checker used", () => {
    // Matches `request_url` on this run's ipfs-scheme archive rows, so a click
    // fetches the bytes the census actually judged.
    expect(resourceLink("ipfs://QmTest/card.json")).toEqual({
      href: "https://ipfs.io/ipfs/QmTest/card.json",
      via: "ipfs.io",
    });
    expect(resourceLink("ipfs:///QmTest")?.href).toBe("https://ipfs.io/ipfs/QmTest");
  });

  it("rewrites ar:// through arweave.net", () => {
    expect(resourceLink("ar://abc123")).toEqual({
      href: "https://arweave.net/abc123",
      via: "arweave.net",
    });
  });

  it("refuses data: — the document is inline and there is nowhere to go", () => {
    expect(resourceLink("data:application/json;base64,eyJhIjoxfQ==")).toBeNull();
  });

  it("refuses script-bearing schemes in any casing", () => {
    // A javascript: tokenURI costs the price of gas to register. Emitting it
    // as an href would execute it on click.
    expect(resourceLink("javascript:alert(1)")).toBeNull();
    expect(resourceLink("JavaScript:alert(1)")).toBeNull();
    expect(resourceLink("jAvAsCrIpT:alert(1)")).toBeNull();
    expect(resourceLink("  javascript:alert(1)")).toBeNull();
    expect(resourceLink("vbscript:msgbox(1)")).toBeNull();
    expect(resourceLink("file:///etc/passwd")).toBeNull();
    expect(resourceLink("blob:https://x/y")).toBeNull();
  });

  it("refuses the empty and the degenerate", () => {
    // '' is a legitimate tokenURI value in this registry, and it is not a
    // location.
    expect(resourceLink("")).toBeNull();
    expect(resourceLink("   ")).toBeNull();
    expect(resourceLink("ipfs://")).toBeNull();
    expect(resourceLink("ar://")).toBeNull();
  });
});

describe("evidenceHref", () => {
  it("links the evidence keys worth linking", () => {
    expect(evidenceHref("base", "owner", ADDR)?.href).toBe(
      `https://basescan.org/address/${ADDR}`,
    );
    expect(evidenceHref("base", "registry", REGISTRY)?.untrusted).toBe(false);
    expect(evidenceHref("base", "block_number", 49262617)?.href).toBe(
      "https://basescan.org/block/49262617",
    );
    expect(evidenceHref("base", "final_url", "https://x.test/a")?.untrusted).toBe(true);
  });

  it("leaves every other key exactly as it was — plain text", () => {
    // Evidence is rendered generically so it cannot drift from what the
    // checker writes. This map is additive only.
    expect(evidenceHref("base", "body_sha256", "abc")).toBeNull();
    expect(evidenceHref("base", "chain_id", 8453)).toBeNull();
    expect(evidenceHref("base", "feedback_count", 39)).toBeNull();
    expect(evidenceHref("base", "must_violations", ["a"])).toBeNull();
  });

  it("falls back to plain text when a linkable key holds an unlinkable value", () => {
    expect(evidenceHref("base", "tx_hash", null)).toBeNull();
    expect(evidenceHref("base", "owner", "not-an-address")).toBeNull();
    expect(evidenceHref("base", "uri", "data:application/json,{}")).toBeNull();
    expect(evidenceHref("unknownchain", "owner", ADDR)).toBeNull();
  });
});
