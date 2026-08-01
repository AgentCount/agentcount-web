import { checkFor, questionFor } from "@/lib/checks";
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
export function RungLadder({
  rungs,
  chain,
  notApplicable,
}: {
  rungs: RungDetail[];
  chain: string;
  /**
   * Why a rung is absent, in the API's own words, when the caller knows.
   *
   * The census's reason for an absent rung ("this run never reached it") is
   * not the pre-flight checker's reason ("no on-chain agent id exists until
   * the document is minted") — there is no run and no agent in that context.
   * Rather than have this component guess which situation it is in, the caller
   * passes the reasons it was given. Absent → the census wording, which is the
   * only case that existed before.
   */
  notApplicable?: { rung: number; name: string; reason: string }[];
}) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));
  const naByRung = new Map((notApplicable ?? []).map((n) => [n.rung, n]));

  return (
    <ol>
      {Array.from({ length: LADDER_SIZE }, (_, i) => i + 1).map((n) => {
        const r = byRung.get(n);
        const na = naByRung.get(n);
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
                {/* The plain question leads; the checker's own name sits
                    beside it in mono, because that is the word the evidence
                    below and a downloaded archive are keyed by. Both, so a
                    reader can follow either vocabulary without a lookup. */}
                <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-sans text-base font-semibold text-text">
                    {questionFor(n, r?.name ?? na?.name)}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.1em] text-dead">
                    rung {n} · {r?.name ?? na?.name ?? "—"}
                  </span>
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
              <p className="mt-1.5 text-xs text-muted">{checkFor(n)?.meaning}</p>
              <p className="mt-1 text-xs text-dead">{label}</p>

              {r ? (
                <>
                  <EvidenceTable evidence={r.evidence} chain={chain} />
                  <p className="mt-4 font-mono text-[0.6875rem] text-dead">
                    checked at {r.checked_at}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {na?.reason ?? "This run never reached this check for this agent."}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
