import { afterEach, describe, expect, it, vi } from "vitest";
import { PUBLISHED_RUNS, getPublishedRuns } from "@/lib/published-runs";

/**
 * The published list is the canonicality gate for the homepage headline, so
 * every way this read can go wrong has to end at the committed copy rather
 * than at an empty census.
 */
const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
  vi.restoreAllMocks();
});

const respond = (body: unknown, ok = true) => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
};

describe("getPublishedRuns", () => {
  it("uses the core repo's list when it reads and parses", async () => {
    const live = [{ ...PUBLISHED_RUNS[0], run_id: "fresh-run-from-core" }];
    respond(live);
    expect((await getPublishedRuns()).map((r) => r.run_id)).toEqual([
      "fresh-run-from-core",
    ]);
  });

  it("falls back when the fetch rejects", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    expect(await getPublishedRuns()).toEqual(PUBLISHED_RUNS);
  });

  it("falls back on a non-ok response", async () => {
    respond([], false);
    expect(await getPublishedRuns()).toEqual(PUBLISHED_RUNS);
  });

  it("falls back when the body is not the shape we expect", async () => {
    // A truncated or half-written file must not render a page of `undefined`.
    respond([{ run_id: "only-a-fragment" }]);
    expect(await getPublishedRuns()).toEqual(PUBLISHED_RUNS);
  });

  it("falls back on an empty list rather than blanking the census", async () => {
    // An empty array parses fine. The core repo has never had zero published
    // runs, and "no canonical runs" is not a state to render from a hiccup.
    respond([]);
    expect(await getPublishedRuns()).toEqual(PUBLISHED_RUNS);
  });

  it("ships a committed copy that is itself usable", async () => {
    expect(PUBLISHED_RUNS.length).toBeGreaterThan(0);
    for (const r of PUBLISHED_RUNS) {
      expect(r.run_id).toBeTruthy();
      expect(r.archive_sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
