import Link from "next/link";
import type { AgentSummary } from "@/lib/api/schemas";
import { addressUrl } from "@/lib/links";
import { OutboundLink } from "./OutboundLink";
import { RungStrip } from "./RungStrip";

/**
 * `0x1a2b…f029` — the shape every wallet and explorer already shows an
 * address in, so a shortened one reads as familiar rather than as a cut this
 * site invented. Only the VISIBLE text is shortened: the full address still
 * reaches a reader in the `title` tooltip and, for owners with a recognised
 * chain, in the explorer link's own `href` — so nothing here makes an address
 * harder to check against anything, only faster to tell apart from its
 * neighbours in the column above and below it.
 */
function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * The directory, set as a ledger.
 *
 * Rows are tight (28px), separated by hairlines rather than boxed — the
 * header is a row of micro-labels, not a heavier band, so the data stays the
 * darkest thing on the page.
 *
 * ## Three columns, not four
 *
 * The id used to be its own right-aligned column. It is metadata about the
 * row, not a second thing to track left-to-right beside the name and the
 * owner, so it now sits inline after the name instead — dim, small, and
 * omitted entirely when the name itself IS the id (the no-name fallback
 * below already says "Agent #<id>", and repeating the id a second time next
 * to itself would say nothing new). Fewer columns to sweep across is the
 * same density argument the short address below makes.
 *
 * ## Identity
 *
 * The name comes from the document, via `agent_documents` (migration 0012).
 * `Agent #<id>` is the fallback and ONLY the fallback — for the ~0.7% of
 * parseable documents with no usable name, and for every agent whose document
 * never resolved or parsed at all.
 *
 * A missing name is not a judgement and must not read as one: an agent can be
 * perfectly conformant and simply not have been fetched successfully this run.
 * So the fallback is set in the same size as a real name, just dimmer and in
 * mono (it is an id, after all) — with no icon, badge or warning attached.
 *
 * Identity is never the URI, which is frequently a multi-kilobyte base64 blob
 * or an empty string.
 */
export function AgentTable({ agents }: { agents: AgentSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {/* The name column absorbs the slack, so the rung register lands
                flush against the right edge however wide the viewport is —
                without it, a three-column table on a 1680px monitor leaves a
                third of the page empty and the layout reads as unfinished. */}
            <th scope="col" className="label w-full border-b border-edge px-3 py-2 font-normal">
              Agent
            </th>
            <th
              scope="col"
              className="label whitespace-nowrap border-b border-edge px-3 py-2 font-normal"
            >
              Owner
            </th>
            <th
              scope="col"
              className="label whitespace-nowrap border-b border-edge px-3 py-2 font-normal"
            >
              {/* One hop to the full vocabulary, for a reader who does not
                  want to hover 350 individual cells to learn what each
                  position means — the popover on every cell (see
                  `RungStrip.tsx`) still covers the reader who does. */}
              <Link
                href="/methodology"
                className="underline decoration-line underline-offset-4 transition-colors hover:text-muted hover:decoration-muted"
              >
                Checks 1–7
              </Link>
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr
              key={`${a.chain}/${a.agent_id}`}
              className="border-b border-line/70 transition-colors hover:bg-raised"
            >
              <td className="px-3 py-1.5">
                <Link
                  href={`/agent/${a.chain}/${a.agent_id}`}
                  className="text-sm text-text underline decoration-transparent underline-offset-4 transition-colors hover:decoration-edge"
                >
                  {a.name ?? (
                    <span className="font-mono text-xs text-dead">
                      Agent #{a.agent_id}
                    </span>
                  )}
                </Link>
                {a.name && (
                  <span className="ml-2 font-mono text-xs text-dead">
                    #{a.agent_id}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-dead">
                {(() => {
                  const href = addressUrl(a.chain, a.owner);
                  const short = shortAddress(a.owner);
                  return href ? (
                    <OutboundLink href={href} title={a.owner}>
                      {short}
                    </OutboundLink>
                  ) : (
                    <span title={a.owner}>{short}</span>
                  );
                })()}
              </td>
              <td className="whitespace-nowrap px-3 py-1.5">
                <RungStrip rungs={a.rungs} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
