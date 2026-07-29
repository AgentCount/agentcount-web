import type { Finding } from "@/lib/api/schemas";

/**
 * One headline number, large, with one line of plain-English context.
 *
 * ## The number is never computed here
 *
 * `percent` arrives from the API already divided (see
 * `crates/api/src/routes/findings.rs`). This component formats it to one
 * decimal place and prints the numerator and denominator underneath, verbatim.
 * A rate whose denominator is hidden is the easiest way to mislead with a true
 * number, so the denominator is not optional decoration here — it is part of
 * the claim.
 *
 * ## It is not a score
 *
 * Each of these is a population count over one run: how many agents or
 * documents landed in one state, out of how many were asked. None of them is
 * an aggregate across rungs, and none of them says anything about any
 * individual agent.
 */
export function FindingTile({
  finding,
  children,
}: {
  finding: Finding;
  /** The one line of context. Editorial prose belongs in the page, not the
   * API — but every figure inside it must still come from `finding`. */
  children: React.ReactNode;
}) {
  return (
    <div className="border-t-2 border-line pt-4">
      <div className="text-5xl font-bold tabular-nums tracking-tight">
        {finding.percent === null ? "—" : `${finding.percent.toFixed(1)}%`}
      </div>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text">{children}</p>
      <p className="mt-2 font-mono text-xs text-dead">
        {finding.numerator.toLocaleString("en-US")} of{" "}
        {finding.denominator.toLocaleString("en-US")} {finding.denominator_label}
      </p>
    </div>
  );
}

/** Same shape, for a finding that is a bare count rather than a rate. */
export function CountTile({
  value,
  source,
  children,
}: {
  value: number;
  /** Where the number came from, so it is as auditable as a rate's
   * denominator. */
  source: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t-2 border-line pt-4">
      <div className="text-5xl font-bold tabular-nums tracking-tight">
        {value.toLocaleString("en-US")}
      </div>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text">{children}</p>
      <p className="mt-2 font-mono text-xs text-dead">{source}</p>
    </div>
  );
}
