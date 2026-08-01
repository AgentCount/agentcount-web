import { checkAriaLabel, checkFor, questionFor } from "@/lib/checks";
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
 * the way a bank of indicator lamps is one panel. So the cells butt together
 * inside a single hairline frame, sharing internal rules. At a glance you see
 * the shape of an agent; up close you read each position.
 *
 * Every cell carries three channels: the check number, a glyph for its status,
 * and colour. The glyph exists because colour alone excluded red-green
 * colourblind readers from the densest information on the site — see
 * `lib/status.ts`.
 *
 * ## The number alone was never enough
 *
 * A "2" in a box tells a reader nothing about what was asked. The numbers stay
 * — they are the ordering, and the strip has to survive at table density — but
 * each cell now carries the plain question from `lib/checks.ts` in three
 * places: a popover on hover, the same text on tap, and an `aria-label` that
 * spells the whole cell out, so a screen reader gets "Check 2, Reachable? —
 * passed" rather than "2".
 *
 * ## No JavaScript
 *
 * The popover is CSS: `group-hover` for a mouse, `group-focus-within` for a
 * keyboard, and — the part that makes it work on a phone — a `tabindex` on the
 * cell, so a tap focuses it and shows the panel, and a tap elsewhere blurs it
 * and hides it again. That is the whole touch "toggle", with no state and no
 * client bundle in an app that ships two client components in total.
 *
 * ## Never summed
 *
 * Do not add a count, a fraction, a sort key or a "5 of 7" derived from these.
 * That is the one aggregate this product refuses to compute, and this
 * component is where it would be most tempting to add.
 */
const LADDER_SIZE = 7;

export function RungStrip({
  rungs,
  size = "sm",
  evidenceFor,
}: {
  rungs: { rung: number; name: string; status: string }[];
  /** `md` shows the status word under each number — for the agent page header
   * and anywhere the strip is the headline rather than one cell in a table. */
  size?: "sm" | "md";
  /** One line of evidence per check, shown in the popover. Agent pages pass
   * this; a directory row has no evidence loaded and omits it. */
  evidenceFor?: (rung: number) => string | null;
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
        const question = questionFor(n, r?.name);
        const status = r ? statusLabel(r.status) : NOT_CHECKED_LABEL;
        const description = checkAriaLabel(n, status, r?.name);
        const evidence = evidenceFor?.(n) ?? null;
        return (
          <span
            key={n}
            role="listitem"
            aria-label={description}
            // Focusable so a TAP opens the popover on touch, where there is no
            // hover — and so a keyboard reaches it at all.
            tabIndex={0}
            className={[
              "group relative flex items-center border-r border-line/80 font-mono last:border-r-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
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

            {/* The popover. `aria-hidden` because `aria-label` above already
                carries the same words — a screen reader should hear the cell
                once, not twice. */}
            <span
              aria-hidden="true"
              className="pointer-events-none invisible absolute left-0 top-full z-20 mt-1 w-64 whitespace-normal border border-edge bg-raised p-3 text-left opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-dead">
                Check {n}
              </span>
              <span className="mt-1 block font-sans text-sm font-semibold text-text">
                {question}
              </span>
              <span className="mt-1 block font-sans text-xs leading-relaxed text-muted">
                {checkFor(n)?.meaning}
              </span>
              <span
                className={`mt-2 block border-t border-line pt-2 font-mono text-[0.6875rem] ${
                  r ? statusInkClass(r.status) : "text-dead"
                }`}
              >
                {r ? r.status : "not checked"}
              </span>
              <span className="mt-0.5 block font-sans text-xs leading-relaxed text-muted">
                {status}
              </span>
              {evidence && (
                <span className="mt-2 block break-words border-t border-line pt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
                  {evidence}
                </span>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
