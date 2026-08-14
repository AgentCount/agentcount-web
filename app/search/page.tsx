import { AgentTable } from "@/components/AgentTable";
import { Section } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import { canonicalRuns } from "@/lib/api/aggregate";
import { listRuns, searchAgents } from "@/lib/api/endpoints";
import { chainDisplayName } from "@/lib/chains";
import { PUBLISHED_RUNS } from "@/lib/published-runs";

export const metadata = { title: "Search" };
// A build must not depend on the API being reachable.
export const dynamic = "force-dynamic";

/**
 * Search across every published chain at once.
 *
 * This page exists because the masthead search used to land on one chain's
 * directory — the default chain held 17% of the census, and an owner address
 * from any other chain returned nothing with no explanation. The API's
 * /api/search takes the canonical run set from this app (publication is a
 * git fact the API cannot see) and answers per run, so the groups below are
 * exactly the chains the homepage's population is summed from.
 *
 * Against an API that predates the endpoint, the page degrades to per-chain
 * links rather than erroring: a deploy-ordering window must not take search
 * down.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q ?? "").trim();
  const allRuns = await listRuns();
  const censusRuns = canonicalRuns(
    allRuns,
    new Set(PUBLISHED_RUNS.map((r) => r.run_id)),
  );

  const groups = q
    ? await searchAgents(
        q,
        censusRuns.map((r) => r.run_id),
      )
    : [];

  const totalMatches = (groups ?? []).reduce((n, g) => n + g.total, 0);

  return (
    <>
      <header className="border-b border-edge pb-5">
        <h1 className="numeral max-w-[24ch] text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">
          Search
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Name, description, or owner address, across every published chain at
          once. Results are grouped by chain because an agent id and a name
          are only unique within one.
        </p>
        <form method="get" action="/search" role="search" className="mt-6 flex max-w-xl items-stretch">
          <label htmlFor="search-q" className="sr-only">
            Search agents by name, description or owner address
          </label>
          <input
            id="search-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, description or owner"
            className="w-full border border-line bg-panel px-3 py-2 font-mono text-sm text-text placeholder:text-dead focus:border-edge focus:outline-none"
          />
          <button
            type="submit"
            className="-ml-px border border-line px-4 py-2 font-mono text-xs uppercase tracking-[0.08em] text-muted transition-colors hover:border-edge hover:text-text"
          >
            Find
          </button>
        </form>
      </header>

      {!q ? null : groups === null ? (
        // The API predates /api/search. Degrade to the per-chain directory,
        // which is the search that exists everywhere.
        <div className="mt-10 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          <p>
            Cross-chain search needs a newer census API than this deployment
            is talking to. The per-chain search works today — the same query,
            one chain at a time:
          </p>
          <p className="mt-3">
            {censusRuns.map((r, i, all) => (
              <span key={r.chain}>
                <TextLink
                  href={`/directory?chain=${encodeURIComponent(r.chain)}&q=${encodeURIComponent(q)}`}
                  tone="bright"
                >
                  {chainDisplayName(r.chain)}
                </TextLink>
                {i < all.length - 1 ? ", " : ""}
              </span>
            ))}
            .
          </p>
        </div>
      ) : totalMatches === 0 ? (
        <div className="mt-10 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          <p>
            Nothing matched on any published chain. Search covers names,
            descriptions and owner addresses.
          </p>
          {/^\d+$/.test(q) && (
            <p className="mt-4">
              <span className="text-text">{q}</span> looks like an agent id —
              ids are not searched, but the permalink works:{" "}
              {censusRuns.map((r, i, all) => (
                <span key={r.chain}>
                  <TextLink
                    href={`/agent/${encodeURIComponent(r.chain)}/${encodeURIComponent(q)}`}
                    tone="bright"
                    className="font-mono"
                  >
                    {r.chain}/{q}
                  </TextLink>
                  {i < all.length - 1 ? ", " : ""}
                </span>
              ))}
              .
            </p>
          )}
          {/^0x/i.test(q) && (
            <p className="mt-4">
              Address search matches the agent&rsquo;s{" "}
              <span className="text-text">owner</span> — the address holding
              its ERC-721 token. A payment wallet (
              <code className="font-mono text-xs">agentWallet</code>) is not
              searchable yet.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          {groups
            .filter((g) => g.total > 0)
            .map((g) => (
              <Section
                key={g.run_id}
                title={chainDisplayName(g.chain)}
                aside={`${g.total.toLocaleString("en-US")} match${g.total === 1 ? "" : "es"}`}
                className="mt-10 max-w-5xl"
              >
                <AgentTable agents={g.items} />
                {g.total > g.items.length && (
                  <p className="mt-4">
                    <TextLink
                      href={`/directory?chain=${encodeURIComponent(g.chain)}&q=${encodeURIComponent(q)}`}
                      className="font-mono text-xs uppercase tracking-[0.1em]"
                    >
                      All {g.total.toLocaleString("en-US")} on{" "}
                      {chainDisplayName(g.chain)} →
                    </TextLink>
                  </p>
                )}
              </Section>
            ))}
        </div>
      )}
    </>
  );
}
