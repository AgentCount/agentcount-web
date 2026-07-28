import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { RungChips } from "@/components/RungChips";
import { getRates, listAgents, resolveRun } from "@/lib/api/endpoints";
import { PAGE_SIZE, offsetFor, pageFromParam } from "@/lib/paging";

export const metadata = { title: "Directory — Ledgerscope" };
export const dynamic = "force-dynamic";

const RUNGS = [1, 2, 3, 4, 5, 6, 7];

export default async function Directory({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; run?: string; rung?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = pageFromParam(sp.page);
  const run = await resolveRun(sp.run);

  // The rung/status vocabulary for the filter form comes from this run's own
  // rates, never typed literally here — the set of status words a filter can
  // select is exactly the set the API actually produced for this run, so the
  // filter can never offer a value the API would reject.
  const rates = await getRates(run.run_id);
  const statusOptions = Array.from(
    new Set(rates.rungs.flatMap((r) => r.counts.map((c) => c.status))),
  ).sort();

  const rungParam = sp.rung && /^[1-7]$/.test(sp.rung) ? Number(sp.rung) : undefined;
  const statusParam = sp.status && statusOptions.includes(sp.status) ? sp.status : undefined;

  const agents = await listAgents({
    run: run.run_id,
    rung: rungParam,
    status: statusParam,
    limit: PAGE_SIZE,
    offset: offsetFor(page),
  });

  return (
    <>
      <h1 className="text-2xl font-bold">Directory</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Every agent registered under ERC-8004, with all seven conformance
        rungs shown side by side. There is no score here, on purpose — a
        rung&rsquo;s status is exactly the word the checker recorded for it,
        never a tally.
      </p>
      <p className="mt-2 text-sm text-muted">
        Run <span className="text-text">{run.run_id.slice(0, 8)}…</span> on{" "}
        {run.chain}, pinned at block{" "}
        {run.pinned_block !== null ? run.pinned_block.toLocaleString("en-US") : "—"}.{" "}
        <Link href="/stats" className="text-accent hover:underline">
          Full provenance →
        </Link>
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4 text-sm">
        <input type="hidden" name="run" value={run.run_id} />
        <label className="flex flex-col gap-1">
          <span className="text-muted">Rung</span>
          <select
            name="rung"
            defaultValue={rungParam ?? ""}
            className="rounded border border-line bg-panel px-2 py-1"
          >
            <option value="">All</option>
            {RUNGS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted">Status</span>
          <select
            name="status"
            defaultValue={statusParam ?? ""}
            className="rounded border border-line bg-panel px-2 py-1"
          >
            <option value="">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded border border-accent px-3 py-1 text-accent hover:bg-accent/10"
        >
          Filter
        </button>
        {(rungParam !== undefined || statusParam !== undefined) && (
          <Link href={`/?run=${run.run_id}`} className="text-muted hover:text-text">
            Clear
          </Link>
        )}
      </form>

      {agents.items.length === 0 ? (
        <p className="mt-8 rounded-xl bg-panel p-6 text-muted">
          No agents match this filter.
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="border-b border-line px-3 py-2 font-semibold">Agent</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Rungs 1–7</th>
            </tr>
          </thead>
          <tbody>
            {agents.items.map((a) => (
              <tr key={`${a.chain}/${a.agent_id}`}>
                <td className="border-b border-line px-3 py-2">
                  <Link
                    href={`/agent/${a.chain}/${a.agent_id}`}
                    className="text-accent hover:underline"
                  >
                    Agent #{a.agent_id} · {a.chain} · {a.owner.slice(0, 10)}…
                  </Link>
                </td>
                <td className="border-b border-line px-3 py-2">
                  <RungChips rungs={a.rungs} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        page={page}
        total={agents.page.total}
        params={{ run: run.run_id, rung: rungParam, status: statusParam }}
      />
    </>
  );
}
