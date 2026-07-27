import { describe, expect, it } from "vitest";
import { MAX_PAGE, PAGE_SIZE, buildQuery, offsetFor, pageCount, pageFromParam } from "@/lib/paging";

describe("page numbers map to offsets", () => {
  it("is 1-based and starts at offset 0", () => {
    expect(offsetFor(1)).toBe(0);
    expect(offsetFor(3)).toBe(PAGE_SIZE * 2);
  });

  it("treats junk, zero, and negatives as page 1", () => {
    for (const v of [undefined, "", "0", "-4", "banana", "1.5"]) {
      expect(pageFromParam(v)).toBe(1);
    }
    expect(pageFromParam("7")).toBe(7);
  });

  it("clamps a page number far beyond MAX_PAGE to a sane integer", () => {
    expect(pageFromParam("99999999999999999999")).toBe(MAX_PAGE);
    expect(offsetFor(pageFromParam("99999999999999999999"))).toBe(
      (MAX_PAGE - 1) * PAGE_SIZE,
    );
    expect(String(offsetFor(pageFromParam("99999999999999999999")))).not.toMatch(/e/i);
  });

  it("counts pages, and always offers at least one", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(1)).toBe(1);
    expect(pageCount(PAGE_SIZE)).toBe(1);
    expect(pageCount(PAGE_SIZE + 1)).toBe(2);
  });
});

describe("query strings", () => {
  it("omits empty values so a bare URL stays bare", () => {
    expect(buildQuery({ page: 1, chain: undefined, sort: "" })).toBe("");
  });

  it("keeps the values that are set", () => {
    expect(buildQuery({ page: 2, chain: "base" })).toBe("?page=2&chain=base");
  });
});
