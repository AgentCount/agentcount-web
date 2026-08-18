import type { Delta, Run } from "@/lib/api/schemas";
import { chainDisplayName } from "@/lib/chains";

/**
 * What changed since the previous sweep, one chain per row.
 *
 * The columns are the four delta series (METHODOLOGY §9), plus the volume
 * the two reachability series exclude. Two rules from the methodology are
 * enforced here rather than remembered:
 *
 * * A chain whose run has no stored delta renders "first sweep — nothing to
 *   compare", never a row of zeroes: absence is not a measurement.
 * * A pair the checker or evidence schema changed across is marked on the
 *   row and explained under the table — an unknown share of that row's
 *   movement is method, not the world, and the reader is told so in the
 *   same glance as the number.
 *
 * Every figure is a population count computed at sweep time by the census;
 * this component formats and never derives. "No longer reachable" is the
 * plain-English rendering of `stopped_resolving` — check 2 (Reachable?)
 * moved from pass to not-pass — and stays honest because transitions where
 * the origin *declined* the probe are already excluded upstream and shown
 * in their own column.
 */
export function DeltaLedger({
  rows,
}: {
  rows: { run: Run; delta: Delta | null }[];
}) {
  const methodChangedRows = rows.filter(({ delta }) => delta?.method_changed);
  const number = (n: number) =>
    n === 0 ? (
      <span className="text-dead">0</span>
    ) : (
      n.toLocaleString("en-US")
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th scope="col" className="label w-full border-b border-edge px-3 py-2 font-normal">
              Chain
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              New
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Gone
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              No longer reachable
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Reachable again
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Declined&thinsp;†
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ run, delta }) => (
            <tr key={run.run_id} className="border-b border-line/70">
              <td className="px-3 py-1.5 font-mono text-xs text-muted">
                {chainDisplayName(run.chain)}
                {delta?.method_changed && (
                  <span className="ml-2 text-dead">‡ method changed</span>
                )}
              </td>
              {delta ? (
                <>
                  <td className="px-3 py-1.5 text-right font-mono text-xs tabular-nums text-text">
                    {number(delta.newly_registered)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs tabular-nums text-text">
                    {number(delta.disappeared)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs tabular-nums text-text">
                    {number(delta.stopped_resolving)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs tabular-nums text-text">
                    {number(delta.newly_resolving)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs tabular-nums text-dead">
                    {delta.rung2_declined.toLocaleString("en-US")}
                  </td>
                </>
              ) : (
                <td colSpan={5} className="px-3 py-1.5 font-mono text-xs text-dead">
                  first sweep — nothing to compare
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 space-y-1.5 text-[0.6875rem] leading-relaxed text-dead">
        <p>
          † Check 2 (Reachable?) transitions where the origin declined the
          probe — a rate limit, an auth or payment challenge, a robots.txt
          that said no. Excluded from both reachability columns by rule: being
          declined is not the agent having gone away, and getting through
          after being declined is not the agent having come back.
        </p>
        {methodChangedRows.length > 0 && (
          <p>
            ‡{" "}
            {methodChangedRows
              .map(({ delta }) =>
                delta!.checker_before === delta!.checker_after
                  ? `evidence schema ${delta!.schema_before} → ${delta!.schema_after}`
                  : `checker ${delta!.checker_before} → ${delta!.checker_after}`,
              )
              .filter((v, i, a) => a.indexOf(v) === i)
              .join("; ")}{" "}
            across the pair — an unknown share of that row&rsquo;s movement is
            a change of method, not a change in the world.
          </p>
        )}
      </div>
    </div>
  );
}
