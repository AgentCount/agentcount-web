import Link from "next/link";
import { buildQuery, pageCount } from "@/lib/paging";

export function Pagination({
  page,
  total,
  params,
}: {
  page: number;
  total: number;
  params: Record<string, string | undefined>;
}) {
  const last = pageCount(total);
  const href = (p: number) => `/${buildQuery({ ...params, page: p })}`;

  return (
    <nav className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="text-accent hover:underline">
          ← Previous
        </Link>
      ) : (
        <span className="text-dead">← Previous</span>
      )}
      <span className="text-muted">
        Page {page} of {last} · {total} agents
      </span>
      {page < last ? (
        <Link href={href(page + 1)} className="text-accent hover:underline">
          Next →
        </Link>
      ) : (
        <span className="text-dead">Next →</span>
      )}
    </nav>
  );
}
