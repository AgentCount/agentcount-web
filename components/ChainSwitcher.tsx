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
}: {
  chains: string[];
  current: string;
  /** Where a switch navigates. Kept per-page so switching chain on the
   * directory keeps you on the directory. */
  basePath: string;
}) {
  if (chains.length < 2) return null;

  return (
    <nav aria-label="Chain" className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
      <span className="label mr-2">Chain</span>
      {chains.map((chain) => {
        const active = chain === current;
        return (
          <Link
            key={chain}
            href={`${basePath}?chain=${encodeURIComponent(chain)}`}
            aria-current={active ? "page" : undefined}
            className={`border px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition-colors ${
              active
                ? "border-edge bg-raised text-text"
                : "border-line text-dead hover:border-edge hover:text-muted"
            }`}
          >
            {chain}
          </Link>
        );
      })}
    </nav>
  );
}
