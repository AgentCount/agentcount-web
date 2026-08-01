/**
 * The shared look for every link-preview card.
 *
 * There are two kinds: the fixed pages get a card built here, and each agent
 * permalink gets its own generated in `app/agent/[chain]/[id]/opengraph-image`.
 * They live apart because they draw different things, and they share this
 * module so they cannot drift into looking like two different products.
 *
 * ## The Satori rules, in one place
 *
 * `ImageResponse` renders with Satori, which is not a browser, and three of its
 * limits have already broken this site's cards once each. They are recorded
 * here because every new card will meet them again:
 *
 *   * **ASCII only.** Satori bundles a Latin subset. Any character outside it
 *     triggers a RUNTIME font download, which fails, and the route then returns
 *     an empty body — so the preview breaks rather than degrading. The status
 *     glyphs (`✓ ✗ ○ –`) and the en-dashes used in the site's prose are
 *     therefore unusable here; cards spell words out and use hyphens.
 *   * **No CSS variables, no Tailwind.** Nothing from `globals.css` or
 *     `lib/status.ts` resolves. [`COLOR`] below is a hand-copy of the `@theme`
 *     block and has to be kept in step with it by hand.
 *   * **No implicit block layout.** Any element with more than one child throws
 *     unless it declares `display: flex`. A bare `{a} - {b}` is three children.
 *
 * And one that is not Satori's fault: `fontFamily` must be left unset. Satori
 * resolves family names against fonts it was actually handed, and it has only
 * its default — asking for `monospace` resolves to nothing and fails the
 * render. The site's typographic distinction between mono, condensed and sans
 * does not carry over, so cards lean on size and colour instead.
 */
import { ImageResponse } from "next/og";
import { BRAND } from "./brand";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Copied from `app/globals.css`'s `@theme` block. See the module doc. */
export const COLOR = {
  bg: "#08090b",
  panel: "#101317",
  line: "#1c2128",
  edge: "#2b323b",
  text: "#e8e4dc",
  muted: "#99a0a9",
  dead: "#5f666f",
  live: "#3ddc84",
  fail: "#ff5f56",
  warn: "#f2b035",
  dim: "#646c78",
  claim: "#8b9ac4",
} as const;

/** One headline number and what it counts. */
export type OgStat = {
  /** Already formatted — `"61.0%"`, `"1"`. This module does no rounding, so
   * the card can never disagree with the page about a number's precision. */
  value: string;
  /** Short enough for a quarter of the canvas. Two lines at most. */
  label: string;
};

export type CardOptions = {
  /** The section name, set large. */
  title: string;
  /** One line under it. Defaults to the product tagline. */
  blurb?: string;
  /** Up to four. Rendered as a row across the foot of the card. */
  stats?: OgStat[];
  /** Right-hand side of the footer rule — a run date, a chain, a count. */
  note?: string;
};

/**
 * The masthead: wordmark, then what it measures, on one rule.
 *
 * Deliberately the same construction as the site's own header, because a card
 * is often the first thing anyone sees of this project and the page it leads
 * to should look like the same object.
 */
export function Masthead() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 5,
          color: COLOR.text,
        }}
      >
        {BRAND.name.toUpperCase()}
      </div>
      <div style={{ fontSize: 21, letterSpacing: 2, color: COLOR.dead }}>
        ERC-8004 CONFORMANCE CENSUS
      </div>
    </div>
  );
}

/**
 * Shrink a headline figure so it fits one line of its cell.
 *
 * Four cells share 1072px of usable width, so each gets roughly 250px. At
 * weight 700 a digit is about 0.6em wide, which puts the limits below at
 * roughly the point where a value would otherwise wrap — and wrapping is the
 * failure mode that matters here, because the cell is a fixed height with the
 * label pinned to its bottom, so a second line of the VALUE lands on top of
 * the label rather than pushing it down.
 *
 * Found by rendering `1 in 10,437` on the linkage card, where it did exactly
 * that. `whiteSpace: nowrap` alone would have overflowed the cell instead —
 * tidier, still wrong.
 */
function valueSize(value: string): number {
  if (value.length <= 7) return 52;
  if (value.length <= 10) return 42;
  return 34;
}

/**
 * Build a card. Returns the `ImageResponse` an `opengraph-image` route exports.
 *
 * Every caller passes strings it has already formatted; nothing here fetches,
 * so a card cannot fail in a way the page it represents would not.
 */
export function ogCard({ title, blurb, stats, note }: CardOptions): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLOR.bg,
          color: COLOR.text,
          padding: 64,
        }}
      >
        <Masthead />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.12 }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.35,
              marginTop: 20,
              color: COLOR.muted,
              // The tagline is 94 characters and would otherwise run the full
              // 1072px of usable width as one unbroken line.
              maxWidth: 880,
            }}
          >
            {blurb ?? BRAND.tagline}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {stats && stats.length > 0 && (
            <div style={{ display: "flex", gap: 24, marginBottom: 34 }}>
              {stats.slice(0, 4).map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    // Fixed height with the two ends pushed apart, rather than
                    // letting each cell size to its own content: the labels
                    // run to one or two lines depending on the figure, and a
                    // content-sized column drops the shorter cells' NUMBERS
                    // down to meet them. Four headline figures sitting at
                    // three different heights reads as a rendering fault.
                    justifyContent: "space-between",
                    height: 128,
                    flex: 1,
                    // A left rule rather than a box: these are figures quoted
                    // from the page, not tiles of their own.
                    borderLeft: `3px solid ${COLOR.edge}`,
                    paddingLeft: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: valueSize(s.value),
                      fontWeight: 700,
                      color: COLOR.text,
                      // Satori has no auto-fit and no `text-overflow`, so a
                      // value too wide for its cell WRAPS — and in a
                      // fixed-height column that means it wraps over its own
                      // label. `valueSize` is the whole defence; see there.
                      lineHeight: 1.05,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 19,
                      lineHeight: 1.3,
                      marginTop: 8,
                      color: COLOR.muted,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 22,
              borderTop: `1px solid ${COLOR.edge}`,
              fontSize: 23,
              color: COLOR.dead,
            }}
          >
            <span>{BRAND.domain}</span>
            {/* Hyphen, not an en-dash: see the module doc on ASCII. */}
            <span>{note ?? "evidence attached - no score"}</span>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
