import { describe, expect, it } from "vitest";
import {
  CHECKS,
  checkAriaLabel,
  checkFor,
  checkLabel,
  humaniseRungs,
  questionFor,
} from "@/lib/checks";
import { ratesSchema } from "@/lib/api/schemas";
import rates from "./fixtures/rates.json";

describe("the check labels", () => {
  it("covers all seven positions, in order", () => {
    expect(CHECKS.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("asks a yes/no question for every check", () => {
    for (const c of CHECKS) {
      expect(c.question.endsWith("?"), `${c.number}: ${c.question}`).toBe(true);
      expect(c.meaning.length).toBeGreaterThan(0);
    }
  });

  /**
   * The mapping is only trustworthy if it agrees with what the API actually
   * sends. A rung renamed upstream — rung 7 was `independent` until
   * 2026-07-29 — must not leave this module quietly describing the old one.
   */
  it("matches the checker's own names for every rung a run reports", () => {
    const parsed = ratesSchema.parse(rates);
    for (const rung of parsed.rungs) {
      const check = checkFor(rung.rung);
      expect(check, `no label for rung ${rung.rung}`).toBeDefined();
      expect(check?.internal, `rung ${rung.rung} renamed upstream`).toBe(rung.name);
    }
  });

  it("falls back to the API's own name for a check it does not know", () => {
    // Never invent a question for a measurement this app cannot describe.
    expect(questionFor(99, "brand_new")).toBe("brand_new");
    expect(questionFor(99)).toBe("Check 99");
  });

  it("names a check unambiguously in prose", () => {
    expect(checkLabel(4)).toBe("check 4 (Follows the spec?)");
  });

  it("spells a badge out for a screen reader", () => {
    expect(checkAriaLabel(2, "passed")).toBe("Check 2, Reachable? — passed");
  });
});

describe("humaniseRungs", () => {
  it("renames a rung the API mentioned into this site's vocabulary", () => {
    expect(humaniseRungs("documents that parsed and reached rung 4")).toBe(
      "documents that parsed and reached check 4 (Follows the spec?)",
    );
  });

  it("leaves the rest of the sentence exactly as the API wrote it", () => {
    expect(humaniseRungs("documents that passed rung 4 (conformant)")).toBe(
      "documents that passed check 4 (Follows the spec?) (conformant)",
    );
    expect(humaniseRungs("agents with on-chain feedback")).toBe(
      "agents with on-chain feedback",
    );
  });

  it("passes through a rung number this app has no label for", () => {
    // Never invent a question for a check we cannot describe.
    expect(humaniseRungs("reached rung 12")).toBe("reached rung 12");
  });
});
