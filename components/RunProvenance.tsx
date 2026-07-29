import type { Run } from "@/lib/api/schemas";

/**
 * Everything needed to reproduce a run, as a definition list.
 *
 * This is the whole argument for the census: a result you cannot recompute is
 * an opinion, and a result you can is a fact. The pinned block, the checker
 * commit, the spec commit and the literal rerun command are what let a reader
 * disagree with a number by rerunning it rather than by taking our word.
 *
 * Timestamps are printed exactly as the API sent them — RFC 3339, UTC. Not
 * localised, not turned into "3 hours ago": the whole point of a pinned run is
 * that it names an instant, and a relative time silently re-anchors it to
 * whenever the page happened to be rendered.
 */
export function RunProvenance({ run }: { run: Run }) {
  // Plain strings, not JSX: every value here is a hash, an id, a timestamp or
  // a command, so they all render identically (monospace, breakable) and none
  // needs its own markup.
  const rows: [string, string][] = [
    ["run id", run.run_id],
    ["chain", run.chain],
    [
      "pinned block",
      run.pinned_block !== null ? run.pinned_block.toLocaleString("en-US") : "—",
    ],
    ["agents", run.agent_count !== null ? run.agent_count.toLocaleString("en-US") : "—"],
    ["started", run.started_at],
    ["finished", run.finished_at ?? "—"],
    ["checker version", run.checker_version],
    ["checker commit", run.checker_commit],
    ["spec commit", run.spec_commit],
    ["rerun command", run.rerun_command],
  ];

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="break-all font-mono text-xs leading-relaxed">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
