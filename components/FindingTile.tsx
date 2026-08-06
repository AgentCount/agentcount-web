import type { Finding } from "@/lib/api/schemas";
import { humaniseRungs } from "@/lib/checks";

/**
 * One headline number, set large, with one line of plain-English context.
 *
 * ## The typography is the illustration
 *
 * There are no charts, icons or images on the homepage — the brief for this
 * product is that the numbers are the design. So a finding is built from three
 * sizes and one hairline: an index number, a condensed numeral at display
 * size, the sentence, and the populations in mono underneath. The rule above
 * each tile is what groups them into a row without drawing four boxes.
 *
 * ## The number is never computed here
 *
 * `percent` arrives from the API already divided (see
 * `crates/api/src/routes/findings.rs`). This component formats it to one
 * decimal place and prints the numerator and denominator underneath, verbatim.
 * A rate whose denominator is hidden is the easiest way to mislead with a true
 * number, so the denominator is not decoration — it is part of the claim, and
 * it is set in the same mono as every other machine-produced value on the
 * site.
 *
 * ## It is not a score
 *
 * Each of these is a population count over one run: how many agents or
 * documents landed in one state, out of how many were asked. None is an
 * aggregate across rungs, and none says anything about any individual agent.
 */
export function FindingTile({
  index,
  finding,
  children,
}: {
  /** Position in the row, printed as a small ordinal. It orders the reading,
   * it does not rank the findings. */
  index: number;
  finding: Finding;
  /** The one line of context. Editorial prose belongs in the page, not the
   * API — but every figure inside it must still come from `finding`. */
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full flex-col border-t border-edge pt-5">
      <span className="label absolute -top-px right-0 hidden translate-y-[-50%] bg-bg pl-2 xl:block">
        {String(index).padStart(2, "0")}
      </span>
      <div className="numeral text-[clamp(3.5rem,6vw,5.25rem)] text-text">
        {finding.percent === null ? "—" : finding.percent.toFixed(1)}
        <span className="ml-0.5 text-[0.45em] font-medium text-muted">%</span>
      </div>
      <p className="mt-4 max-w-[34ch] flex-1 text-[0.9375rem] leading-relaxed text-muted">
        {children}
      </p>
      <p className="mt-4 border-t border-line pt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
        {finding.numerator.toLocaleString("en-US")} / {finding.denominator.toLocaleString("en-US")}{" "}
        {humaniseRungs(finding.denominator_label)}
      </p>
    </div>
  );
}

/**
 * Same shape, for a position in the row that has no publishable number.
 *
 * The fourth tile used to print 358 agents ever paid. That figure was
 * withdrawn on 2026-08-06 pending a rebuilt payments pipeline, and the
 * honest rendering of a withdrawn number is not a smaller number — it is
 * none. `lead` takes a short status word in place of the numeral so the tile
 * still reads as a member of the row rather than as a rendering fault, and it
 * is set in `text-muted` because a status is not a finding.
 */
export function NoteTile({
  index,
  lead,
  source,
  children,
}: {
  index: number;
  /** A status, never a quantity. "under revision", not "0". */
  lead: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full flex-col border-t border-edge pt-5">
      <span className="label absolute -top-px right-0 hidden translate-y-[-50%] bg-bg pl-2 xl:block">
        {String(index).padStart(2, "0")}
      </span>
      <div className="numeral text-[clamp(1.5rem,2.4vw,2rem)] leading-tight text-muted">
        {lead}
      </div>
      <p className="mt-4 max-w-[34ch] flex-1 text-[0.9375rem] leading-relaxed text-muted">
        {children}
      </p>
      <p className="mt-4 border-t border-line pt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
        {source}
      </p>
    </div>
  );
}

/**
 * Same shape, for a finding that is a bare count rather than a rate.
 *
 * Unused since 2026-08-06, when the one count on the homepage was withdrawn
 * and became a `NoteTile`. Kept because the replacement for that figure is a
 * count too: AgentCount/agentcount#35 ends with a pinned number going back
 * into tile four, and deleting this would mean writing it again.
 */
export function CountTile({
  index,
  value,
  source,
  children,
}: {
  index: number;
  value: number;
  /** Where the number came from, so it is as auditable as a rate's
   * denominator. */
  source: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full flex-col border-t border-edge pt-5">
      <span className="label absolute -top-px right-0 hidden translate-y-[-50%] bg-bg pl-2 xl:block">
        {String(index).padStart(2, "0")}
      </span>
      <div className="numeral text-[clamp(3.5rem,6vw,5.25rem)] text-text">
        {value.toLocaleString("en-US")}
      </div>
      <p className="mt-4 max-w-[34ch] flex-1 text-[0.9375rem] leading-relaxed text-muted">
        {children}
      </p>
      <p className="mt-4 border-t border-line pt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
        {source}
      </p>
    </div>
  );
}
