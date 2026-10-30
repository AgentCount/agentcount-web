import type { SellerDelta } from "@/lib/api/schemas";

/**
 * Week-over-week churn in the x402 seller population.
 *
 * ## Why this table is the point
 *
 * Every other figure on this site can be reproduced by anyone willing to
 * crawl a catalog once. A snapshot says 3,983 sellers advertise paid
 * resources; a second crawl next week says a different number, and nobody can
 * tell whether the same businesses are behind it. Only an instrument that has
 * asked the same question every Thursday, kept the answers, and judged them
 * by one locked method can say that roughly a tenth of them are new — which
 * is a claim about how the market behaves rather than how large it is.
 *
 * That is the whole asset, and it was invisible: the rows have existed since
 * 2026-09-03 and nothing read them.
 *
 * ## What is a column and what is a caveat
 *
 * **Appeared** and **disappeared** are catalog facts — a seller we were newly
 * told about, or stopped being told about. **Went dark** is different and
 * gets its own column rather than being summed into "disappeared": a seller
 * that stopped answering is a business that may have failed, while one the
 * catalog dropped is only a business we stopped hearing about. Merging them
 * would publish the second as the first.
 *
 * The three exclusions are printed in the row that they qualify, not in a
 * footnote. `refused` is an origin declining us, `error` is ours, `unprobed`
 * is a question the sweep chose not to ask (METHODOLOGY §10.3). None is a
 * seller leaving, and a churn figure that absorbed them would be reporting
 * this census's own gaps as the market's behaviour — the one thing this
 * project exists not to do.
 *
 * A week whose method changed is marked, because churn measured across a
 * catalog addition is not churn in the world.
 */
export function SellerChurn({ deltas }: { deltas: SellerDelta[] }) {
  const num = (n: number) =>
    n === 0 ? <span className="text-dead">0</span> : n.toLocaleString("en-US");

  // Oldest first, so the table reads as a history rather than a feed.
  const rows = [...deltas].sort((a, b) =>
    a.computed_at.localeCompare(b.computed_at),
  );
  const anyMethodChanged = rows.some((d) => d.method_changed);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th scope="col" className="label border-b border-edge px-3 py-2 font-normal">
              Week
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Sellers
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Appeared
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Disappeared
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Went dark
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Came back
            </th>
            <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
              Not counted
            </th>
          </tr>
        </thead>
        <tbody className="font-mono text-[0.8125rem] tabular-nums">
          {rows.map((d) => {
            const excluded =
              d.excluded_refused + d.excluded_error + d.excluded_unprobed;
            return (
              <tr key={d.run_id} className="border-b border-line">
                <td className="px-3 py-2 text-muted">
                  {d.computed_at.slice(0, 10)}
                  {d.method_changed && (
                    <span className="ml-2 text-dead" title="the method changed between these two runs">
                      †
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-text">
                  {num(d.sellers_after)}
                </td>
                <td className="px-3 py-2 text-right text-text">{num(d.appeared)}</td>
                <td className="px-3 py-2 text-right text-text">
                  {num(d.disappeared)}
                </td>
                <td className="px-3 py-2 text-right text-text">{num(d.went_dark)}</td>
                <td className="px-3 py-2 text-right text-text">{num(d.came_back)}</td>
                <td
                  className="px-3 py-2 text-right text-dead"
                  title={`${d.excluded_refused} refused us, ${d.excluded_error} our own errors, ${d.excluded_unprobed} not asked`}
                >
                  {num(excluded)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 max-w-prose space-y-2 text-[0.875rem] leading-relaxed text-muted">
        <p>
          <strong className="font-semibold text-text">Went dark</strong> is kept
          apart from <strong className="font-semibold text-text">disappeared</strong>{" "}
          on purpose: one is a seller that stopped answering, the other is a
          seller the catalogs stopped listing. The first may be a business that
          failed; the second is only one we stopped being told about.
        </p>
        <p>
          <strong className="font-semibold text-text">Not counted</strong> is
          every seller excluded from the churn — an origin that declined us, an
          error of ours, or a question this sweep chose not to ask. None of
          them is a seller leaving, so none is counted as one.
        </p>
        {anyMethodChanged && (
          <p>
            † marks a week whose method changed. Churn measured across a
            catalog being added is not churn in the world, and the row says so
            rather than letting the number stand alone.
          </p>
        )}
      </div>
    </div>
  );
}
