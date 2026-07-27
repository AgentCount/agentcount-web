import Link from "next/link";
import { ChainFilter } from "@/components/ChainFilter";
import { Pagination } from "@/components/Pagination";
import { StatusDot } from "@/components/StatusDot";
import { listAgents, listChains } from "@/lib/api/endpoints";
import { PAGE_SIZE, buildQuery, offsetFor, pageFromParam } from "@/lib/paging";

export const metadata = { title: "Agent Facts Explorer — Ledgerscope" };

export default async function Explorer({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; chain?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const page = pageFromParam(sp.page);
  const sort = sp.sort === "alive" ? "alive" : undefined;

  const [agents, chains] = await Promise.all([
    listAgents({
      chain: sp.chain,
      limit: PAGE_SIZE,
      offset: offsetFor(page),
      sort: sort ?? "registered",
    }),
    listChains(),
  ]);

  const sortLink = (value: string | undefined, label: string) => (
    <Link
      href={`/${buildQuery({ chain: sp.chain, sort: value })}`}
      className={sort === value ? "text-accent" : "text-muted hover:text-text"}
    >
      {label}
    </Link>
  );

  return (
    <>
      <h1 className="text-2xl font-bold">Agent Facts Explorer</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Every agent registered under ERC-8004, with independently verified
        facts: endpoint liveness, metadata status, and evidence-backed flags. We
        publish measurements, not judgments.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <ChainFilter chains={chains} active={sp.chain} sort={sp.sort} />
        <div className="flex gap-3 text-sm">
          <span className="text-dead">Sort:</span>
          {sortLink(undefined, "newest")}
          {sortLink("alive", "responding first")}
        </div>
      </div>

      {agents.items.length === 0 ? (
        <p className="mt-8 rounded-xl bg-panel p-6 text-muted">
          No agents match this filter.
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="border-b border-line px-3 py-2 font-semibold">Agent</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Chain</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Endpoint</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Registered</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Flags</th>
            </tr>
          </thead>
          <tbody>
            {agents.items.map((a) => (
              <tr key={`${a.chain}/${a.agent_id}`}>
                <td className="max-w-md truncate border-b border-line px-3 py-2">
                  <Link
                    href={`/agent/${a.chain}/${a.agent_id}`}
                    className="text-accent hover:underline"
                  >
                    {a.domain}
                  </Link>
                </td>
                <td className="border-b border-line px-3 py-2">{a.chain}</td>
                <td className="border-b border-line px-3 py-2">
                  <StatusDot agent={a} />
                </td>
                <td className="border-b border-line px-3 py-2">
                  {a.registered_at.slice(0, 10)}
                </td>
                <td className="border-b border-line px-3 py-2">
                  {a.flag_count > 0 ? `⚑ ${a.flag_count}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        page={page}
        total={agents.page.total}
        params={{ chain: sp.chain, sort: sp.sort }}
      />
    </>
  );
}
