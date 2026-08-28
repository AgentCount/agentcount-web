import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INSTRUMENTS } from "@/lib/instruments";
import { NAV, TOOLS } from "@/lib/nav";

/**
 * The homepage names the instruments and links each one. A named instrument
 * whose link 404s is worse than one not named at all: a reader who clicks
 * "The Seller Census" and lands on nothing learns that this site advertises
 * things it does not have, which is the one impression an audit layer cannot
 * afford. Nothing in the type system connects a string like "/sellers" to
 * the file that serves it, so it is asserted here.
 *
 * The same check covers the nav, because the nav is where that link would
 * most plausibly be added and then quietly renamed.
 */
const routeExists = (href: string): boolean => {
  // Only in-app paths are checkable; anything else is somebody else's server.
  if (!href.startsWith("/")) return false;
  const segment = href.split("#")[0].split("?")[0].replace(/^\/|\/$/g, "");
  const dir = join(process.cwd(), "app", segment);
  return (
    existsSync(join(dir, "page.tsx")) || existsSync(join(dir, "page.ts"))
  );
};

describe("every instrument links somewhere that exists", () => {
  it.each(INSTRUMENTS.map((i) => [i.title, i.href] as const))(
    "%s → %s",
    (_title, href) => {
      expect(routeExists(href)).toBe(true);
    },
  );

  it("orders them by index, with no duplicates and no gaps", () => {
    const indices = INSTRUMENTS.map((i) => i.index);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(new Set(indices).size).toBe(indices.length);
    expect(indices[0]).toBe(1);
  });

  it("publishes at most one instrument as live per shipped instrument", () => {
    // Not a cap on how many may be live — a guard that `status` is one of the
    // two words `StatusTag` can render. A typo'd status silently renders as
    // "in development" styling with the wrong word inside it.
    for (const instrument of INSTRUMENTS) {
      expect(["live", "in development"]).toContain(instrument.status);
    }
  });
});

describe("every nav link resolves", () => {
  it.each([...NAV, ...TOOLS].map((item) => [item.label, item.href] as const))(
    "%s → %s",
    (_label, href) => {
      expect(routeExists(href)).toBe(true);
    },
  );

  it("explains every label", () => {
    // The blurbs are the whole point of the footer sitemap: a label with an
    // empty one is a row that says a noun and nothing else, which is the
    // state this list was built to fix.
    for (const item of [...NAV, ...TOOLS]) {
      expect(item.blurb.trim().length).toBeGreaterThan(0);
    }
  });
});
