import Link from "next/link";
import { statusAnchor, statusLabel } from "@/lib/status";

/**
 * A status word in prose, linked to its definition.
 *
 * The six status words are kept exactly as the checker produces them —
 * `pass`, `fail`, `skipped`, `error`, `unclaimed`, `unprobeable` — because
 * they are precise and because renaming them here would put this app's
 * vocabulary at odds with the archives, the API and every evidence row.
 *
 * Precise is not the same as self-explanatory. `unclaimed` and `skipped` are
 * the two most commonly misread as "fail", and a reader meeting either in a
 * sentence has nowhere to go for the difference. So every appearance in prose
 * links to its own anchor in the methodology's definitions list, and carries
 * the one-line meaning as a `title` for anyone who only hovers.
 *
 * Set in mono, like every other value the checker produced. The underline is
 * the site's ordinary link treatment — no colour, since colour on this site
 * belongs to measurement.
 */
export function StatusWord({ status }: { status: string }) {
  return (
    <Link
      href={`/methodology${statusAnchor(status)}`}
      title={statusLabel(status)}
      className="font-mono text-text underline decoration-line decoration-dotted underline-offset-4 transition-colors hover:decoration-edge"
    >
      {status}
    </Link>
  );
}
