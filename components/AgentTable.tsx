import Link from "next/link";
import type { AgentSummary } from "@/lib/api/schemas";
import { RungStrip } from "./RungStrip";

/**
 * The directory table. Dense rows, monospace for anything machine-generated.
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
 * So the fallback is rendered in the same weight as a real name, just muted,
 * with no icon or warning attached.
 *
 * Identity is never the URI, which is frequently a multi-kilobyte base64 blob
 * or an empty string.
 */
export function AgentTable({ agents }: { agents: AgentSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="border-b border-line px-3 py-2 font-semibold">
              Agent
            </th>
            <th scope="col" className="border-b border-line px-3 py-2 font-semibold">
              Id
            </th>
            <th scope="col" className="border-b border-line px-3 py-2 font-semibold">
              Owner
            </th>
            <th scope="col" className="border-b border-line px-3 py-2 font-semibold">
              Rungs 1–7
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={`${a.chain}/${a.agent_id}`} className="hover:bg-panel/60">
              <td className="border-b border-line px-3 py-1.5">
                <Link
                  href={`/agent/${a.chain}/${a.agent_id}`}
                  className="text-accent hover:underline"
                >
                  {a.name ?? (
                    <span className="text-muted">Agent #{a.agent_id}</span>
                  )}
                </Link>
              </td>
              <td className="border-b border-line px-3 py-1.5 font-mono text-xs tabular-nums text-muted">
                {a.agent_id}
              </td>
              <td className="border-b border-line px-3 py-1.5 font-mono text-xs text-muted">
                <span title={a.owner}>
                  {a.owner.slice(0, 10)}…{a.owner.slice(-4)}
                </span>
              </td>
              <td className="border-b border-line px-3 py-1.5">
                <RungStrip rungs={a.rungs} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
