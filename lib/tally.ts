/**
 * The mark: a tally of five — four vertical strokes and one diagonal.
 *
 * A census counts, and this is the oldest notation for counting there is. The
 * five strokes are also the first five rungs of the ladder if you want them to
 * be, but the mark does not insist on it: it is a count, not a score, which is
 * the whole brand in one gesture.
 *
 * This module is the single source of the geometry. Everything that draws the
 * mark — the header component, the favicons, the OG cards, the exported brand
 * files under `public/brand/` — either imports these constants or was written
 * by `scripts/generate-brand.tsx`, which does. Change the strokes here and
 * re-run `npm run brand`; nothing traces the shape by hand anywhere else.
 *
 * ## Two colours, as of this design proposal
 *
 * The four bars draw in bone (`--color-text`, `TALLY_TEXT`) — the site's
 * own ink, not a status colour. Before this proposal they drew in the
 * site's pass-green (`--color-live`, `TALLY_COLOR`): a brand mark quietly
 * wearing a "pass" verdict it has no standing to claim. `TALLY_COLOR`
 * stays defined and still hand-copies `--color-live` exactly, which is
 * what keeps `test/tokens.test.ts` honest, but nothing in this module
 * draws with it by default any more. What changes alongside the colour is
 * the fifth stroke, the diagonal that counts the bars off: it now carries
 * the new `--color-accent` (see `app/globals.css`'s design-system
 * comment), so the mark itself narrates what it draws — four counted, one
 * doing the counting. `TALLY_TEXT` and `TALLY_ACCENT` are hand-copies for
 * the same reason `TALLY_COLOR` always was one: standalone SVG files and
 * Satori resolve no CSS variables. In React, prefer `<TallyMark>` so the
 * real tokens are used.
 *
 * The gap where the diagonal crosses the four bars is a real cut, not a
 * layering trick: `tallySvg` masks the bars everywhere the diagonal's own
 * stroke passes, so whatever sits behind the mark — page background, a hover
 * fill, anything — shows through there. `components/TallyMark.tsx` does the
 * same with a live SVG `<mask>`.
 *
 * ## Sized to survive 16px
 *
 * Five strokes on a 48-unit canvas: stroke width 5, clear gaps of 4. At
 * favicon size (16px) that is a 1.7px stroke and a 1.3px gap — the smallest
 * the mark can go while the four verticals still resolve as four. Do not add
 * detail; anything finer than these strokes disappears exactly where the mark
 * is seen most. The mask cut trims the gap further at the crossing point
 * only, so it stays inside that same floor rather than opening a new one.
 */

/** The design canvas is `0 0 48 48`. */
export const TALLY_VIEW = 48;

export const TALLY_STROKE_WIDTH = 5;

/** The four counted bars, as `[x1, y1, x2, y2]`. */
export const TALLY_BARS: readonly (readonly [number, number, number, number])[] = [
  [10, 8, 10, 40],
  [19, 8, 19, 40],
  [28, 8, 28, 40],
  [37, 8, 37, 40],
];

/**
 * The stroke that counts the bars off, bottom-left to top-right — upward,
 * left-to-right, the direction a count grows.
 */
export const TALLY_DIAGONAL: readonly [number, number, number, number] = [5, 35, 43, 13];

/** Both, in drawing order — for the rare caller that wants one plain mark. */
export const TALLY_STROKES: readonly (readonly [number, number, number, number])[] = [
  ...TALLY_BARS,
  TALLY_DIAGONAL,
];

/** Hand-copies of `--color-live`, `--color-accent` and `--color-bg` — see the module doc. */
export const TALLY_COLOR = "#3ddc84";
export const TALLY_ACCENT = "#45d3e0";
export const TALLY_BG = "#08090b";
/**
 * Hand-copy of `--color-text` ("bone") — used only by `tallyFaviconSvg`'s
 * dark-mode bars, not by the on-page mark. See that function's doc for why
 * the favicon deliberately does NOT reuse `TALLY_COLOR`.
 */
export const TALLY_TEXT = "#e8e4dc";

/**
 * Wide enough to fully cover `TALLY_STROKE_WIDTH` at any padding this module
 * ships, narrow enough to leave the bars' own gaps alone away from the
 * crossing. Doubling the stroke width has held from 16px favicons up.
 *
 * Exported (not module-private) because `scripts/generate-brand.tsx` needs
 * the identical figure for the wordmark's own mask cut — a second hand-copy
 * of `strokeWidth * 2` would be the third place this formula lives.
 */
export const TALLY_CUT_WIDTH = TALLY_STROKE_WIDTH * 2;

/**
 * The mark as a standalone SVG document.
 *
 * `padding` widens the viewBox around the 48-unit canvas — used where the
 * mark sits on its own solid tile (favicon, touch icon) and needs air between
 * the strokes and the edge. With `background` unset the mark is transparent,
 * which is what the exported logo files want.
 *
 * The bars mask out a channel along the diagonal's own path so the crossing
 * reads as a real gap rather than one stroke painted over the other — see
 * the module doc. Pass `accentColor` equal to `color` to fall back to the
 * old single-colour mark; the mask still applies either way; it is cheap and
 * invisible when both colours match.
 *
 * `color` defaults to `TALLY_TEXT` (bone), not `TALLY_COLOR` (pass-green):
 * every caller of this function — the favicons, the touch icon, the
 * standalone logo files — draws the brand mark, not a status readout, and
 * green there reads as a "pass" none of these files is entitled to claim.
 * `TALLY_COLOR` stays defined and still tested against `--color-live`
 * because it is what the mark drew in before this proposal and a caller
 * that explicitly wants the old single-colour mark can still pass it in —
 * nothing here defaults to it any more.
 */
