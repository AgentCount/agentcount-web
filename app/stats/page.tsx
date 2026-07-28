import { RateBar } from "@/components/RateBar";
import { StatTile } from "@/components/StatTile";
import { getRates, resolveRun } from "@/lib/api/endpoints";

export const metadata = { title: "Stats — Ledgerscope" };
// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy
// if the API happens to be restarting.
export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { run: runParam } = await searchParams;
  const run = await resolveRun(runParam);
  const rates = await getRates(run.run_id);

  return (
    <>
      <h1 className="text-2xl font-bold">The census</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Base rates per rung — the finding. Every agent gets seven rungs;
        these are population counts, not a score for any one of them. The
        table below each bar is the same numbers restated, not a different
        claim.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Agents in this run" value={run.agent_count ?? rates.agent_count} />
        <StatTile label="Chain" value={run.chain} />
        <StatTile label="Pinned block" value={run.pinned_block ?? "—"} />
      </div>

      <section className="mt-8 space-y-6 rounded-xl bg-panel p-6">
        {rates.rungs.map((r) => (
          <RateBar key={r.rung} rung={r} total={rates.agent_count} />
        ))}
      </section>

      <section className="mt-8 overflow-x-auto rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">By the numbers</h2>
        <table className="mt-3 w-full min-w-max border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="border-b border-line px-3 py-2 font-semibold">Rung</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Status</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Count</th>
            </tr>
          </thead>
          <tbody>
            {rates.rungs.flatMap((r) =>
              r.counts.map((c) => (
                <tr key={`${r.rung}-${c.status}`}>
                  <td className="border-b border-line px-3 py-2">{r.rung}</td>
                  <td className="border-b border-line px-3 py-2">{c.status}</td>
                  <td className="border-b border-line px-3 py-2 tabular-nums">
                    {c.count.toLocaleString("en-US")}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-8 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">Provenance</h2>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted">run id</dt>
          <dd className="break-all">{run.run_id}</dd>
          <dt className="text-muted">chain</dt>
          <dd>{run.chain}</dd>
          <dt className="text-muted">pinned block</dt>
          <dd>{run.pinned_block !== null ? run.pinned_block.toLocaleString("en-US") : "—"}</dd>
          <dt className="text-muted">started</dt>
          <dd>{run.started_at}</dd>
          <dt className="text-muted">finished</dt>
          <dd>{run.finished_at ?? "—"}</dd>
          <dt className="text-muted">checker version</dt>
          <dd>{run.checker_version}</dd>
          <dt className="text-muted">checker commit</dt>
          <dd className="break-all">{run.checker_commit}</dd>
          <dt className="text-muted">spec commit</dt>
          <dd className="break-all">{run.spec_commit}</dd>
          <dt className="text-muted">rerun command</dt>
          <dd className="break-all font-mono text-xs">{run.rerun_command}</dd>
        </dl>
      </section>
    </>
  );
}
