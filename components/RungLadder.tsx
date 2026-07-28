import type { RungDetail } from "@/lib/api/schemas";
import { notCheckedClasses, statusClasses } from "@/lib/status";
import { EvidenceTable } from "./EvidenceTable";

const LADDER_SIZE = 7;

/** The ladder vertically, one rung per row, evidence rendered in full underneath
 * each. A rung with no row this run (short-circuited, or not yet implemented)
 * renders as "not checked" — never a guessed status, never folded into the
 * rungs around it. */
export function RungLadder({ rungs }: { rungs: RungDetail[] }) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));

  return (
    <ol className="mt-6 space-y-4">
      {Array.from({ length: LADDER_SIZE }, (_, i) => i + 1).map((n) => {
        const r = byRung.get(n);
        return (
          <li key={n} className="rounded-xl bg-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">
                Rung {n}
                {r && <span className="text-muted"> · {r.name}</span>}
              </h3>
              <span
                className={`rounded border px-2 py-0.5 text-sm ${
                  r ? statusClasses(r.status) : notCheckedClasses
                }`}
              >
                {r ? r.status : "not checked"}
              </span>
            </div>
            {r ? (
              <>
                <EvidenceTable evidence={r.evidence} />
                <p className="mt-2 text-xs text-dead">checked {r.checked_at}</p>
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
