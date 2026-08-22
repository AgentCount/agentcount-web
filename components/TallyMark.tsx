import { useId } from "react";
import {
  TALLY_BARS,
  TALLY_DIAGONAL,
  TALLY_STROKE_WIDTH,
  TALLY_VIEW,
} from "@/lib/tally";

/**
 * The mark, inline. The four bars draw in `currentColor`, unchanged from
 * before this proposal — the caller still applies `text-live` or whatever
 * token fits, exactly as it always has. The fifth stroke, the diagonal that
 * counts the bars off, now draws in `var(--color-accent)` directly rather
 * than `currentColor`: see the design-system comment in `app/globals.css`
 * and the module doc in `lib/tally.ts` for why the mark carries two colours
 * as of this proposal instead of one. Always decorative — the wordmark text
 * it accompanies is the accessible name — hence `aria-hidden` unconditionally.
 *
 * ## The crossing gap is a real cut
 *
 * Where the diagonal crosses the four bars, an SVG `<mask>` paints the bars
 * transparent along a channel the width of the diagonal's own stroke, so
 * whatever sits behind the mark — page background, a hover fill, anything —
 * shows through there rather than one stroke sitting on top of the other.
 * `useId` keeps the mask's id unique per instance, since a page can now
 * render this component more than once (the header wordmark, plus a hero
 * watermark on `/`).
 *
 * ## Why `strokeWidth` is adjustable
 *
 * The five strokes and the four gaps between them fail at opposite ends of
 * the size range, so one weight cannot serve both.
 *
 * At favicon sizes the GAPS fail first: the default width 5 leaves 4 units
 * clear between strokes, which at 16px is 1.3px — already the floor. Any
 * heavier and the four verticals silt up into a block, which is why
 * `lib/tally.ts` calibrates 5 for 16px and why the icon exports never pass
 * this prop.
 *
 * At header sizes the gaps are in no danger and the STROKES are what fail:
 * at 24px, width 5 renders 2.5px, the same as a semibold condensed stem, so
 * the mark reads as a thin drawing beside its own wordmark rather than as a
 * mark. The header passes 6 (3px, about 1.25x the text stem) and still keeps
 * 3 units — 1.5px — of clear gap.
 */
export function TallyMark({
  className,
  strokeWidth = TALLY_STROKE_WIDTH,
}: {
  className?: string;
  /** In viewBox units, out of 48. See the note above before changing. */
  strokeWidth?: number;
}) {
  const maskId = useId();
  const [dx1, dy1, dx2, dy2] = TALLY_DIAGONAL;
  // Wide enough to fully cover any strokeWidth this component is ever passed
  // (double the largest — 6, at the header) while leaving the bars' own
  // clear gaps alone away from the crossing.
  const cutWidth = strokeWidth * 2;

  return (
    <svg
      viewBox={`0 0 ${TALLY_VIEW} ${TALLY_VIEW}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={TALLY_VIEW} height={TALLY_VIEW}>
        <rect x={0} y={0} width={TALLY_VIEW} height={TALLY_VIEW} fill="#fff" />
        <line
          x1={dx1}
          y1={dy1}
          x2={dx2}
          y2={dy2}
          stroke="#000"
          strokeWidth={cutWidth}
          strokeLinecap="round"
        />
      </mask>
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" mask={`url(#${maskId})`}>
        {TALLY_BARS.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <line
        x1={dx1}
        y1={dy1}
        x2={dx2}
        y2={dy2}
        stroke="var(--color-accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
