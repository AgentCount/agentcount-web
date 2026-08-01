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
 */
export function TallyMark({ className }: { className?: string }) {
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
          strokeWidth={TALLY_STROKE_WIDTH}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
