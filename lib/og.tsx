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
 * `ImageResponse` renders with Satori, which is not a browser, and its limits
 * have already broken this site's cards once each. They are recorded here
 * because every new card will meet them again:
 *
 *   * **Stay inside the fonts actually loaded.** Satori bundles a Latin
 *     subset, and [`brandFonts`] adds IBM Plex Mono. Any character neither
 *     covers triggers a RUNTIME font download, which fails, and the route then
 *     returns an empty body — so the preview breaks rather than degrading.
 *     The status glyphs (`✓ ✗ ○ –`) are outside both; cards spell status
 *     words out instead. Plex does cover the em-dash the tagline uses.
 *   * **No CSS variables, no Tailwind.** Nothing from `globals.css` or
 *     `lib/status.ts` resolves. [`COLOR`] below is a hand-copy of the `@theme`
 *     block and has to be kept in step with it by hand.
 *   * **No implicit block layout.** Any element with more than one child throws
 *     unless it declares `display: flex`. A bare `{a} - {b}` is three children.
 *
 * ## Fonts
 *
 * Satori resolves `fontFamily` against fonts it was actually handed, so every
 * card must pass `fonts: await brandFonts()` in its `ImageResponse` options —
 * that is what makes `fontFamily: "IBM Plex Mono"` real. The two TTFs live in
 * `lib/fonts/` (OFL, notice alongside) and are read from disk once per
 * process; `next.config.ts` traces them into the deployed functions.
 *
 * Passing fonts also REPLACES Satori's bundled default, so every card now
 * renders entirely in Plex Mono — including text that sets no `fontFamily`.
 * Verified by render, and kept: mono is the site's dominant voice, and one
 * true face beats one right face plus a wrong fallback. Mind the width when
 * writing card copy; mono runs ~20% wider than the old default sans.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "./brand";
import { tallyDataUri } from "./tally";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * The card-length tagline. NOT `BRAND.tagline` — that one is a 94-character
 * sentence written for a `<meta description>`, and at card type sizes it
 * wraps to three lines and buries the point. This is the same claim at
 * poster length, and it is also what the exported banner in `public/brand/`
 * says, so a shared card and a profile header cannot disagree.
 */
export const OG_TAGLINE = "The independent ERC-8004 census — evidence attached";

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

type Font = {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: "normal";
};

let fontsPromise: Promise<Font[]> | null = null;

/**
 * IBM Plex Mono, regular and semibold, for Satori. Read from disk once per
 * process and shared by every card render after that.
 *
 * The semibold file is registered as weight 700 because the cards ask for
 * `fontWeight: 700` and the site never uses Plex's true bold — matching the
 * registration to the request beats shipping a third font file nothing needs.
 */
export function brandFonts(): Promise<Font[]> {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "lib/fonts/IBMPlexMono-Regular.ttf")),
    readFile(join(process.cwd(), "lib/fonts/IBMPlexMono-SemiBold.ttf")),
  ]).then(([regular, semibold]) => [
    { name: "IBM Plex Mono", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "IBM Plex Mono", data: semibold, weight: 700 as const, style: "normal" as const },
  ]);
  return fontsPromise;
}

/**
 * Shrink a headline figure so it fits one line of its cell.
 *
 * Four cells share 1072px of usable width, so each gets roughly 250px. At
 * weight 700 a digit is about 0.6em wide, which puts the limits below at
 * roughly the point where a value would otherwise wrap — and wrapping is the
 * failure that matters here, because the cell is a fixed height with the label
 * pinned to its bottom, so a second line of the VALUE lands on the label.
 *
 * Found by rendering `1 in 10,437` on the linkage card, where it did exactly
 * that.
 */
function valueSize(value: string): number {
  if (value.length <= 7) return 52;
  if (value.length <= 10) return 42;
  return 34;
}

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
  /** One line under it. Defaults to the card tagline. */
  blurb?: string;
  /** Up to four. Rendered as a row across the foot of the card. */
  stats?: OgStat[];
  /** Right-hand side of the footer rule — a run date, a chain, a count. */
  note?: string;
};

/**
 * The masthead: the tally mark, the wordmark, then what it measures.
 *
 * Deliberately the same construction as the site's own header, because a card
 * is often the first thing anyone sees of this project and the page it leads
 * to should look like the same object. The wordmark is set in the site's
 * mono — the one typographic identity that survives into Satori (see the
 * module doc on fonts).
 */
export function Masthead() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      {/* Satori draws this, not a browser — next/image has no meaning here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tallyDataUri({ color: COLOR.live })}
        width={44}
        height={44}
        alt=""
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
        <div
          style={{
            fontFamily: "IBM Plex Mono",
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
    </div>
  );
}

/**
 * A deliberately MIXED seven-cell strip: pass, fail, skipped and not-checked
 * together, the way a real record looks.
 *
 * This is brand texture, not data — which is exactly why it must not be all
 * green. Seven passes reads as a badge, and a badge is a score wearing a
 * costume. The one thing this strip is allowed to claim is that the product
 * records mixed results without flinching. Statuses here are colour-only
 * (no words) because they assert nothing about any agent.
 *
 * Shared by the fixed-page cards and the exported banner. NEVER put this on
 * an agent's own card — an agent card carries that agent's real rungs and
 * nothing invented.
 */
const MIXED_STRIP: readonly (string | null)[] = [
  "pass",
  "pass",
  "fail",
  "pass",
  "skipped",
  null, // not checked — dashed, like the site renders it
  "pass",
];

function mixedColor(status: string | null): string {
  switch (status) {
    case "pass":
      return COLOR.live;
    case "fail":
      return COLOR.fail;
    case "skipped":
      return COLOR.dim;
    default:
      return COLOR.dead;
  }
}

/** Default cell sized so masthead + strip share the card's 1072px of usable
 * width with air between them — mono runs wide, and at 44px they collided. */
export function MixedStrip({ cell = 36 }: { cell?: number }) {
  return (
    <div style={{ display: "flex", gap: Math.round(cell / 5) }}>
      {MIXED_STRIP.map((status, i) => {
        const color = mixedColor(status);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: cell,
              height: Math.round(cell * 0.84),
              borderRadius: 2,
              border: `2px ${status ? "solid" : "dashed"} ${color}`,
              background: COLOR.panel,
              color,
              fontSize: Math.round(cell * 0.42),
              fontWeight: 700,
            }}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Build a card. Returns the `ImageResponse` an `opengraph-image` route exports.
 *
 * Every caller passes strings it has already formatted; nothing here fetches
 * except the fonts already on disk, so a card cannot fail in a way the page
 * it represents would not.
 */
export async function ogCard({
  title,
  blurb,
  stats,
  note,
}: CardOptions): Promise<ImageResponse> {
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Masthead />
          <MixedStrip />
        </div>

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
              // Long blurbs would otherwise run the full 1072px of usable
              // width as one unbroken line.
              maxWidth: 880,
            }}
          >
            {blurb ?? OG_TAGLINE}
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
                      // fixed-height column that means the second line lands
                      // on top of its own label. `valueSize` is the defence;
                      // `nowrap` alone would overflow the cell instead:
                      // tidier, still wrong.
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
            {/* Hyphen, not an en-dash: run notes interpolate API strings, and
                ASCII keeps them inside what the loaded fonts can draw. */}
            <span>{note ?? "evidence attached - no score"}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await brandFonts() },
  );
}
