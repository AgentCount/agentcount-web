/**
 * The brand strings are published claims, and two of them have physical
 * budgets: `OG_TAGLINE` must fit one 27px mono line on a 1200px card, and
 * every card string must stay inside the glyph coverage Satori actually
 * loads (Plex Mono Latin — the em-dash is covered, the status glyphs are
 * not; see lib/og.tsx's module doc).
 *
 * These tests read the strings as text rather than importing lib/og.tsx,
 * which would drag next/og into a node test environment.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND, NEWCOMER_SENTENCE } from "@/lib/brand";

function ogTagline(): string {
  const src = readFileSync(join(process.cwd(), "lib/og.tsx"), "utf8");
  const m = src.match(/export const OG_TAGLINE = "([^"]+)"/);
  if (!m) throw new Error("lib/og.tsx no longer exports OG_TAGLINE");
  return m[1];
}

describe("positioning survives copy edits", () => {
  it("the tagline and newcomer sentence carry the two load-bearing claims", () => {
    for (const s of [BRAND.tagline, NEWCOMER_SENTENCE]) {
      expect(s).toContain("agent economy");
    }
    expect(BRAND.tagline).toContain("no score");
  });

  it("the newcomer sentence still says the code and data are public", () => {
    expect(NEWCOMER_SENTENCE).toContain("open-source");
    expect(NEWCOMER_SENTENCE).toContain("All code and data are public");
  });
});

describe("card strings respect Satori's physical limits", () => {
  it("OG_TAGLINE fits one 27px mono line (≤ 54 characters)", () => {
    expect(ogTagline().length).toBeLessThanOrEqual(54);
  });

  it("OG_TAGLINE stays inside Plex Mono's Latin coverage", () => {
    // ASCII plus the em-dash — anything else risks Satori's runtime font
    // fetch, which fails and blanks the card.
    expect(ogTagline()).toMatch(/^[\x20-\x7E—]+$/);
  });
});
