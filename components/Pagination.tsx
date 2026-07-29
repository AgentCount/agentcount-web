import Link from "next/link";
import { buildQuery, pageCount } from "@/lib/paging";

/**
 * 60,097 agents are never one DOM dump: the API pages by offset and this walks
 * those pages, carrying the active filter through every link so paging never
 * silently drops a search or a facet.
 *
 * `basePath` exists because the directory is no longer at `/` — the homepage
 * is. Both `/directory` and `/working` page through this same component.
 */
export function Pagination({
  page,
  total,
  params,
  basePath,
}: {
  page: number;
  total: number;
  params: Record<string, string | number | string[] | undefined>;
  basePath: string;
}) {
  const last = pageCount(total);
  const href = (p: number) => `${basePath}${buildQuery({ ...params, page: p })}`;

  const step = "font-mono text-xs uppercase tracking-[0.1em]";

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between border-t border-edge pt-3"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className={`${step} text-muted transition-colors hover:text-text`}
        >
          ← Prev
        </Link>
      ) : (
        <span className={`${step} text-dead`}>← Prev</span>
      )}
      <span className="font-mono text-xs text-dead">
        <span className="text-text">{page.toLocaleString("en-US")}</span>
        <span className="mx-1.5">/</span>
        {last.toLocaleString("en-US")}
        <span className="mx-2.5 text-line">|</span>
        <span className="text-muted">{total.toLocaleString("en-US")}</span> agents
      </span>
      {page < last ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className={`${step} text-muted transition-colors hover:text-text`}
        >
          Next →
        </Link>
      ) : (
        <span className={`${step} text-dead`}>Next →</span>
      )}
    </nav>
  );
}
