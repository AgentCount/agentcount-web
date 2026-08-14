/**
 * The palette has one source — `app/globals.css`'s `@theme` block — and two
 * hand-copies that Satori and SVG generation force to exist: `COLOR` in
 * `lib/og.tsx` and `TALLY_COLOR`/`TALLY_BG` in `lib/tally.ts`. Nothing at
 * build time links them, so this suite does: it parses all three as text
 * (importing `lib/og.tsx` would drag `next/og` into a node test env) and
 * fails when any copy drifts.
 *
 * It also pins the accessibility floor: every token used as TEXT must clear
 * WCAG AA (4.5:1) against the page background. `--color-dead` sat at 3.4:1
 * for weeks because nothing measured it; now something does.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

/** Every `--color-*: #rrggbb` pair inside globals.css. */
function themeTokens(): Record<string, string> {
  const css = read("app/globals.css");
  const tokens: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([a-z]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  return tokens;
}

/** The `COLOR = { … }` literal in lib/og.tsx, parsed as text. */
function ogColors(): Record<string, string> {
  const src = read("lib/og.tsx");
  const block = src.match(/export const COLOR = \{([\s\S]*?)\} as const/);
  if (!block) throw new Error("lib/og.tsx no longer exports COLOR");
  const colors: Record<string, string> = {};
  for (const m of block[1].matchAll(/([a-z]+):\s*"(#[0-9a-fA-F]{6})"/g)) {
    colors[m[1]] = m[2].toLowerCase();
  }
  return colors;
}

/** WCAG 2.x relative luminance → contrast ratio. */
function contrast(hexA: string, hexB: string): number {
  const luminance = (hex: string): number => {
    const channel = (i: number) => {
      const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  };
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

describe("the palette's hand-copies match @theme", () => {
  it("lib/og.tsx COLOR matches globals.css key for key", () => {
    const theme = themeTokens();
    for (const [key, value] of Object.entries(ogColors())) {
      expect({ key, value }).toEqual({ key, value: theme[key] });
    }
  });

  it("lib/tally.ts constants match globals.css", () => {
    const theme = themeTokens();
    const tally = read("lib/tally.ts");
    expect(tally).toContain(`export const TALLY_COLOR = "${theme.live}"`);
    expect(tally).toContain(`export const TALLY_BG = "${theme.bg}"`);
  });
});

describe("text tokens clear WCAG AA on the page background", () => {
  it("text, muted, dead and dim are all ≥ 4.5:1 against bg", () => {
    const theme = themeTokens();
    for (const key of ["text", "muted", "dead", "dim"] as const) {
      const ratio = contrast(theme[key], theme.bg);
      expect({ key, ratio }).toSatisfy(
        ({ ratio }: { ratio: number }) => ratio >= 4.5,
        `--color-${key} is ${ratio.toFixed(2)}:1 against --color-bg; text needs 4.5:1`,
      );
    }
  });
});
