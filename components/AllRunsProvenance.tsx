import type { Run } from "@/lib/api/schemas";
import { chainDisplayName } from "@/lib/chains";
import { blockUrl } from "@/lib/links";
import { OutboundLink } from "./OutboundLink";
import { TextLink } from "./TextLink";

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
 *
 * The treatment: an outer edge around the whole block, 18px cells, the last
 * row's rule removed so the frame is not doubled at the bottom, and the row
 * brightening under the pointer. The bordered box is not a third exception
 * to "cards never get a border on all four sides" — a table is not a card.
 * The border is the table's own frame, the same thing a rule under a header
 * row already is, and it stops a twelve-row grid of hairlines from
 * dissolving into the page at its outer edge.
 */
export function AllRunsProvenance({ runs }: { runs: Run[] }) {
  /**
   * The widest bar in the column, so the bars are read against each other
   * rather than against a number nobody is shown.
   *
   * This is a division, and `lib/api/aggregate.ts` is strict that this app
   * formats rather than divides. It does not break that rule, because
   * nothing here is a published figure: no percentage is printed, no
   * denominator is claimed, and the geometry is thrown away at paint. It is
   * the same device — and the same justification — as the hero panel's own
   * per-chain bars in `app/page.tsx`. The one difference is the denominator:
   * the hero divides by the total population, because there the bars are
   * segments OF that total; here each row is compared to the largest single
   * chain, because this column is read DOWN — the question it answers is how
   * the chains stand against each other, not what share of the total each
   * one holds. It also keeps the smallest chains visible as slivers instead
   * of rounding to nothing: against a four-chain total, the smallest
   * contributor would paint a bar under a pixel wide.
   *
   * `|| 1` guards the empty/all-null case: a zero denominator would paint
   * every bar `NaN%`, which browsers drop, silently losing the column.
   */
  const widest =
    Math.max(0, ...runs.map((r) => r.agent_count ?? 0)) || 1;

  const CELL = "border-b border-line px-[1.125rem] py-3";
  const HEAD =
    "label border-b border-edge px-[1.125rem] py-3 font-medium";

  return (
    /* Four mono columns have a min-content width wider than a 390px phone, and
       a table that cannot shrink makes the PAGE scroll sideways — which on the
       homepage means the headline itself runs off the screen. The table scrolls
       inside its own box instead; the body never does. */
    <div className="overflow-x-auto border border-edge">
      <table
        className="w-full min-w-[40rem] border-collapse text-left font-mono text-[0.8125rem]
                   [&_tbody_tr:hover_td]:text-text
                   [&_tbody_tr:last-child_td]:border-b-0"
      >
        <caption className="sr-only">
          The completed sweep behind each chain in the figures above
        </caption>
        <thead>
          <tr>
            <th scope="col" className={HEAD}>
              chain
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              agents
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              pinned block
            </th>
            <th scope="col" className={HEAD}>
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
                {/* `relative`, so the bar can be pinned to the cell's own
                    bottom edge rather than pushing the row taller. */}
                <td className={`${CELL} relative text-text`}>
                  {/* The chain name links to its own single-chain view — the
                      row is also the way into the number behind it. No
                      underline at rest: `AgentTable` already uses exactly
                      this treatment, for the reason that applies here too —
                      in a table where every row is navigable, twelve
                      underlines are noise rather than an affordance, and the
                      pointer reveals the one that matters. Prose links are
                      untouched; see `TextLink`. */}
                  <TextLink
                    href={`/?chain=${encodeURIComponent(run.chain)}`}
                    tone="inherit"
                    className="!decoration-transparent hover:!decoration-accent"
                  >
                    {chainDisplayName(run.chain)}
                  </TextLink>
                  {/* The hero panel names chains for reading ("BNB Chain");
                      this table also names them for machine identity ("bsc").
                      Same chains, told apart two ways on one page — the slug
                      is a caption under the name a reader recognises, not the
                      only label, which is what it was before this change. */}
                  <span className="mt-px block text-[0.6875rem] text-dead">
                    {run.chain}
                  </span>
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-0.5 bg-accent/70"
                    style={{
                      width: `${((run.agent_count ?? 0) / widest) * 100}%`,
                    }}
                  />
                </td>
                <td className={`${CELL} text-right text-muted`}>
                  {run.agent_count !== null
                    ? run.agent_count.toLocaleString("en-US")
                    : "—"}
                </td>
                <td className={`${CELL} text-right text-muted`}>
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
                {/* The run id, linked to the archive that carries it: an id
                    printed as dead text beside a page whose whole claim is
                    "download the run yourself" was the one fact on this row
                    with no way in. */}
                <td className={`${CELL} text-dead`}>
                  <TextLink href="/data" tone="inherit">
                    {run.run_id.slice(0, 8)}
                  </TextLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
