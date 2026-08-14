import { AgentTable } from "@/components/AgentTable";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { chainDisplayName } from "@/lib/chains";
import { DirectoryControls } from "@/components/DirectoryControls";
import { Pagination } from "@/components/Pagination";
import { StatusLegend } from "@/components/StatusLegend";
import { TextLink } from "@/components/TextLink";
import {
  chainsWithRuns,
  getRates,
  listAgents,
  listRuns,
  parseFacets,
  resolveRunForRequest,
  rungVocabulary,
  serialiseFacets,
  statusVocabulary,
  type RungFacet,
} from "@/lib/api/endpoints";
import { PAGE_SIZE, offsetFor, pageFromParam } from "@/lib/paging";

export type DirectorySearchParams = {
  page?: string;
  run?: string;
  chain?: string;
  q?: string;
  facet?: string | string[];
};

/**
 * The directory, shared by `/directory` and `/working`.
 *
 * `/working` is this same view with its facets fixed to "every implemented rung
 * passed" and its controls hidden — not a second implementation. The two pages
 * differ only in which facets they start from and what they say about
 * themselves, so keeping them one component is what stops them drifting into
 * disagreeing about what a rung status means.
 */
export async function AgentDirectory({
  searchParams,
  basePath,
  title,
  intro,
  /** When set, these facets replace anything in the URL and the filter form is
   * not offered — the page IS the filter. */
  lockedFacets,
  footer,
}: {
  searchParams: DirectorySearchParams;
  basePath: string;
  title: string;
  intro: React.ReactNode;
  lockedFacets?: (validRungs: number[]) => RungFacet[];
  footer?: React.ReactNode;
}) {
  const page = pageFromParam(searchParams.page);
  const run = await resolveRunForRequest(searchParams);
  const allRuns = await listRuns();

  // The rung and status vocabulary come from this run's own rates, never typed
  // here: a filter can then never offer a value the API would reject, and a
  // status the checker starts producing tomorrow appears with no code change.
  const rates = await getRates(run.run_id);
  const validRungs = rungVocabulary(rates);
  const validStatuses = statusVocabulary(rates);

  const facets = lockedFacets
    ? lockedFacets(validRungs)
    : parseFacets(searchParams.facet, validRungs, validStatuses);
  const q = (searchParams.q ?? "").trim();

  const agents = await listAgents({
    run: run.run_id,
    facets,
    q: q || undefined,
    limit: PAGE_SIZE,
    offset: offsetFor(page),
  });

  // Rebuilt from the PARSED facets rather than echoed from the URL, so a link
  // to page 2 carries exactly the filter that was actually applied — a URL with
  // a junk facet in it does not keep propagating it.
  const linkParams = {
    chain: run.chain,
    run: run.run_id,
    q: q || undefined,
    facet: lockedFacets ? undefined : facets.map((f) => `${f.rung}:${f.status}`),
  };

  return (
    <>
      <header className="border-b border-edge pb-5">
        <div className="mb-6">
          <ChainSwitcher
            chains={chainsWithRuns(allRuns)}
            current={run.chain}
            basePath={basePath}
          />
        </div>
        <h1 className="numeral max-w-[24ch] text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">
          {title}
        </h1>
        <div className="mt-4 max-w-prose text-sm leading-relaxed text-muted">{intro}</div>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-xs text-dead">
          <span>
            run <span className="text-muted">{run.run_id.slice(0, 8)}</span>
          </span>
          <span className="text-line">|</span>
          <span className="text-muted">{run.chain}</span>
          <span className="text-line">|</span>
          <span>
            block{" "}
            <span className="text-muted">
              {run.pinned_block !== null
                ? run.pinned_block.toLocaleString("en-US")
                : "—"}
            </span>
          </span>
          <span className="text-line">|</span>
          <TextLink href={`/?chain=${encodeURIComponent(run.chain)}`} tone="inherit">
            provenance
          </TextLink>
        </p>
      </header>

      {!lockedFacets && (
        <div className="mt-6 max-w-5xl">
          <DirectoryControls
            rates={rates}
            facets={facets}
            q={q}
            run={run.run_id}
            chain={run.chain}
            action={basePath}
          />
        </div>
      )}

      {agents.items.length === 0 ? (
        <div className="mt-8 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          {/* The empty state names the chain in English, never a run hash: a
              first-time visitor does not know that a run is one chain, and
              "no agents match in run cfbfcc01" reads as "this agent does not
              exist" when the truth is "we searched base only". */}
          <p>
            Nothing matched among the{" "}
            {rates.agent_count.toLocaleString("en-US")} agents on{" "}
            <span className="text-text">{chainDisplayName(run.chain)}</span>.{" "}
            {facets.length > 0 && (
              <>
                Every one of the {facets.length} check conditions has to hold at
                once (
                <span className="font-mono text-text">{serialiseFacets(facets)}</span>
                ).
              </>
            )}
          </p>
          {/* Search is scoped to one chain's run, so the most likely reason
              for an empty result is simply "wrong chain". Offer the same
              query everywhere else it could be, rather than making the
              visitor discover the chain switcher. */}
          {q && !/^\d+$/.test(q) && chainsWithRuns(allRuns).filter((c) => c !== run.chain).length > 0 && (
            <p className="mt-4">
              Search covers one chain at a time. Try the same search on{" "}
              {chainsWithRuns(allRuns)
                .filter((c) => c !== run.chain)
                .map((chain, i, all) => (
                  <span key={chain}>
                    <TextLink
                      href={`/directory?chain=${encodeURIComponent(chain)}&q=${encodeURIComponent(q)}`}
                      tone="bright"
                    >
                      {chainDisplayName(chain)}
                    </TextLink>
                    {i < all.length - 1 ? ", " : ""}
                  </span>
                ))}
              .
            </p>
          )}
          {/* An 0x paste is the other common dead end: `q` matches the OWNER
              address (prefix), not the agentWallet, and nothing on the page
              said so. */}
          {/^0x/i.test(q) && (
            <p className="mt-4">
              Address search matches the agent&rsquo;s{" "}
              <span className="text-text">owner</span> — the address holding
              its ERC-721 token. A payment wallet (
              <code className="font-mono text-xs">agentWallet</code>) is not
              searchable yet.
            </p>
          )}
          {/* The id escape hatch.

              The API's `q` searches name, description and owner prefix — an
              on-chain agent id matches none of them, so pasting "1234" into
              any search box on this site returns nothing at all. That is the
              single most likely way for a first-time visitor to conclude the
              register does not contain the agent they came to look up.

              Offered only once a search has actually come back empty, and
              only for a numeric query: at that point the id reading is the
              only remaining interpretation, and this is the one place that
              knows no name matched. Every swept chain is listed because an id
              is not unique across chains — guessing one would send half the
              askers to the wrong agent. */}
          {/^\d+$/.test(q) && (
            <p className="mt-4">
              <span className="text-text">{q}</span> looks like an agent id.
              Search covers names, descriptions and owner addresses, not ids —
              open the permalink directly:{" "}
              {chainsWithRuns(allRuns).map((chain, i, all) => (
                <span key={chain}>
                  <TextLink
                    href={`/agent/${encodeURIComponent(chain)}/${encodeURIComponent(q)}`}
                    tone="bright"
                    className="font-mono"
                  >
                    {chain}/{q}
                  </TextLink>
                  {i < all.length - 1 ? ", " : ""}
                </span>
              ))}
              .
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-8">
            <AgentTable agents={agents.items} />
          </div>
          <div className="mt-5">
            <Pagination
              page={page}
              total={agents.page.total}
              params={linkParams}
              basePath={basePath}
            />
          </div>
          <div className="mt-8 max-w-5xl">
            <StatusLegend statuses={validStatuses} />
          </div>
        </>
      )}

      {footer && (
        <div className="mt-10 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          {footer}
        </div>
      )}
    </>
  );
}
