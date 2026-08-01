import Link from "next/link";

/**
 * Which chain's census you are reading, and how to change it.
 *
 * Rendered only when more than one chain has a completed run — a switcher with
 * one option is furniture. It is a row of links, not a dropdown, so the current
 * chain is legible without interacting and every alternative is a real URL.
 *
 * The chain list comes from the runs themselves (`chainsWithRuns`), so a chain
 * appears the moment its first sweep finishes and never appears before that.
 * Offering a configured-but-unswept chain would lead to a page with nothing on
 * it.
 */
export function ChainSwitcher({
  chains,
  current,
  basePath,
  allLabel,
}: {
  chains: string[];
  current: string;
  /** Where a switch navigates. Kept per-page so switching chain on the
   * directory keeps you on the directory. */
  basePath: string;
  /**
   * Label for an "every chain" option, rendered first and linking to
   * `basePath` with no `?chain=` at all.
   *
   * Only the homepage passes this, because only the homepage has an
   * all-chains view to return to. Its absence of a query parameter is the
   * point: the census IS the default, and the URL says so by saying nothing.
   * Pages without an aggregate omit this and keep behaving as before.
   */
  allLabel?: string;
}) {
  // One real chain plus an "all" option is still a choice worth rendering;
  // one chain and no aggregate is furniture.
  if (chains.length < 2 && !allLabel) return null;

  const chip = (active: boolean) =>
    `border px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors ${
      active
        ? "border-edge bg-raised text-text"
        : "border-line text-dead hover:border-edge hover:text-muted"
    }`;

  return (
    <nav aria-label="Chain" className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
      <span className="label mr-2">Chain</span>
      {allLabel && (
        <Link
          href={basePath}
          aria-current={current === "" ? "page" : undefined}
          className={chip(current === "")}
        >
          {allLabel}
        </Link>
      )}
      {chains.map((chain) => {
        const active = chain === current;
        return (
          <Link
            key={chain}
            href={`${basePath}?chain=${encodeURIComponent(chain)}`}
            aria-current={active ? "page" : undefined}
            className={chip(active)}
          >
            {chain}
          </Link>
        );
      })}
    </nav>
  );
}
