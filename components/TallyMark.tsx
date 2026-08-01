import {
  TALLY_STROKES,
  TALLY_STROKE_WIDTH,
  TALLY_VIEW,
} from "@/lib/tally";

/**
 * The mark, inline, drawn in `currentColor` so the caller applies the real
 * `text-live` token rather than a hex copy of it. Always decorative — the
 * wordmark text it accompanies is the accessible name — hence `aria-hidden`
 * unconditionally.
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
  return (
    <svg
      viewBox={`0 0 ${TALLY_VIEW} ${TALLY_VIEW}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {TALLY_STROKES.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
