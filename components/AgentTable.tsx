import Link from "next/link";
import type { AgentSummary } from "@/lib/api/schemas";
import { RungStrip } from "./RungStrip";

/**
 * The directory, set as a ledger.
 *
 * Rows are tight (28px), separated by hairlines rather than boxed, and the
 * numeric columns are right-aligned with tabular figures so ids and blocks
 * form clean vertical edges when you scan 50 of them. The header is a row of
 * micro-labels, not a heavier band — the data should be the darkest thing on
 * the page.
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
                without it, a four-column table on a 1680px monitor leaves a
                third of the page empty and the layout reads as unfinished. */}
            <th scope="col" className="label w-full border-b border-edge px-3 py-2 font-normal">
              Agent
            </th>
            <th
              scope="col"
              className="label whitespace-nowrap border-b border-edge px-3 py-2 text-right font-normal"
            >
              Id
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
              Rungs 1–7
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
                    <span className="font-mono text-[0.8125rem] text-dead">
                      Agent #{a.agent_id}
                    </span>
                  )}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right font-mono text-[0.8125rem] text-muted">
                {a.agent_id}
              </td>
              {/* The full address, not a truncation: there is room for all 42
                  characters once the name column takes the slack, and a
                  half-address is not something a reader can check against
                  anything. */}
              <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[0.8125rem] text-dead">
                {a.owner}
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
