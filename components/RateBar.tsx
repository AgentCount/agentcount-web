import type { RungRate } from "@/lib/api/schemas";
import { statusBgClasses } from "@/lib/status";

/**
 * One rung's population rates: a stacked bar plus the numbers behind it.
 * This is the finding — /stats leads with it, and the table underneath is
 * the appendix, not the other way round.
 *
 * `counts` never sums to the run's `agent_count` for every rung: a rung
 * short-circuited by an earlier failure (rung 2 errors, so rung 3 gets a
 * `skipped` row, but rung 4 gets no row at all for that agent) means fewer
 * agents were even asked this question. The gap between `total` and the sum
 * of `counts` is rendered as its own "not checked" segment rather than
 * silently inflating whichever status happens to render widest — leaving it
 * out would let a rung nobody reached look like it mostly passed.
 */
export function RateBar({ rung, total }: { rung: RungRate; total: number }) {
  const sum = rung.counts.reduce((acc, c) => acc + c.count, 0);
  const notChecked = Math.max(0, total - sum);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Rung {rung.rung}</h3>
        <span className="text-sm text-muted">of {total.toLocaleString("en-US")} agents</span>
      </div>
      <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-bg">
        {rung.counts.map((c) => (
          <div
            key={c.status}
            className={statusBgClasses(c.status)}
            style={{ width: `${pct(c.count)}%` }}
            title={`${c.status}: ${c.count.toLocaleString("en-US")}`}
          />
        ))}
        {notChecked > 0 && (
          <div
            className="border-line bg-line bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(0,0,0,.25)_3px,rgba(0,0,0,.25)_6px)]"
            style={{ width: `${pct(notChecked)}%` }}
            title={`not checked: ${notChecked.toLocaleString("en-US")}`}
          />
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        {rung.counts.map((c) => (
          <li key={c.status}>
            {c.status}: {c.count.toLocaleString("en-US")} ({pct(c.count).toFixed(1)}%)
          </li>
        ))}
        {notChecked > 0 && (
          <li>
            not checked: {notChecked.toLocaleString("en-US")} ({pct(notChecked).toFixed(1)}%)
          </li>
        )}
      </ul>
    </div>
  );
}
