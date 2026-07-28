import { notCheckedClasses, statusClasses } from "@/lib/status";

/**
 * Seven small chips, side by side — the whole ladder at a glance, and never
 * summed. Do not add a count, a fraction, or a sort key derived from these:
 * that is the one aggregate this product refuses to compute.
 *
 * The ladder has seven rungs by design (see /methodology), but any run may
 * not have reached every one for a given agent — a short-circuited pipeline
 * (rung 2 errors, so rung 3 never runs) or a rung not yet implemented (rung
 * 6, currently) both mean "no row", which is rendered as "not checked" and
 * is visually distinct from `skipped`, a status the API actively assigned.
 */
const LADDER_SIZE = 7;

export function RungChips({
  rungs,
}: {
  rungs: { rung: number; name: string; status: string }[];
}) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: LADDER_SIZE }, (_, i) => i + 1).map((n) => {
        const r = byRung.get(n);
        return (
          <span
            key={n}
            title={r ? `rung ${n} · ${r.name}: ${r.status}` : `rung ${n}: not checked`}
            className={`rounded border px-1.5 py-0.5 text-xs tabular-nums ${
              r ? statusClasses(r.status) : notCheckedClasses
            }`}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}
