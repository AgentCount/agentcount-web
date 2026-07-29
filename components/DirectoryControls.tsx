import Link from "next/link";
import type { RungFacet } from "@/lib/api/endpoints";
import type { Rates } from "@/lib/api/schemas";
import { statusClasses, statusGlyph, statusInkClass, statusLabel } from "@/lib/status";

/**
 * Search and rung-facet filtering, as one plain GET form.
 *
 * No client JavaScript: this is a `<form method="get">`, so the browser builds
 * the query string itself and every filtered view is a real, linkable,
 * bookmarkable URL — which is the actual requirement ("filters must be
 * URL-encoded so a filtered view is linkable"), and which a client-side filter
 * would have had to reimplement.
 *
 * ## The grid is a control panel, and it is built from the run's own rates
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
 * A ticked box takes that status's colour, which is the one place the
 * interface borrows the data's palette — because the control IS a status, not
 * chrome about one.
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
  chain,
  action,
}: {
  rates: Rates;
  facets: RungFacet[];
  q: string;
  run: string;
  chain: string;
  /** Where the form submits. `/working` posts back to `/directory` because a
   * hand-picked filter is no longer "the agents that pass everything". */
  action: string;
}) {
  const selected = new Set(facets.map((f) => `${f.rung}:${f.status}`));
  const hasFilter = facets.length > 0 || q.length > 0;

  return (
    <form method="get" action={action} className="border border-edge bg-panel/40">
      <input type="hidden" name="run" value={run} />
      {/* Without this, applying a filter drops back to the default chain. */}
      <input type="hidden" name="chain" value={chain} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3">
        <label className="flex min-w-72 flex-1 items-center gap-3">
          <span className="label">Find</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="name, description, or owner address"
            className="w-full border-b border-line bg-transparent pb-1 font-mono text-sm text-text placeholder:text-dead focus:border-edge focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="border border-edge px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-text transition-colors hover:bg-raised"
        >
          Apply
        </button>
        {hasFilter && (
          <Link
            href={`${action}?chain=${encodeURIComponent(chain)}`}
            className="font-mono text-xs uppercase tracking-[0.1em] text-dead transition-colors hover:text-text"
          >
            Reset
          </Link>
        )}
      </div>

      <fieldset className="px-4 py-3">
        <legend className="sr-only">Rung filters</legend>
        <div className="mb-2 flex items-baseline gap-3">
          <span className="label">Rungs</span>
          <span className="text-[0.6875rem] text-dead">
            every ticked box must hold — tick nothing to see all agents
          </span>
        </div>
        <div className="space-y-px">
          {rates.rungs.map((r) => (
            <div
              key={r.rung}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line/60 py-1.5"
            >
              <span className="w-36 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
                <span className="text-dead">{r.rung}</span> {r.name}
              </span>
              {r.counts.map((c) => {
                const value = `${r.rung}:${c.status}`;
                const isOn = selected.has(value);
                return (
                  <label
                    key={c.status}
                    title={`rung ${r.rung}, ${r.name}: ${statusLabel(c.status)}`}
                    // The input itself is `sr-only` — the chip IS the control,
                    // and a native checkbox beside it would be a second thing
                    // to look at. `has-[:focus-visible]` puts the focus ring
                    // back on the label, so keyboard focus stays visible even
                    // though the box it belongs to is not.
                    className={`inline-flex cursor-pointer items-baseline gap-1.5 border px-2 py-0.5 font-mono text-[0.6875rem] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                      isOn
                        ? `${statusClasses(c.status)} bg-raised`
                        : "border-line text-dead hover:border-edge hover:text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="facet"
                      value={value}
                      defaultChecked={isOn}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={isOn ? "" : statusInkClass(c.status)}
                    >
                      {statusGlyph(c.status)}
                    </span>
                    <span>{c.status}</span>
                    <span className={isOn ? "opacity-70" : "text-dead"}>
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
