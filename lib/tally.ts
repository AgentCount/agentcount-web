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
 * ## The one colour
 *
 * The mark is drawn in the site's pass-green (`--color-live`) on the site's
 * near-black, and in nothing else, ever. The status palette is the product's
 * entire visual vocabulary (see `app/globals.css`), and the brand deliberately
 * borrows from it rather than adding to it. `TALLY_COLOR` is a hand-copy of
 * the token, for the same reason `lib/og.tsx`'s `COLOR` is: standalone SVG
 * files and Satori resolve no CSS variables. In React, prefer `<TallyMark>`
 * with `className="text-live"` so the real token is used.
 *
 * ## Sized to survive 16px
 *
 * Five strokes on a 48-unit canvas: stroke width 5, clear gaps of 4. At
 * favicon size (16px) that is a 1.7px stroke and a 1.3px gap — the smallest
 * the mark can go while the four verticals still resolve as four. Do not add
 * detail; anything finer than these strokes disappears exactly where the mark
 * is seen most.
 */

/** The design canvas is `0 0 48 48`. */
export const TALLY_VIEW = 48;

export const TALLY_STROKE_WIDTH = 5;

/**
 * Four verticals and the diagonal that counts them off, as
 * `[x1, y1, x2, y2]`. The diagonal runs bottom-left to top-right — upward,
 * left-to-right, the direction a count grows.
 */
export const TALLY_STROKES: readonly (readonly [number, number, number, number])[] = [
  [10, 8, 10, 40],
  [19, 8, 19, 40],
  [28, 8, 28, 40],
  [37, 8, 37, 40],
  [5, 35, 43, 13],
];

/** Hand-copies of `--color-live` and `--color-bg` — see the module doc. */
export const TALLY_COLOR = "#3ddc84";
export const TALLY_BG = "#08090b";

/**
 * The mark as a standalone SVG document.
 *
 * `padding` widens the viewBox around the 48-unit canvas — used where the
 * mark sits on its own solid tile (favicon, touch icon) and needs air between
 * the strokes and the edge. With `background` unset the mark is transparent,
 * which is what the exported logo files want.
 */
export function tallySvg({
  size,
  background,
  padding = 0,
  color = TALLY_COLOR,
}: {
  /** Rendered width/height in px. Defaults to the viewBox size. */
  size?: number;
  /** Solid fill behind the mark; omit for transparent. */
  background?: string;
  /** Extra viewBox units on every side. */
  padding?: number;
  color?: string;
} = {}): string {
  const box = TALLY_VIEW + padding * 2;
  const dim = size ?? box;
  const rect = background
    ? `<rect x="${-padding}" y="${-padding}" width="${box}" height="${box}" fill="${background}"/>`
    : "";
  const lines = TALLY_STROKES.map(
    ([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  ).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" ` +
    `viewBox="${-padding} ${-padding} ${box} ${box}" fill="none">${rect}` +
    `<g stroke="${color}" stroke-width="${TALLY_STROKE_WIDTH}" stroke-linecap="round">${lines}</g></svg>`
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
