import type { ReactNode } from "react";
import { CountUp } from "./CountUp";

/**
 * The companion-page stat box: the homepage's `panel` scaled down for a
 * page-head that shares its row with intro prose rather than owning a hero.
 * It sets the `mini-panel` utility, which is that same one exception to
 * "cards never get a border on all four sides" at a smaller size rather
 * than a second exception to it. Its three call sites —
 * `app/directory/AgentDirectory.tsx`, `app/data/page.tsx` and
 * `app/reports/page.tsx` — are each a two-column page-head: intro left,
 * this box right.
 *
 * `count` takes a number or an already-formatted string: most callers pass a
 * plain number, but `app/reports/page.tsx` already holds its report totals
 * pre-formatted in `lib/reports.ts` (see that module's own comment on why a
 * percentage or a total is never re-derived in this app). Either way the
 * figure now counts up on mount through `CountUp.tsx` — a string caller gets
 * its digits parsed ONLY to drive the animation's intermediate frames,
 * `Number.isFinite` guarding the rare case that fails; the text it settles
 * on, before mount and once the count finishes, is always its own original
 * string, never a second computation of it. See `CountUp.tsx`'s own doc for
 * the fuller reasoning — the hero's population figure on `app/page.tsx`
 * shares this exact behaviour, from the same component.
 *
 * The big figure sets `headline` (mono), the same face `label` and every
 * other value in this box already sets — see the Type section at the top
 * of `globals.css` for the pass that moved every standalone figure off the
 * condensed `numeral` face and onto this one, alongside the page titles
 * that moved first.
 */
export function MiniPanel({
  label,
  count,
  foot,
  className = "",
}: {
  label: string;
  count: number | string;
  /** Two short facts under the count, spaced apart — see the call sites. */
  foot: ReactNode;
  /** Layout only (spacing/grid placement) — every call site needs its own
   * top margin for the mobile single-column stack, since the two-column
   * grid that removes it only applies from `lg` up. */
  className?: string;
}) {
  const numeric = typeof count === "number" ? count : Number(count.replace(/,/g, ""));

  return (
    <div className={`mini-panel ${className}`}>
      <p className="label">{label}</p>
      <p className="headline mt-2 text-[clamp(1.9rem,3vw,2.5rem)] text-text">
        {Number.isFinite(numeric) ? (
          <CountUp value={numeric} finalText={typeof count === "string" ? count : undefined} />
        ) : (
          count
        )}
        {/* The same resting cursor the homepage panel's population figure
            carries — both now settle, count-up finished, in the same still
            state this always rendered before the animation existed. */}
        <span className="ml-1 text-[0.5em] font-medium text-dead">_</span>
      </p>
      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-line pt-3 font-mono text-[0.6875rem] text-dead">
        {foot}
      </div>
    </div>
  );
}
