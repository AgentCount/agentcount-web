import type { RungRate } from "@/lib/api/schemas";
import { checkFor, checkLabel, questionFor } from "@/lib/checks";
import {
  NOT_CHECKED_LABEL,
  statusBarPattern,
  statusBgClasses,
  statusGlyph,
  statusInkClass,
  statusLabel,
} from "@/lib/status";

/**
 * One rung's population rates: a stacked bar plus the numbers behind it.
 *
 * This is the finding — the census page leads with it. The table that used to
 * sit underneath restated exactly these numbers and has been deleted; the page
 * itself admitted it was "the same numbers restated", which is a description
 * of noise.
 *
 * The bar is a flat 10px band with square ends, not a rounded pill: it is a
 * measurement, and a measurement should not look like a progress indicator.
 *
 * `counts` never sums to the run's `agent_count` for every rung: a rung
 * short-circuited by an earlier failure (rung 2 errors, so rung 3 gets a
 * `skipped` row, but rung 4 gets no row at all for that agent) means fewer
 * agents were even asked this question. The gap between `total` and the sum of
 * `counts` is rendered as its own "not checked" segment rather than silently
 * inflating whichever status happens to render widest — leaving it out would
 * let a rung nobody reached look like it mostly passed.
 *
 * Colour is not the only channel here either: the two most easily confused
 * statuses carry stripe patterns, the gap carries a third, and every segment
 * names itself with its glyph and count in the row underneath — which is the
 * real fallback.
 */
export function RateBar({ rung, total }: { rung: RungRate; total: number }) {
  const sum = rung.counts.reduce((acc, c) => acc + c.count, 0);
  const notChecked = Math.max(0, total - sum);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  // One list, largest share first, with the unreached gap as its own entry.
  // Ordering by size is the distribution's own order, not a judgement about
  // which status matters — and it puts the number that explains the bar at
  // the top of every row, so the rows compare to each other by eye.
  const rows = [
    ...rung.counts.map((c) => ({
      status: c.status,
      count: c.count,
      glyph: statusGlyph(c.status),
      ink: statusInkClass(c.status),
    })),
    ...(notChecked > 0
      ? [{ status: "not checked", count: notChecked, glyph: "·", ink: "text-dead" }]
      : []),
  ].sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-[15rem_1fr]">
      {/* The label column is one shape on every row: number and question on
          the first line, the checker's own name and the denominator on the
          second. It used to let the internal name wrap inline after the
          question, so rows 3 and 5 set it on the same line and the rest set
          it below — a ragged column that made seven rows look like seven
          decisions. */}
      <div className="flex items-baseline gap-2.5 lg:block">
        <div className="flex items-baseline gap-2">
          <span className="numeral text-xl text-dead">{rung.rung}</span>
          <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-text">
            {questionFor(rung.rung, rung.name)}
          </h3>
        </div>
        <p className="label lg:mt-1.5">
          {rung.name} · {total.toLocaleString("en-US")}
        </p>
      </div>

      <div>
        <div
          className="flex h-2 w-full overflow-hidden bg-panel"
          role="img"
          aria-label={`${checkLabel(rung.rung, rung.name)}: ${rung.counts
            .map((c) => `${c.status} ${c.count.toLocaleString("en-US")}`)
            .join(", ")}${
            notChecked > 0 ? `, not checked ${notChecked.toLocaleString("en-US")}` : ""
          }`}
        >
          {rung.counts.map((c) => (
            <div
              key={c.status}
              className={`${statusBgClasses(c.status)} ${statusBarPattern(c.status)}`}
              style={{ width: `${pct(c.count)}%` }}
              title={`${c.status}: ${c.count.toLocaleString("en-US")} — ${statusLabel(c.status)}`}
            />
          ))}
          {notChecked > 0 && (
            <div
              className="bg-line bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(232,228,220,.16)_2px,rgba(232,228,220,.16)_4px)]"
              style={{ width: `${pct(notChecked)}%` }}
              title={`not checked: ${notChecked.toLocaleString("en-US")} — ${NOT_CHECKED_LABEL}`}
            />
          )}
        </div>

        {/* Fixed columns, not a wrapping row of chips. Every count sits under
            the count above it and every percent under the percent above it,
            which is what lets a reader compare check 2's fail rate to check
            4's without reading either sentence. */}
        <dl className="mt-2 grid grid-cols-[1rem_7.5rem_minmax(0,5rem)_4rem] items-baseline gap-y-0.5 font-mono text-xs">
          {rows.map((r) => (
            <div key={r.status} className="contents">
              <dt aria-hidden="true" className={r.ink}>
                {r.glyph}
              </dt>
              <dd className="text-muted">{r.status}</dd>
              <dd className="text-right text-text">{r.count.toLocaleString("en-US")}</dd>
              <dd className="text-right text-dead">{pct(r.count).toFixed(1)}%</dd>
            </div>
          ))}
        </dl>

        {/* Under the number, not on the method page. See `Check.caveat`. */}
        {checkFor(rung.rung)?.caveat && (
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-dead">
            {checkFor(rung.rung)?.caveat}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The row for a rung the run carries no data for — today, rung 6.
 *
 * Rendered by the rates section for any ladder position missing from
 * `rates.rungs`, so the numbering never skips from 5 to 7 and a reader is
 * not left inferring whether the gap is a bug. Built to disappear on its
 * own: the moment a run reports the rung, `rates.rungs` contains it, the
 * caller's lookup succeeds, and the real `RateBar` renders in this row with
 * no code change here.
 */
export function MissingRateBar({ rungNumber }: { rungNumber: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-[15rem_1fr]">
      <div className="flex items-baseline gap-2.5 lg:block">
        <div className="flex items-baseline gap-2">
          <span className="numeral text-xl text-dead">{rungNumber}</span>
          <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-dead">
            {questionFor(rungNumber)}
          </h3>
        </div>
        <p className="label lg:mt-1.5">{checkFor(rungNumber)?.internal}</p>
      </div>
      <div>
        <div
          aria-hidden="true"
          className="h-2 w-full bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(232,228,220,.06)_3px,rgba(232,228,220,.06)_6px)]"
        />
        {/* One sentence. This read "not checked — this check was never asked
            — this check is not asked of anyone yet", because the shared
            label already ends in the clause that was appended to it. */}
        <p className="mt-2 font-mono text-xs text-dead">
          · not checked — this check is not asked of anyone yet
        </p>
      </div>
    </div>
  );
}
