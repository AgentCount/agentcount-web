import Link from "next/link";
import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  notCheckedClasses,
  statusClasses,
  statusGlyph,
  statusLabel,
} from "@/lib/status";

/**
 * The six states, spelled out, on every page that shows a badge or a bar.
 *
 * Previously this only existed as inline text under each rate bar, which meant
 * the directory — the page with the most badges on it — explained none of them.
 * A reader who does not already know that `skipped` and "not checked" are
 * different claims cannot learn it from a colour.
 *
 * The status words come from the run's own vocabulary, not a literal list, so
 * this legend cannot describe a status the API no longer produces or omit one
 * it just started producing. "not checked" is appended separately because it is
 * the ABSENCE of a row rather than a status — no run reports it, and it would
 * never appear in a vocabulary drawn from the API.
 */
export function StatusLegend({ statuses }: { statuses: string[] }) {
  return (
    <section
      aria-label="What each status means"
      className="rounded-lg border border-line bg-panel/60 px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted">
          Statuses
        </span>
        {statuses.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`inline-flex min-w-6 items-center justify-center rounded border px-1 py-0.5 font-mono text-xs ${statusClasses(s)}`}
            >
              {statusGlyph(s)}
            </span>
            <span className="text-text">{s}</span>
            <span className="text-muted">— {statusLabel(s)}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`inline-flex min-w-6 items-center justify-center rounded border px-1 py-0.5 font-mono text-xs ${notCheckedClasses}`}
          >
            {NOT_CHECKED_GLYPH}
          </span>
          <span className="text-text">not checked</span>
          <span className="text-muted">— {NOT_CHECKED_LABEL.split("— ")[1]}</span>
        </span>
        <Link href="/methodology" className="text-accent hover:underline">
          Full definitions →
        </Link>
      </div>
    </section>
  );
}
