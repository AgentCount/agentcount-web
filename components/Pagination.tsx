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

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className="text-accent hover:underline">
          ← Previous
        </Link>
      ) : (
        <span className="text-dead">← Previous</span>
      )}
      <span className="tabular-nums text-muted">
        Page {page.toLocaleString("en-US")} of {last.toLocaleString("en-US")} ·{" "}
        {total.toLocaleString("en-US")} agents
      </span>
      {page < last ? (
        <Link href={href(page + 1)} rel="next" className="text-accent hover:underline">
          Next →
        </Link>
      ) : (
        <span className="text-dead">Next →</span>
      )}
    </nav>
  );
}
