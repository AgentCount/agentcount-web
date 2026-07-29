import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  notCheckedClasses,
  statusClasses,
  statusGlyph,
  statusLabel,
} from "@/lib/status";

/**
 * Seven badges, side by side — the whole ladder at a glance, and never summed.
 *
 * Do not add a count, a fraction, or a sort key derived from these: that is the
 * one aggregate this product refuses to compute. "5 of 7 passed" is a score
 * wearing a different hat.
 *
 * Each badge carries three channels: the rung number, a glyph for its status,
 * and colour. The glyph exists because colour alone excluded red-green
 * colourblind readers from the densest thing on the site — see `lib/status.ts`.
 * The `title` and `aria-label` spell the whole thing out in words, so a screen
 * reader gets "rung 2, resolvable: passed" rather than "2".
 *
 * The ladder has seven rungs by design (see /methodology), but any run may not
 * have reached every one for a given agent — a short-circuited pipeline (rung 2
 * errors, so rung 3 never runs) or a rung not yet implemented (rung 6,
 * currently) both mean "no row", rendered as "not checked" and visually
 * distinct from `skipped`, a status the API actively assigned.
 */
const LADDER_SIZE = 7;

export function RungStrip({
  rungs,
  size = "sm",
}: {
  rungs: { rung: number; name: string; status: string }[];
  /** `md` is for the agent page header, where the strip is the headline
   * rather than one cell in a dense table. */
  size?: "sm" | "md";
}) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));
  const box =
    size === "md"
      ? "min-w-9 px-2 py-1 text-sm gap-1"
      : "min-w-7 px-1.5 py-0.5 text-xs gap-0.5";

  return (
    <div className="flex flex-wrap gap-1" role="list">
      {Array.from({ length: LADDER_SIZE }, (_, i) => i + 1).map((n) => {
        const r = byRung.get(n);
        const description = r
          ? `rung ${n}, ${r.name}: ${statusLabel(r.status)}`
          : `rung ${n}: ${NOT_CHECKED_LABEL}`;
        return (
          <span
            key={n}
            role="listitem"
            title={description}
            aria-label={description}
            className={`inline-flex items-center justify-center rounded border font-mono tabular-nums ${box} ${
              r ? statusClasses(r.status) : notCheckedClasses
            }`}
          >
            <span aria-hidden="true">{n}</span>
            <span aria-hidden="true">
              {r ? statusGlyph(r.status) : NOT_CHECKED_GLYPH}
            </span>
          </span>
        );
      })}
    </div>
  );
}
