import { MiniPanel } from "@/components/MiniPanel";
import { OutboundLink } from "@/components/OutboundLink";
import { Section } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import { CORE_REPO } from "@/lib/reports";
import {
  getPublishedRuns,
  archiveSize,
  archiveUrl,
  checksumUrl,
} from "@/lib/published-runs";

export const metadata = {
  title: "Data",
  description:
    "Every canonical run of the census, downloadable in full. Free, no account, no key, no rate limit. CC BY 4.0, with a sha256 committed to git for each archive.",
};

const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));

/**
 * The downloads page.
 *
 * Static, and reading a committed file rather than the API — deliberately.
 * A downloads page that fails when the API is down fails exactly when someone
 * most wants the raw data, and the archive hashes are a git artifact that no
 * API can honestly serve anyway (see `lib/published-runs.ts`).
 */
export default async function DataPage() {
  // Read from the core repo, falling back to the committed copy — so a run
  // published this morning is downloadable from this page this morning, not
  // after someone remembers to copy a file across repositories.
  const runs = await getPublishedRuns();

  // Panel-only arithmetic, same standing as the widths of the homepage's
  // population-share bar (see `app/page.tsx`'s own comment): these three
  // figures are not a second implementation of a published claim, they're a
  // box summarising numbers the table right below already prints per row.
  // ONE RUN PER CHAIN, not one per archive. Summing every published run
  // counts the same agents once per sweep: the index holds 21 archives across
  // 11 chains, so the naive sum reads 1,211,191 where the population is
  // 439,681 — 2.75x, and contradicting the homepage on the same site. The
  // archive count and byte total below ARE per-archive and stay that way.
  const newestPerChain = new Map<string, (typeof runs)[number]>();
  for (const r of runs) {
    const held = newestPerChain.get(r.chain);
    // `finished_at` is nullable on the type; a run without one cannot be the
    // newest, and an unfinished run has nothing to contribute here anyway.
    if (!r.finished_at) continue;
    if (!held?.finished_at || r.finished_at > held.finished_at) {
      newestPerChain.set(r.chain, r);
    }
  }
  const totalSwept = [...newestPerChain.values()].reduce(
    (s, r) => s + (r.swept ?? 0),
    0,
  );
  const totalBytes = runs.reduce((s, r) => s + r.archive_bytes, 0);
  const schemaVersions = runs.map((r) => r.schema_version);
  const minSchema = Math.min(...schemaVersions);
  const maxSchema = Math.max(...schemaVersions);
  const schemaRange = minSchema === maxSchema ? `schema v${minSchema}` : `schema v${minSchema}–v${maxSchema}`;

  return (
    <>
      {/* Two-column page-head: intro left, a stat box right — the same
          split the homepage hero uses for its own header/panel pair, at
          companion-page scale. The three totals summarising the archives
          land beside the paragraphs setting out what "canonical" means,
          rather than after several screens of prose a reader would have to
          scroll past to learn how much data there is. Single column under
          `lg`, where two would leave neither half a usable measure. See
          `MiniPanel.tsx`. */}
      <header className="border-b border-edge pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-x-12">
        <div>
          <h1 className="headline text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">Data</h1>
          {/* The canonicality rule, stated publicly because the site's own
              headline now depends on it. It cannot live only in a code comment:
              a reader checking our numbers needs to know which runs we are
              willing to quote, and why some sweeps are not among them. */}
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
            <span className="text-text">
              A run is canonical if, and only if, its archive and sha256 are
              committed to{" "}
              <code className="font-mono text-xs">published-runs.json</code>.
            </span>{" "}
            That commit is the definition, not a description of one: the census
            also runs proof sweeps of a few hundred agents, and the API records
            them the same way it records a full sweep, with no field telling the
            two apart. Publication is the act that distinguishes them. Every
            figure on this site&rsquo;s front page is summed from the runs listed
            below and from no others — so a sweep that has finished but is not
            yet published is deliberately not quoted anywhere, and the front page
            is a little behind rather than briefly wrong.
          </p>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
            Every canonical run, downloadable in full. No account, no key, no rate
            limit, no email gate. One URL per run, and the bytes at that URL never
            change — a run is a dated measurement, and an archive that quietly
            became something else would destroy the only thing publishing it is
            for.
          </p>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
            This project&rsquo;s claim is that every number it publishes can be
            recomputed by someone else. That claim is only true if the inputs are
            actually downloadable — a census you have to ask for is a census you
            have to take on trust.
          </p>
        </div>
        <MiniPanel
          className="mt-6 lg:mt-0"
          label={`Agents across ${newestPerChain.size} chains`}
          count={totalSwept}
          foot={
            <>
              <span>{archiveSize(totalBytes)} total</span>
              <span>{schemaRange}</span>
            </>
          }
        />
      </header>

      <Section
        title="Published runs"
        aside={`${runs.length} archives`}
        className="mt-12"
        intro={
          <>
            <code className="font-mono text-xs text-text">schema</code> is the
            evidence contract the run was written under — it is not decoration,
            and a tool reading across versions has to branch on it. Rung 6 did
            not exist before version 7.
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.8125rem]">
            <thead>
              <tr>
                {["chain", "run", "pinned block", "agents", "schema", "checker", "size", ""].map(
                  (h, i) => (
                    <th
                      key={h || i}
                      scope="col"
                      className={`label whitespace-nowrap border-b border-edge px-3 py-2 font-normal ${
                        ["pinned block", "agents", "size"].includes(h) ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {/* `hover:bg-raised` on the row — the same scan aid
                  `AgentTable.tsx` gives its own rows — even though only
                  the last cell here actually links: a reader scanning
                  down a run they might download benefits from the same
                  "this is the row under your cursor" feedback whether
                  one cell is a link or three are. */}
              {runs.map((r) => (
                <tr key={r.run_id} className="transition-colors hover:bg-raised">
                  <td className="border-b border-line px-3 py-2 font-mono text-muted">
                    {r.chain}
                  </td>
                  <td className="border-b border-line px-3 py-2 font-mono text-dead">
                    {r.run_id.slice(0, 8)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {num(r.pinned_block)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-text">
                    {num(r.swept)}
                  </td>
                  <td className="border-b border-line px-3 py-2 font-mono text-muted">
                    {r.schema_version}
                  </td>
                  <td className="border-b border-line px-3 py-2 font-mono text-muted">
                    {r.checker_version}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {archiveSize(r.archive_bytes)}
                  </td>
                  <td className="whitespace-nowrap border-b border-line px-3 py-2">
                    <OutboundLink href={archiveUrl(r)} className="font-mono text-xs">
                      .tar.zst
                    </OutboundLink>
                    <span className="px-2 text-line">·</span>
                    <OutboundLink href={checksumUrl(r)} className="font-mono text-xs text-dead">
                      sha256
                    </OutboundLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Provenance, per run"
        aside="citable"
        className="mt-16"
        intro={
          <>
            Everything needed to cite a figure or reproduce a run. The hash is
            also committed to{" "}
            <OutboundLink href={`${CORE_REPO}/blob/main/published-runs.json`}>
              <code className="font-mono text-xs">published-runs.json</code>
            </OutboundLink>{" "}
            in the core repository, so the git history attests the archives and
            not only the numbers taken from them.
          </>
        }
      >
        <div className="space-y-8">
          {runs.map((r) => (
            <div key={r.run_id} className="border-l-2 border-edge pl-5">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-xs text-dead">
                <span className="text-muted">{r.chain}</span>
                <span className="text-line">|</span>
                <span className="break-all">{r.run_id}</span>
                {r.finished_at && (
                  <>
                    <span className="text-line">|</span>
                    <time dateTime={r.finished_at}>{r.finished_at.slice(0, 10)}</time>
                  </>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-[9rem_1fr]">
                {(
                  [
                    ["pinned block", num(r.pinned_block)],
                    ["agents swept", num(r.swept)],
                    ["unreadable", r.unreadable === null ? "unknown (rebuilt export)" : num(r.unreadable)],
                    ["unwritable", r.unwritable === null ? "unknown (rebuilt export)" : num(r.unwritable)],
                    ["schema version", String(r.schema_version)],
                    // The commit is shortened; the `-dirty` marker is not.
                    // Truncating it off once made this page silently claim a
                    // clean build the homepage was honestly reporting as
                    // dirty — the same run, two stories, on one site.
                    [
                      "checker",
                      `${r.checker_version} @ ${r.checker_commit.slice(0, 12)}${
                        r.checker_commit.endsWith("-dirty") ? "-dirty" : ""
                      }`,
                    ],
                    ...(r.rebuilt_at
                      ? ([["archive rebuilt", r.rebuilt_at.slice(0, 10)]] as [
                          string,
                          string,
                        ][])
                      : []),
                    ["spec commit", r.spec_commit.slice(0, 12)],
                    ["sha256", r.archive_sha256],
                    ["rerun", r.rerun_command],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="label border-t border-line py-2 sm:pr-4">{k}</dt>
                    <dd className="break-all border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        {/* `unreadable`/`unwritable` reading "unknown" is not a gap in the page
            — it is the manifest being honest. Those counts live in the
            sweeping process and are never stored, so a run rebuilt from the
            database cannot recover them, and writing zero would assert that
            nothing was lost. */}
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted">
          <span className="text-text">On &ldquo;unknown&rdquo;:</span> these four
          archives were rebuilt from the database, because they were swept
          before anything published exports. The counts of agents that could not
          be read or could not be written are held in the sweeping process and
          never stored, so a rebuild genuinely does not know them — and{" "}
          <span className="text-text">zero would be a claim that nothing was
          lost</span>. Runs published from now on carry the real figures.
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          <span className="text-text">On the checker line:</span> a commit
          ending in <code className="font-mono text-xs">-dirty</code>{" "}
          means the
          sweep was built from a tree with uncommitted changes. The stamp is
          honest and stays displayed; the standing policy since 2026-08-02 is
          that canonical runs are swept from clean commits only. Separately,
          the four rebuilt archives&rsquo; internal manifests overstate their
          schema and checker versions — they carry the 2026-08-01 rebuild
          era&rsquo;s values, not the sweep&rsquo;s. The figures on this page
          and the API are the sweep-time record; where an archive manifest
          disagrees with them, the database is authoritative. The full
          correction is logged in the core repository&rsquo;s methodology
          changelog.
        </p>
      </Section>

      <Section title="Using it" aside="CC BY 4.0" className="mt-16 max-w-3xl">
        <pre className="overflow-x-auto border-l-2 border-edge bg-panel px-5 py-4 font-mono text-xs leading-relaxed text-muted">
{`run=${runs[0]?.run_id ?? "<run_id>"}
curl -LO https://storage.googleapis.com/agentcount-data/runs/$run.tar.zst
curl -LO https://storage.googleapis.com/agentcount-data/runs/$run.tar.zst.sha256
shasum -a 256 -c $run.tar.zst.sha256
tar --zstd -xf $run.tar.zst`}
        </pre>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Released under{" "}
          <OutboundLink href="https://creativecommons.org/licenses/by/4.0/">
            CC BY 4.0
          </OutboundLink>{" "}
          — use it for anything, including commercially. The one condition is
          attribution: cite AgentCount and the{" "}
          <code className="font-mono text-xs text-text">run_id</code> you used,
          because a figure without a run id cannot be re-derived by whoever
          reads your work next.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          <OutboundLink href={`${CORE_REPO}/blob/main/DATA.md`}>
            <code className="font-mono text-xs">DATA.md</code>
          </OutboundLink>{" "}
          documents what is in an archive, every schema version, the two
          categories of personal data an archive contains, and a worked example
          re-deriving a published headline from a download.
        </p>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <TextLink href="/reports" tone="bright">The reports →</TextLink>
          <TextLink href="/methodology" tone="bright">What each check measures →</TextLink>
        </p>
      </Section>
    </>
  );
}
