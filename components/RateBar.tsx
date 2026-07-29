import type { RungRate } from "@/lib/api/schemas";
import {
  NOT_CHECKED_LABEL,
  statusBarPattern,
  statusBgClasses,
  statusGlyph,
  statusLabel,
} from "@/lib/status";

/**
 * One rung's population rates: a stacked bar plus the numbers behind it.
 *
 * This is the finding — the census page leads with it. The table that used to
 * sit underneath restated exactly these numbers and has been deleted; the page
 * itself admitted it was "the same numbers restated", which is a description of
 * noise.
 *
 * `counts` never sums to the run's `agent_count` for every rung: a rung
 * short-circuited by an earlier failure (rung 2 errors, so rung 3 gets a
 * `skipped` row, but rung 4 gets no row at all for that agent) means fewer
 * agents were even asked this question. The gap between `total` and the sum of
 * `counts` is rendered as its own "not checked" segment rather than silently
 * inflating whichever status happens to render widest — leaving it out would
 * let a rung nobody reached look like it mostly passed.
 *
 * Colour is not the only channel here either: the two neutral-grey statuses
 * (`skipped` and `unclaimed`) carry different stripe patterns, and the
 * "not checked" gap carries a third, so a stacked bar stays readable without
 * colour vision. Every segment also names itself in the list underneath, which
 * is the real fallback.
 */
export function RateBar({ rung, total }: { rung: RungRate; total: number }) {
  const sum = rung.counts.reduce((acc, c) => acc + c.count, 0);
  const notChecked = Math.max(0, total - sum);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">
          <span className="font-mono text-muted">{rung.rung}</span> · {rung.name}
        </h3>
        <span className="text-sm text-muted">
          of {total.toLocaleString("en-US")} agents
        </span>
      </div>

      <div
        className="mt-2 flex h-4 w-full overflow-hidden rounded bg-bg"
        role="img"
        aria-label={`Rung ${rung.rung}, ${rung.name}: ${rung.counts
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
            className="bg-line bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,.18)_2px,rgba(255,255,255,.18)_4px)]"
            style={{ width: `${pct(notChecked)}%` }}
            title={`not checked: ${notChecked.toLocaleString("en-US")} — ${NOT_CHECKED_LABEL}`}
          />
        )}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        {rung.counts.map((c) => (
          <li key={c.status} className="tabular-nums">
            <span aria-hidden="true" className="mr-1 font-mono">
              {statusGlyph(c.status)}
            </span>
            {c.status}: {c.count.toLocaleString("en-US")} ({pct(c.count).toFixed(1)}%)
          </li>
        ))}
        {notChecked > 0 && (
          <li className="tabular-nums">
            <span aria-hidden="true" className="mr-1 font-mono">
              ·
            </span>
            not checked: {notChecked.toLocaleString("en-US")} (
            {pct(notChecked).toFixed(1)}%)
          </li>
        )}
      </ul>
    </div>
  );
}
