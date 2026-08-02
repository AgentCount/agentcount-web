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

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-[13rem_1fr]">
      <div className="flex items-baseline gap-3 lg:flex-col lg:items-start lg:gap-1">
        <div className="flex items-baseline gap-2">
          <span className="numeral text-2xl text-dead">{rung.rung}</span>
          <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-text">
            {questionFor(rung.rung, rung.name)}{" "}
            <span className="text-dead">{rung.name}</span>
          </h3>
        </div>
        <span className="label">of {total.toLocaleString("en-US")}</span>
      </div>

      <div>
        <div
          className="flex h-2.5 w-full overflow-hidden bg-panel"
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

        <ul className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5">
          {rung.counts.map((c) => (
            <li key={c.status} className="flex items-baseline gap-1.5 font-mono text-xs">
              <span aria-hidden="true" className={statusInkClass(c.status)}>
                {statusGlyph(c.status)}
              </span>
              <span className="text-muted">{c.status}</span>
              <span className="text-text">{c.count.toLocaleString("en-US")}</span>
              <span className="text-dead">{pct(c.count).toFixed(1)}%</span>
            </li>
          ))}
          {notChecked > 0 && (
            <li className="flex items-baseline gap-1.5 font-mono text-xs">
              <span aria-hidden="true" className="text-dead">
                ·
              </span>
              <span className="text-muted">not checked</span>
              <span className="text-text">{notChecked.toLocaleString("en-US")}</span>
              <span className="text-dead">{pct(notChecked).toFixed(1)}%</span>
            </li>
          )}
        </ul>
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
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-[13rem_1fr]">
      <div className="flex items-baseline gap-3 lg:flex-col lg:items-start lg:gap-1">
        <div className="flex items-baseline gap-2">
          <span className="numeral text-2xl text-dead">{rungNumber}</span>
          <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-dead">
            {questionFor(rungNumber)}{" "}
            <span className="text-dead/70">{checkFor(rungNumber)?.internal}</span>
          </h3>
        </div>
      </div>
      <div>
        <div
          aria-hidden="true"
          className="h-[10px] w-full bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(232,228,220,.06)_3px,rgba(232,228,220,.06)_6px)]"
        />
        <p className="mt-2 font-mono text-xs text-dead">
          · {NOT_CHECKED_LABEL} — this check is not asked of anyone yet
        </p>
      </div>
    </div>
  );
}