export function tallySvg({
  size,
  background,
  padding = 0,
  color = TALLY_TEXT,
  accentColor = TALLY_ACCENT,
}: {
  /** Rendered width/height in px. Defaults to the viewBox size. */
  size?: number;
  /** Solid fill behind the mark; omit for transparent. */
  background?: string;
  /** Extra viewBox units on every side. */
  padding?: number;
  /** Colour of the four counted bars. */
  color?: string;
  /** Colour of the diagonal that counts them off. */
  accentColor?: string;
} = {}): string {
  const box = TALLY_VIEW + padding * 2;
  const dim = size ?? box;
  const rect = background
    ? `<rect x="${-padding}" y="${-padding}" width="${box}" height="${box}" fill="${background}"/>`
    : "";
  const maskId = "tally-cut";
  const [dx1, dy1, dx2, dy2] = TALLY_DIAGONAL;
  const bars = TALLY_BARS.map(
    ([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  ).join("");
  const mask =
    `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="${-padding}" y="${-padding}" width="${box}" height="${box}">` +
    `<rect x="${-padding}" y="${-padding}" width="${box}" height="${box}" fill="#fff"/>` +
    `<line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="#000" stroke-width="${TALLY_CUT_WIDTH}" stroke-linecap="round"/>` +
    `</mask>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" ` +
    `viewBox="${-padding} ${-padding} ${box} ${box}" fill="none">${rect}${mask}` +
    `<g stroke="${color}" stroke-width="${TALLY_STROKE_WIDTH}" stroke-linecap="round" mask="url(#${maskId})">${bars}</g>` +
    `<line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="${accentColor}" stroke-width="${TALLY_STROKE_WIDTH}" stroke-linecap="round"/>` +
    `</svg>`
  );
}

/**
 * The same SVG as a `data:` URI, for Satori. The OG renderer takes inline
 * `<svg>` markup unreliably but rasterises an `<img>` with an SVG data URI
 * through resvg, which draws it correctly — so every card embeds the mark
 * this way.
 */
export function tallyDataUri(options: Parameters<typeof tallySvg>[0] = {}): string {
  return `data:image/svg+xml,${encodeURIComponent(tallySvg(options))}`;
}

/**
 * The favicon, as a single file that switches itself.
 *
 * `app/icon.svg` is a Next file-convention asset: Next serves it byte for
 * byte and injects one `<link>` for it, so there is no per-request hook for
 * choosing between a light and a dark file — and there does not need to be
 * one, because an SVG can carry its own `@media (prefers-color-scheme)` and
 * repaint itself in the browser's own chrome, independent of whatever theme
 * the page underneath happens to be in. Browser tab chrome switches with the
 * OS; this site's own surface does not (see `app/globals.css` — there is no
 * light `--color-bg`), so the two are genuinely different questions and this
 * function answers only the first one.
 *
 * The bars are `TALLY_TEXT` (bone) in dark chrome and `TALLY_BG` (near-black,
 * reused as an ink rather than a fill) in light chrome — deliberately NOT
 * `TALLY_COLOR`, the pass-green every other rendering of this mark uses. On
 * the page, green is correct: the bars sit beside real rung verdicts, so
 * reusing the status hue ties the mark to what it counts. A tab icon has no
 * such neighbours — green there reads as an arbitrary colour choice, or
 * worse, as a status this one favicon is quietly claiming for itself. Bone
 * is what the rest of this site's chrome is drawn in, which is what a
 * favicon is: chrome, not data. There is no background rect: the tile stays
 * transparent in both modes, so the mark sits directly on whatever the
 * browser's own tab chrome is — a painted square behind it reads as this
 * site's surface bleeding into chrome that is not this site's to paint, and
 * disagrees with every other browser tab sitting next to it.
 *
 * The diagonal stays `TALLY_ACCENT` in both modes, unconditionally — see
 * `app/globals.css`'s design-system comment: this is the one place the new
 * accent is allowed to under-perform on contrast (~1.8:1 on white; ~11:1 on
 * near-black) because it is decoration, not text, and WCAG's text-contrast
 * floor does not apply to it. `test/tokens.test.ts` only measures the four
 * text tokens for exactly this reason.
 */
export function tallyFaviconSvg({ padding = 3 }: { padding?: number } = {}): string {
  const box = TALLY_VIEW + padding * 2;
  const maskId = "tally-cut";
  const [dx1, dy1, dx2, dy2] = TALLY_DIAGONAL;
  const bars = TALLY_BARS.map(
    ([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  ).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" ` +
    `viewBox="${-padding} ${-padding} ${box} ${box}" fill="none">` +
    `<style>` +
    `.tally-bars{stroke:${TALLY_TEXT}}` +
    `@media (prefers-color-scheme:light){.tally-bars{stroke:${TALLY_BG}}}` +
    `</style>` +
    `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="${-padding}" y="${-padding}" width="${box}" height="${box}">` +
    `<rect x="${-padding}" y="${-padding}" width="${box}" height="${box}" fill="#fff"/>` +
    `<line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="#000" stroke-width="${TALLY_CUT_WIDTH}" stroke-linecap="round"/>` +
    `</mask>` +
    `<g class="tally-bars" stroke-width="${TALLY_STROKE_WIDTH}" stroke-linecap="round" mask="url(#${maskId})">${bars}</g>` +
    `<line x1="${dx1}" y1="${dy1}" x2="${dx2}" y2="${dy2}" stroke="${TALLY_ACCENT}" stroke-width="${TALLY_STROKE_WIDTH}" stroke-linecap="round"/>` +
    `</svg>`
  );
}
