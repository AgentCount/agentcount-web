import publishedRuns from "@/content/published-runs.json";

/**
 * The published run archives.
 *
 * ## Why this is a committed file and not an API call
 *
 * Every field here except the archive's hash and size comes from the run's own
 * manifest, which the API could serve. The hash cannot: it is written by
 * `scripts/publish-run.sh` in the core repository and committed there, and
 * that is the entire point of it. A hash served by the same system that serves
 * the archive attests nothing — the value of the number is that it sits in a
 * git history, in a commit that predates any dispute about what an archive
 * contained.
 *
 * So the source of truth is `published-runs.json` in the core repo, and this
 * is a copy, published the same way `content/reports/` is. It goes stale only
 * when a run is published without this being updated, which is one line in the
 * same commit.
 *
 * The counts and provenance ARE also available from `/api/runs`, and this page
 * deliberately does not fetch them: a downloads page that fails when the API
 * is down is a downloads page that fails exactly when someone most wants the
 * raw data.
 */
export type PublishedRun = {
  run_id: string;
  chain: string;
  pinned_block: number;
  started_at: string;
  finished_at: string | null;
  schema_version: number;
  checker_version: string;
  checker_commit: string;
  spec_commit: string;
  rerun_command: string;
  agent_count: number | null;
  swept: number | null;
  /** `null` on a rebuilt export — see `DATA.md`. Never zero by default. */
  unreadable: number | null;
  unwritable: number | null;
  archive: string;
  archive_bytes: number;
  archive_sha256: string;
};

export const PUBLISHED_RUNS = publishedRuns as PublishedRun[];

/** Where the archives live. One URL per run, immutable once written. */
export const DATA_HOST = "https://storage.googleapis.com/agentcount-data";

export function archiveUrl(run: PublishedRun): string {
  return `${DATA_HOST}/runs/${run.archive}`;
}

export function checksumUrl(run: PublishedRun): string {
  return `${archiveUrl(run)}.sha256`;
}

/** The archive for a run, if it has been published. */
export function publishedRun(runId: string): PublishedRun | undefined {
  return PUBLISHED_RUNS.find((r) => r.run_id === runId);
}

/**
 * Bytes as MB, one decimal.
 *
 * Deliberately not a `prettyBytes` that switches units: every archive here is
 * between 3 and 24 MB, and a column that reads `3.5 MB` / `24 MB` compares at
 * a glance in a way `3.5 MB` / `23.9 MB` / `997 kB` does not.
 */
export function archiveSize(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
