import type { RungDetail } from "@/lib/api/schemas";
import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  notCheckedClasses,
  statusClasses,
  statusGlyph,
  statusLabel,
} from "@/lib/status";
import { EvidenceTable } from "./EvidenceTable";

const LADDER_SIZE = 7;

/**
 * The ladder vertically, one rung per section, evidence rendered in full
 * underneath each — not summarised. The evidence is the product.
 *
 * A rung with no row this run (short-circuited, or not yet implemented)
 * renders as "not checked": never a guessed status, never folded into the
 * rungs around it, and never a failure.
 *
 * Each rung gets an `id`, so a link can point at one rung of one agent —
 * `/agent/base/1#rung-4` is the most specific thing this site can be asked to
 * show, and it is exactly the granularity an argument about an agent tends to
 * need.
 */
export function RungLadder({ rungs }: { rungs: RungDetail[] }) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));

  return (
    <ol className="space-y-3">
      {Array.from({ length: LADDER_SIZE }, (_, i) => i + 1).map((n) => {
        const r = byRung.get(n);
        const label = r ? statusLabel(r.status) : NOT_CHECKED_LABEL;
        return (
          <li
            key={n}
            id={`rung-${n}`}
            className="scroll-mt-4 rounded-lg border border-line bg-panel/60 px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">
                <span className="font-mono text-muted">Rung {n}</span>
                {r && <span className="text-muted"> · {r.name}</span>}
              </h3>
              <span
                title={label}
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-sm ${
                  r ? statusClasses(r.status) : notCheckedClasses
                }`}
              >
                <span aria-hidden="true" className="font-mono">
                  {r ? statusGlyph(r.status) : NOT_CHECKED_GLYPH}
                </span>
                {r ? r.status : "not checked"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{label}</p>
            {r ? (
              <>
                <EvidenceTable evidence={r.evidence} />
                <p className="mt-3 font-mono text-xs text-dead">
                  checked at {r.checked_at}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                This run never reached this rung for this agent.
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
