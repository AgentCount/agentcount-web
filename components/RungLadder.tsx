import type { RungDetail } from "@/lib/api/schemas";
import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  statusClasses,
  statusGlyph,
  statusLabel,
} from "@/lib/status";
import { EvidenceTable } from "./EvidenceTable";

const LADDER_SIZE = 7;

/**
 * The ladder vertically, one rung per row, evidence rendered in full
 * underneath — not summarised. The evidence is the product.
 *
 * Each rung is a numbered entry against a hairline, with the rung's index set
 * large and dim in the left margin like a printed clause number. A rung with
 * no row this run (short-circuited, or not yet implemented) renders as "not
 * checked": never a guessed status, never folded into the rungs around it, and
 * never a failure.
 *
 * Each rung gets an `id`, so a link can point at one rung of one agent —
 * `/agent/base/1#rung-4` is the most specific thing this site can be asked to
 * show, and it is exactly the granularity an argument about an agent tends to
 * need.
 */
export function RungLadder({ rungs, chain }: { rungs: RungDetail[]; chain: string }) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));

  return (
    <ol>
      {Array.from({ length: LADDER_SIZE }, (_, i) => i + 1).map((n) => {
        const r = byRung.get(n);
        const label = r ? statusLabel(r.status) : NOT_CHECKED_LABEL;
        return (
          <li
            key={n}
            id={`rung-${n}`}
            className="grid scroll-mt-4 grid-cols-[2.25rem_1fr] gap-x-4 border-t border-line py-5"
          >
            <span
              aria-hidden="true"
              className={`numeral text-3xl ${r ? "text-dead" : "text-line"}`}
            >
              {n}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-text">
                  {r ? r.name : "—"}
                </h3>
                <span
                  title={label}
                  className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-xs ${
                    r ? statusClasses(r.status) : "border-dashed border-line text-dead"
                  }`}
                >
                  <span aria-hidden="true">
                    {r ? statusGlyph(r.status) : NOT_CHECKED_GLYPH}
                  </span>
                  {r ? r.status : "not checked"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-dead">{label}</p>

              {r ? (
                <>
                  <EvidenceTable evidence={r.evidence} chain={chain} />
                  <p className="mt-4 font-mono text-[0.6875rem] text-dead">
                    checked at {r.checked_at}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  This run never reached this rung for this agent.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
