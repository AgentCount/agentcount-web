import { z } from "zod";
import publishedRuns from "@/content/published-runs.json";
import { CORE_REPO } from "./reports";

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
 * So the source of truth is `published-runs.json` in the core repo. This file
 * used to be a hand-maintained copy of it, and that was a real hazard once the
 * homepage headline started depending on it: the weekly sweep commits the new
 * entry to the CORE repo and nothing propagated it here, so a fresh census
 * would have been published, archived and hashed while this site went on
 * quoting last week's runs — silently, with no failure anywhere.
 *
 * [`getPublishedRuns`] closes that: it reads the core repo's file directly,
 * and the committed copy below is the FALLBACK rather than the source. The
 * attestation argument above is unharmed, because the file is still being
 * served out of a git history — raw.githubusercontent serves the committed
 * blob, not something the API generated.
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

/**
 * The committed copy — the floor, not the source. See [`getPublishedRuns`].
 *
 * Anything that cannot await (an OG card's static metadata, a unit test) may
 * read this directly and will simply be as fresh as the last commit.
 */
export const PUBLISHED_RUNS = publishedRuns as PublishedRun[];

/** Mirrors the `PublishedRun` type above. Parsed, never trusted: this file is
 * fetched over the network, and a truncated or half-written response must fall
 * back rather than render a page full of `undefined`. */
const publishedRunSchema = z.object({
  run_id: z.string(),
  chain: z.string(),
  pinned_block: z.number(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  schema_version: z.number(),
  checker_version: z.string(),
  checker_commit: z.string(),
  spec_commit: z.string(),
  rerun_command: z.string(),
  agent_count: z.number().nullable(),
  swept: z.number().nullable(),
  unreadable: z.number().nullable(),
  unwritable: z.number().nullable(),
  archive: z.string(),
  archive_bytes: z.number(),
  archive_sha256: z.string(),
});

const publishedRunsSchema = z.array(publishedRunSchema);

/** The committed blob on the core repo's default branch. */
const SOURCE_URL = `${CORE_REPO.replace(
  "https://github.com/",
  "https://raw.githubusercontent.com/",
)}/main/published-runs.json`;

/**
 * The published runs, read from the core repository.
 *
 * ## Why a fetch, and why it is safe
 *
 * A run is canonical exactly when its archive and sha256 are committed to this
 * file — the rule `/data` states publicly and the homepage headline depends
 * on. That made the hand-maintained copy the one place where the site could go
 * quietly, indefinitely stale: the sweep publishes to the core repo, and
 * nothing here noticed.
 *
 * Reading the file directly means a newly published run reaches the headline
 * on its own, with no second commit and no cross-repo automation to forget.
 *
 * Three things keep this from being a new fragility:
 *
 *   * **It is not the API.** This is a different host serving a git blob, so
 *     the property this module was built for — a downloads page that still
 *     works when the census API is down — is untouched.
 *   * **It falls back.** Any failure, any timeout, any response that does not
 *     parse, and the committed copy is used instead. The page renders either
 *     way; the worst case is exactly the behaviour we had before.
 *   * **It is cached.** An hour's `revalidate`, because this file changes
 *     roughly weekly.
 */
export async function getPublishedRuns(): Promise<PublishedRun[]> {
  try {
    const res = await fetch(SOURCE_URL, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return PUBLISHED_RUNS;
    const parsed = publishedRunsSchema.safeParse(await res.json());
    // An empty list parses fine and would blank the census. Treat it as a bad
    // read: the core repo has never had zero published runs, and "no canonical
    // runs" is not a state this site should ever render from a network hiccup.
    if (!parsed.success || parsed.data.length === 0) return PUBLISHED_RUNS;
    return parsed.data;
  } catch {
    return PUBLISHED_RUNS;
  }
}

/** Where the archives live. One URL per run, immutable once written. */
export const DATA_HOST = "https://storage.googleapis.com/agentcount-data";

export function archiveUrl(run: PublishedRun): string {
  return `${DATA_HOST}/runs/${run.archive}`;
}

export function checksumUrl(run: PublishedRun): string {
  return `${archiveUrl(run)}.sha256`;
}

/** The archive for a run, if it has been published. Takes the list so a
 * caller that has already read the live one does not fall back to the
 * committed copy for this lookup alone. */
export function publishedRun(
  runId: string,
  runs: PublishedRun[] = PUBLISHED_RUNS,
): PublishedRun | undefined {
  return runs.find((r) => r.run_id === runId);
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
