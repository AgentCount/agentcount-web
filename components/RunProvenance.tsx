import type { Run } from "@/lib/api/schemas";
import { blockUrl } from "@/lib/links";
import { archiveSize, archiveUrl, checksumUrl, publishedRun } from "@/lib/published-runs";
import { OutboundLink } from "./OutboundLink";
import { TextLink } from "./TextLink";

/**
 * Everything needed to reproduce a run, as a two-column register.
 *
 * This is the whole argument for the census: a result you cannot recompute is
 * an opinion, and a result you can is a fact. The pinned block, the checker
 * commit, the spec commit and the literal rerun command are what let a reader
 * disagree with a number by rerunning it rather than by taking our word.
 *
 * Set as label/value rows on hairlines, every value in mono — because every
 * value here was produced by a machine. The rerun command gets its own block
 * at the end, since it is the one thing on the page a reader is meant to copy.
 *
 * Timestamps are printed exactly as the API sent them — RFC 3339, UTC. Not
 * localised, not turned into "3 hours ago": the whole point of a pinned run is
 * that it names an instant, and a relative time silently re-anchors it to
 * whenever the page happened to be rendered.
 */
export function RunProvenance({ run }: { run: Run }) {
  const blockHref =
    run.pinned_block !== null ? blockUrl(run.chain, run.pinned_block) : null;
  const archive = publishedRun(run.run_id);

  const rows: [string, string][] = [
    ["run", run.run_id],
    ["chain", run.chain],
    [
      "pinned block",
      run.pinned_block !== null ? run.pinned_block.toLocaleString("en-US") : "—",
    ],
    ["agents", run.agent_count !== null ? run.agent_count.toLocaleString("en-US") : "—"],
    ["started", run.started_at],
    ["finished", run.finished_at ?? "—"],
    ["checker", `${run.checker_version} · ${run.checker_commit}`],
    ["spec commit", run.spec_commit],
  ];

  return (
    <div>
      <dl className="grid grid-cols-1 sm:grid-cols-[9.5rem_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="label border-t border-line py-2 sm:pr-4">{label}</dt>
            <dd className="break-all border-line pb-2 font-mono text-xs leading-relaxed text-muted sm:border-t sm:py-2">
              {label === "pinned block" && blockHref ? (
                <OutboundLink href={blockHref}>{value}</OutboundLink>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 border-t border-line pt-3">
        <span className="label">Reproduce</span>
        <pre className="mt-2 overflow-x-auto border-l-2 border-edge bg-panel px-3 py-2 font-mono text-xs text-text">
          {run.rerun_command}
        </pre>
      </div>
      {/* The dump, where this run has one.

          Rerunning the command above re-derives the answers from the chain,
          which is the strongest check and also the slowest — it needs an RPC
          endpoint, hours, and the same code. The archive is the other half of
          the same promise: the exact rows this run wrote, at a permanent URL,
          checkable against a hash committed to git. Most people who want to
          disagree with a number want the second one.

          Absent for a run not yet published, rather than a dead link. */}
      {archive && (
        <div className="mt-4 border-t border-line pt-3">
          <span className="label">Download this run</span>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs text-dead">
            <OutboundLink href={archiveUrl(archive)}>{archive.archive}</OutboundLink>
            <span>{archiveSize(archive.archive_bytes)}</span>
            <span className="text-line">|</span>
            <OutboundLink href={checksumUrl(archive)}>sha256</OutboundLink>
            <span className="text-line">|</span>
            <TextLink href="/data" tone="inherit">
              all runs
            </TextLink>
          </p>
        </div>
      )}
    </div>
  );
}
