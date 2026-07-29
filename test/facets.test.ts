import { describe, expect, it } from "vitest";
import { parseFacets, serialiseFacets } from "@/lib/api/endpoints";

/**
 * Facets arrive from a URL, which means they arrive from anyone. The rule this
 * file exists to hold: a facet is only ever built from the vocabulary the API
 * itself reported for this run, so a hand-edited URL can never make this app
 * send a rung or a status the API never had — and can never make a page render
 * a status word this app invented.
 */
const RUNGS = [1, 2, 3, 4, 5, 7]; // rung 6 is not implemented, so no run reports it
const STATUSES = ["error", "fail", "pass", "skipped", "unclaimed"];

describe("parseFacets", () => {
  it("parses the comma form a shared link uses", () => {
    expect(parseFacets("2:pass,5:unclaimed", RUNGS, STATUSES)).toEqual([
      { rung: 2, status: "pass" },
      { rung: 5, status: "unclaimed" },
    ]);
  });

  it("parses the repeated-key form the filter checkboxes emit", () => {
    expect(parseFacets(["2:pass", "7:fail"], RUNGS, STATUSES)).toEqual([
      { rung: 2, status: "pass" },
      { rung: 7, status: "fail" },
    ]);
  });

  it("drops a rung this run never reported rather than asking for it", () => {
    // Rung 6 is not implemented. Requiring it would match nobody forever while
    // implying the question is being asked of someone.
    expect(parseFacets("6:pass", RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets("2:pass,6:fail", RUNGS, STATUSES)).toEqual([
      { rung: 2, status: "pass" },
    ]);
  });

  it("drops a status this run never produced", () => {
    expect(parseFacets("2:banana", RUNGS, STATUSES)).toEqual([]);
    // Including one this app might be tempted to invent as a synonym.
    expect(parseFacets("2:passed", RUNGS, STATUSES)).toEqual([]);
  });

  it("accepts `unclaimed`, which only exists because the API reported it", () => {
    expect(parseFacets("5:unclaimed", RUNGS, STATUSES)).toEqual([
      { rung: 5, status: "unclaimed" },
    ]);
    // ...and rejects it against a vocabulary that predates it, with no code
    // change either way.
    expect(parseFacets("5:unclaimed", RUNGS, ["error", "fail", "pass", "skipped"])).toEqual(
      [],
    );
  });

  it("de-duplicates, so a doubled checkbox does not double the SQL", () => {
    expect(parseFacets("2:pass,2:pass", RUNGS, STATUSES)).toEqual([
      { rung: 2, status: "pass" },
    ]);
  });

  it("survives junk without throwing — a bad URL is not an error page", () => {
    expect(parseFacets("", RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets(undefined, RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets("garbage", RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets(":::", RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets("2:", RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets(":pass", RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets("NaN:pass", RUNGS, STATUSES)).toEqual([]);
    expect(parseFacets("2.5:pass", RUNGS, STATUSES)).toEqual([]);
  });

  it("keeps distinct statuses on one rung — the API ANDs them, so this is empty by design", () => {
    // Nothing here decides that "rung 2 pass AND rung 2 fail" matches nobody;
    // it is passed through and the API answers. This app must not pre-empt a
    // query by reasoning about what statuses can co-occur.
    expect(parseFacets("2:pass,2:fail", RUNGS, STATUSES)).toEqual([
      { rung: 2, status: "pass" },
      { rung: 2, status: "fail" },
    ]);
  });

  it("round-trips through serialiseFacets", () => {
    const facets = parseFacets("1:pass,4:skipped", RUNGS, STATUSES);
    expect(serialiseFacets(facets)).toBe("1:pass,4:skipped");
    expect(parseFacets(serialiseFacets(facets), RUNGS, STATUSES)).toEqual(facets);
  });
});
