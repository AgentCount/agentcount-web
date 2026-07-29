import Link from "next/link";
import type { RungFacet } from "@/lib/api/endpoints";
import type { Rates } from "@/lib/api/schemas";
import { statusClasses, statusGlyph, statusLabel } from "@/lib/status";

/**
 * Search and rung-facet filtering, as one plain GET form.
 *
 * No client JavaScript: this is a `<form method="get">`, so the browser builds
 * the query string itself and every filtered view is a real, linkable,
 * bookmarkable URL — which is the actual requirement ("filters must be
 * URL-encoded so a filtered view is linkable"), and which a client-side filter
 * would have had to reimplement.
 *
 * ## The grid is built from the run's own rates
 *
 * Rows are the rungs this run reported; columns are the statuses that rung
 * actually produced. Nothing is typed here. Two consequences worth keeping:
 *
 *   * Rung 6 has no row in any run (not implemented) and so is simply absent
 *     from the grid — there is nothing to filter on, and offering "rung 6:
 *     fail" would imply the question is being asked of anyone.
 *   * A checkbox can never offer a status the API would reject, and a status
 *     the checker starts producing tomorrow appears here with no code change —
 *     `unclaimed` did exactly that on 2026-07-29.
 *
 * The count beside each checkbox is population data straight from the rates
 * endpoint. It tells a reader how big a filter's result will be before they
 * run it; it is not a score, and no count here is ever summed across rungs.
 */
export function DirectoryControls({
  rates,
  facets,
  q,
  run,
  action,
}: {
  rates: Rates;
  facets: RungFacet[];
  q: string;
  run: string;
  /** Where the form submits. `/working` posts back to `/directory` because a
   * hand-picked filter is no longer "the agents that pass everything". */
  action: string;
}) {
  const selected = new Set(facets.map((f) => `${f.rung}:${f.status}`));
  const hasFilter = facets.length > 0 || q.length > 0;

  return (
    <form method="get" action={action} className="rounded-lg border border-line bg-panel/60">
      <input type="hidden" name="run" value={run} />

      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <label className="flex flex-1 items-center gap-2 min-w-64">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Search
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="name, description, or owner address"
            className="w-full rounded border border-line bg-bg px-3 py-1.5 text-sm placeholder:text-dead focus:border-accent focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded border border-accent px-4 py-1.5 text-sm text-accent hover:bg-accent/10"
        >
          Apply
        </button>
        {hasFilter && (
          <Link
            href={`${action}?run=${run}`}
            className="text-sm text-muted hover:text-text"
          >
            Clear
          </Link>
        )}
      </div>

      <fieldset className="px-4 py-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted">
          Rung filters
          <span className="ml-2 font-normal normal-case tracking-normal text-dead">
            every box ticked must hold — tick nothing to see all agents
          </span>
        </legend>
        <div className="mt-2 space-y-1">
          {rates.rungs.map((r) => (
            <div key={r.rung} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="w-40 shrink-0 font-mono text-xs text-muted">
                {r.rung} · {r.name}
              </span>
              {r.counts.map((c) => {
                const value = `${r.rung}:${c.status}`;
                const isOn = selected.has(value);
                return (
                  <label
                    key={c.status}
                    title={`rung ${r.rung}, ${r.name}: ${statusLabel(c.status)}`}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded border px-2 py-0.5 text-xs ${
                      isOn ? statusClasses(c.status) : "border-line text-muted hover:border-dead"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="facet"
                      value={value}
                      defaultChecked={isOn}
                      className="h-3 w-3 accent-accent"
                    />
                    <span aria-hidden="true" className="font-mono">
                      {statusGlyph(c.status)}
                    </span>
                    <span>{c.status}</span>
                    <span className="tabular-nums text-dead">
                      {c.count.toLocaleString("en-US")}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
