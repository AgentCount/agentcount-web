import Link from "next/link";
import { AgentTable } from "@/components/AgentTable";
import { DirectoryControls } from "@/components/DirectoryControls";
import { Pagination } from "@/components/Pagination";
import { StatusLegend } from "@/components/StatusLegend";
import {
  getRates,
  listAgents,
  parseFacets,
  resolveRun,
  rungVocabulary,
  serialiseFacets,
  statusVocabulary,
  type RungFacet,
} from "@/lib/api/endpoints";
import { PAGE_SIZE, offsetFor, pageFromParam } from "@/lib/paging";

export type DirectorySearchParams = {
  page?: string;
  run?: string;
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
  const run = await resolveRun(searchParams.run);

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
    run: run.run_id,
    q: q || undefined,
    facet: lockedFacets ? undefined : facets.map((f) => `${f.rung}:${f.status}`),
  };

  return (
    <>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{intro}</div>

      <p className="mt-2 font-mono text-xs text-dead">
        run {run.run_id.slice(0, 8)}… · {run.chain} · block{" "}
        {run.pinned_block !== null ? run.pinned_block.toLocaleString("en-US") : "—"} ·{" "}
        <Link href="/census" className="text-accent hover:underline">
          provenance
        </Link>
      </p>

      {!lockedFacets && (
        <div className="mt-5 max-w-5xl">
          <DirectoryControls
            rates={rates}
            facets={facets}
            q={q}
            run={run.run_id}
            action={basePath}
          />
        </div>
      )}

      <div className="mt-5">
        <StatusLegend statuses={validStatuses} />
      </div>

      {agents.items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-panel/60 px-4 py-6 text-muted">
          No agents match this filter in run {run.run_id.slice(0, 8)}….{" "}
          {facets.length > 0 && (
            <>
              Every one of the {facets.length} rung conditions has to hold at
              once ({serialiseFacets(facets)}).
            </>
          )}
        </p>
      ) : (
        <>
          <div className="mt-5">
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
        </>
      )}

      {footer && <div className="mt-8 max-w-prose text-sm text-muted">{footer}</div>}
    </>
  );
}
