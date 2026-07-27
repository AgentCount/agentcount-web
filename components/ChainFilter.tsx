import Link from "next/link";
import type { Chain } from "@/lib/api/schemas";
import { buildQuery } from "@/lib/paging";

/**
 * Links, not a <select> — this stays a Server Component, and a filter that
 * works without JavaScript is the right default for a data site.
 */
export function ChainFilter({
  chains,
  active,
  sort,
}: {
  chains: Chain[];
  active?: string;
  sort?: string;
}) {
  const link = (chain: string | undefined, label: string, count?: number) => {
    const on = active === chain;
    return (
      <Link
        key={label}
        href={`/${buildQuery({ chain, sort })}`}
        className={`rounded-full border px-3 py-1 ${
          on
            ? "border-accent text-accent"
            : "border-line text-muted hover:text-text"
        }`}
      >
        {label}
        {count !== undefined && <span className="text-dead"> · {count}</span>}
      </Link>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {link(undefined, "All chains")}
      {chains.map((c) => link(c.chain, c.chain, c.agents))}
    </div>
  );
}
