import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  statusGlyph,
  statusInkClass,
  statusLabel,
} from "@/lib/status";

/**
 * The signature component: seven cells, read as one instrument.
 *
 * Previously seven chips with gaps between them, which read as seven separate
 * tags. They are not seven things — they are one readout with seven positions,
 * the way a bank of indicator lamps is one panel. So the cells now butt
 * together inside a single hairline frame, sharing internal rules. At a
 * glance you see the shape of an agent; up close you read each position.
 *
 * Every cell carries three channels: the rung number, a glyph for its status,
 * and colour. The glyph exists because colour alone excluded red-green
 * colourblind readers from the densest information on the site — see
 * `lib/status.ts`. The `title` and `aria-label` spell the whole thing out, so
 * a screen reader gets "rung 2, resolvable: passed" rather than "2".
 *
 * ## Never summed
 *
 * Do not add a count, a fraction, a sort key or a "5 of 7" derived from these.
 * That is the one aggregate this product refuses to compute, and this
 * component is where it would be most tempting to add.
 *
 * The ladder has seven rungs by design (see /methodology), but any run may not
 * have reached every one for a given agent — a short-circuited pipeline (rung
 * 2 errors, so rung 3 never runs) or a rung not yet implemented (rung 6,
 * currently) both mean "no row", rendered as "not checked" and visually
 * distinct from `skipped`, a status the API actively assigned.
 */
const LADDER_SIZE = 7;

export function RungStrip({
  rungs,
  size = "sm",
}: {
  rungs: { rung: number; name: string; status: string }[];
  /** `md` shows the status word under each number — for the agent page header
   * and anywhere the strip is the headline rather than one cell in a table. */
  size?: "sm" | "md";
}) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));

  const cell =
    size === "md"
      ? "h-14 w-[4.75rem] flex-col justify-center gap-0.5 text-base"
      : "h-6 w-8 items-center justify-center gap-[3px] text-[11px]";

  return (
    <div
      role="list"
      className="inline-flex overflow-hidden rounded-[3px] border border-edge bg-panel/70"
    >
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
            className={[
              "flex items-center border-r border-line/80 font-mono last:border-r-0",
              cell,
              // The status colour is applied as text; the cell keeps the
              // frame's neutral hairlines so the strip stays one object
              // rather than seven differently-bordered boxes.
              r ? statusInkClass(r.status) : "text-dead",
              r ? "" : "bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(232,228,220,.045)_3px,rgba(232,228,220,.045)_6px)]",
            ].join(" ")}
          >
            {size === "md" ? (
              <>
                <span aria-hidden="true" className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold leading-none">{n}</span>
                  <span className="leading-none">
                    {r ? statusGlyph(r.status) : NOT_CHECKED_GLYPH}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-[9px] uppercase tracking-[0.08em] opacity-80"
                >
                  {r ? r.status : "n/c"}
                </span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="leading-none">
                  {n}
                </span>
                <span aria-hidden="true" className="leading-none">
                  {r ? statusGlyph(r.status) : NOT_CHECKED_GLYPH}
                </span>
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
