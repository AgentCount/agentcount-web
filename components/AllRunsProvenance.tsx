import Link from "next/link";
import type { Run } from "@/lib/api/schemas";
import { blockUrl } from "@/lib/links";
import { OutboundLink } from "./OutboundLink";

/**
 * The sweeps behind an all-chains figure, one row each.
 *
 * The per-chain page can afford `RunProvenance`'s full two-column register
 * because it has exactly one run to describe. The all-chains view has one per
 * chain, and four of those registers stacked would bury the findings under
 * thirty-two rows of machine values.
 *
 * So this is the compact form: the four facts that qualify an aggregate —
 * which chain, how many agents it contributed, which block it was pinned to,
 * and which run said so. Everything else about a run stays one click away on
 * /data, which exists to carry it.
 *
 * It is a table rather than a list because these rows are meant to be
 * compared down the columns: the population column is the whole argument for
 * why a population-weighted rate differs from the average of four chains.
 */
export function AllRunsProvenance({ runs }: { runs: Run[] }) {
  return (
    /* Four mono columns have a min-content width wider than a 390px phone, and
       a table that cannot shrink makes the PAGE scroll sideways — which on the
       homepage means the headline itself runs off the screen. The table scrolls
       inside its own box instead; the body never does. */
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[30rem] max-w-3xl border-collapse text-left">
        <caption className="sr-only">
          The completed sweep behind each chain in the figures above
        </caption>
        <thead>
          <tr>
            <th scope="col" className="label border-b border-line pb-2 pr-4">
              chain
            </th>
            <th
              scope="col"
              className="label border-b border-line pb-2 pr-4 text-right"
            >
              agents
            </th>
            <th
              scope="col"
              className="label border-b border-line pb-2 pr-4 text-right"
            >
              pinned block
            </th>
            <th scope="col" className="label border-b border-line pb-2">
              run
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const blockHref =
              run.pinned_block !== null
                ? blockUrl(run.chain, run.pinned_block)
                : null;
            return (
              <tr key={run.run_id}>
                <td className="border-b border-line py-2 pr-4 font-mono text-xs text-text">
                  {/* The chain name links to its own single-chain view — the
                    row is also the way into the number behind it. */}
                  <Link
                    href={`/?chain=${encodeURIComponent(run.chain)}`}
                    className="underline decoration-line underline-offset-4 transition-colors hover:decoration-edge"
                  >
                    {run.chain}
                  </Link>
                </td>
                <td className="border-b border-line py-2 pr-4 text-right font-mono text-xs text-muted">
                  {run.agent_count !== null
                    ? run.agent_count.toLocaleString("en-US")
                    : "—"}
                </td>
                <td className="border-b border-line py-2 pr-4 text-right font-mono text-xs text-muted">
                  {run.pinned_block === null ? (
                    "—"
                  ) : blockHref ? (
                    <OutboundLink href={blockHref}>
                      {run.pinned_block.toLocaleString("en-US")}
                    </OutboundLink>
                  ) : (
                    run.pinned_block.toLocaleString("en-US")
                  )}
                </td>
                <td className="border-b border-line py-2 font-mono text-xs text-dead">
                  {run.run_id.slice(0, 8)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
