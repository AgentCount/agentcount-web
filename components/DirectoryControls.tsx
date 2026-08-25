import Link from "next/link";
import type { RungFacet } from "@/lib/api/endpoints";
import { checkLabel, questionFor } from "@/lib/checks";
import type { Rates } from "@/lib/api/schemas";
import { statusBorderClass, statusClasses, statusGlyph, statusInkClass, statusLabel } from "@/lib/status";

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
 *
 * The grid itself sits behind a `<details>` disclosure, closed by default —
 * see the comment at that element's own call site for why.
 */
/**
 * The rungs a run actually reported, each required to be `pass`.
 *
 * Read from the run's own rates rather than written down, which is what
 * `/working` did before this replaced it: rung 6 is unimplemented and produces
 * no rows, so requiring it would return nobody forever and imply the question
 * is being asked. When it ships, the preset tightens with no code change.
 */
export function allPassFacets(rates: Rates): RungFacet[] {
  return rates.rungs.map((r) => ({ rung: r.rung, status: "pass" }));
}

function allPassQuery(rates: Rates): string {
  return allPassFacets(rates)
    .map((f) => `facet=${encodeURIComponent(`${f.rung}:${f.status}`)}`)
    .join("&");
}

/** Whether the current filter IS the all-pass preset, for the active chip. */
function isAllPass(rates: Rates, facets: RungFacet[]): boolean {
  const want = allPassFacets(rates);
  if (facets.length !== want.length || want.length === 0) return false;
  const have = new Set(facets.map((f) => `${f.rung}:${f.status}`));
  return want.every((f) => have.has(`${f.rung}:${f.status}`));
}

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
          {/* A full border, not the underline this used to be: the
              underline read as more text next to "Find" and the two
              bordered controls beside it (Apply, and Preset/Checks below),
              rather than as a field waiting for input — this form already
              opted out of the site-wide "hairline, not a box" rule the
              moment it drew a border around itself, so the input matching
              its siblings is consistent with the form's own language, not a
              departure from it. `focus:border-edge` only, no
              `focus:outline-none`: this input used to suppress the site's
              accessible focus ring entirely — a keyboard user tabbing here
              got almost nothing. Dropping the suppression lets the global
              `:focus-visible` ring (see `globals.css`) return for keyboard
              focus, while the border tint — plain `:focus`, not
              `:focus-visible` — still answers a mouse click same as before;
              the two now stack instead of one silently winning. */}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="name, description, or owner address"
            className="w-full border border-line bg-raised/30 px-3 py-1.5 font-mono text-sm text-text placeholder:text-dead transition-colors hover:border-edge focus:border-edge focus:bg-raised/50"
          />
        </label>
        <button
          type="submit"
          className="border border-edge px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-text transition hover:bg-raised active:scale-[0.97]"
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

      {/* The preset that used to be its own page.

          `/working` was the directory with every implemented rung fixed to
          `pass`, which is a filter rather than a section — so it is a filter
          here now, one click from the controls that can widen it again. The
          rung list comes from the run's own rates, exactly as `/working`
          computed it: rung 6 produces no rows, so it is not among the
          conditions and nobody is credited for it. When it ships, this preset
          gets stricter on its own.

          Deliberately still not a score: it asks one yes/no question of each
          agent and lists the agents whose answer is yes. No count of passed
          rungs is attached to anyone. */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-line px-4 py-2.5">
        <span className="label">Preset</span>
        <Link
          href={`${action}?chain=${encodeURIComponent(chain)}&${allPassQuery(rates)}`}
          className={`border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] transition active:scale-[0.97] ${
            isAllPass(rates, facets)
              ? "border-edge bg-raised text-text"
              : "border-line text-dead hover:border-edge hover:text-muted"
          }`}
        >
          Passing all checks
        </Link>
        <span className="text-[0.6875rem] text-dead">
          every check this run asked came back pass
        </span>
      </div>

      {/* Closed by default: a first-time visitor used to scroll past a
          seven-row checkbox grid before reaching a single agent. The grid is
          one click away rather than gone — `<details>` needs no client
          JavaScript, so this stays the same plain GET form it always was.
          It opens itself when the URL already carries a facet, because
          hiding the very checkboxes that explain why the table is filtered
          would be worse than the scroll it replaces. */}
      <fieldset className="px-4 py-3">
        <legend className="sr-only">Check filters</legend>
        {/* `group` on `<details>` itself, not `<summary>`: Tailwind's
            `group-open:` variant reads the `open` attribute off the nearest
            `group` ancestor, and `<details>` is the element that actually
            carries it. That drives the pill below between "show"/"hide" and
            spins its arrow — a real toggle, at the same visual weight as
            the Preset chip above it, rather than the two bare lines of text
            this used to be (a label, a sentence, a lone "▸") with nothing
            in the row reading as a control until a reader tried clicking
            it. */}
        <details className="group" open={facets.length > 0 || undefined}>
          <summary className="mb-2 flex cursor-pointer list-none items-baseline gap-3 marker:content-none">
            <span className="label">Checks</span>
            <span className="text-[0.6875rem] text-dead">
              every ticked box must hold — tick nothing to see all agents
              {facets.length > 0 && (
                <>
                  {" "}
                  —{" "}
                  <span className="text-muted">
                    {facets.length} active
                  </span>
                </>
              )}
            </span>
            <span
              aria-hidden="true"
              className="ml-auto inline-flex items-center gap-1.5 border border-line px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-dead transition-colors group-hover:border-edge group-hover:text-muted"
            >
              <span className="group-open:hidden">Show</span>
              <span className="hidden group-open:inline">Hide</span>
              <span className="inline-block transition-transform group-open:rotate-90">
                ▸
              </span>
            </span>
          </summary>
          <div className="space-y-px">
            {rates.rungs.map((r) => (
              <div key={r.rung} className="border-t border-line/60 py-2.5">
                {/* The question used to share its row with the chips, in a
                    fixed-width label column — which broke the moment a
                    question was long enough to wrap ("Claims its identity?"
                    did, at seven rungs' worth of column width, and no other
                    row did, so the grid looked crooked rather than merely
                    dense). Its own full-width line fixes that at any length,
                    present or future, rather than tuning one column width to
                    fit today's seven questions. The plain question is what a
                    reader filters by; the checker's own name stays visible in
                    dead grey because the facet it builds (`4:pass`) is
                    written in that vocabulary and appears in the URL. The
                    number moved into its own small square — the same idea
                    `RungStrip` already uses for a check's position — so seven
                    rows read as seven numbered positions at a glance, not as
                    seven paragraphs that happen to start with a digit. */}
                <div className="flex items-baseline gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center border border-line/80 text-dead"
                  >
                    {r.rung}
                  </span>
                  <span className="text-text">{questionFor(r.rung, r.name)}</span>{" "}
                  <span className="text-dead">{r.name}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  {r.counts.map((c) => {
                    const value = `${r.rung}:${c.status}`;
                    const isOn = selected.has(value);
                    return (
                      <label
                        key={c.status}
                        title={`${checkLabel(r.rung, r.name)}: ${statusLabel(c.status)}`}
                        // The input itself is `sr-only` — the chip IS the control,
                        // and a native checkbox beside it would be a second thing
                        // to look at. `has-[:focus-visible]` puts the focus ring
                        // back on the label, so keyboard focus stays visible even
                        // though the box it belongs to is not.
                        className={`inline-flex cursor-pointer items-baseline gap-1.5 border px-2.5 py-1 font-mono text-xs transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent active:scale-[0.97] ${
                          isOn
                            ? `${statusClasses(c.status)} bg-raised`
                            : `${statusBorderClass(c.status)} text-dead hover:text-muted hover:bg-raised/50`
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
              </div>
            ))}
          </div>
        </details>
      </fieldset>
    </form>
  );
}
