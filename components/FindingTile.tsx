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

/**
 * The frame the three tile kinds share: hairline top rule, the small ordinal
 * riding it, the context sentence, and the mono source line pinned to the
 * bottom. What sits in the numeral slot is the only thing that differs, so
 * it is the only thing the callers provide.
 */
function TileFrame({
  index,
  numeral,
  footer,
  children,
}: {
  index: number;
  numeral: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full flex-col border-t border-edge pt-5">
      <span className="label absolute -top-px right-0 hidden translate-y-[-50%] bg-bg pl-2 xl:block">
        {String(index).padStart(2, "0")}
      </span>
      {numeral}
      <p className="mt-4 max-w-[34ch] flex-1 text-[0.9375rem] leading-relaxed text-muted">
        {children}
      </p>
      <p className="mt-4 border-t border-line pt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
        {footer}
      </p>
    </div>
  );
}

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
    <TileFrame
      index={index}
      numeral={
        <div className="numeral text-[clamp(3.5rem,6vw,5.25rem)] text-text">
          {finding.percent === null ? "—" : finding.percent.toFixed(1)}
          <span className="ml-0.5 text-[0.45em] font-medium text-muted">%</span>
        </div>
      }
      footer={
        <>
          {finding.numerator.toLocaleString("en-US")} /{" "}
          {finding.denominator.toLocaleString("en-US")}{" "}
          {humaniseRungs(finding.denominator_label)}
        </>
      }
    >
      {children}
    </TileFrame>
  );
}

/**
 * Same shape, for a position in the row that carries no figure.
 *
 * The row is four questions, and the fourth — does money reach the agent — is
 * not one of the seven checks: it is read from token transfer logs the census
 * database does not hold, so no run produces a number for it. A tile that
 * printed one anyway would be the only figure on this page not recomputable
 * from a run id.
 *
 * `lead` takes a short phrase in place of the numeral so the tile still reads
 * as a member of the row rather than as a rendering fault, and it is set in
 * `text-muted` because it is not a finding.
 */
export function NoteTile({
  index,
  lead,
  source,
  children,
}: {
  index: number;
  /** A phrase, never a quantity — a tile with no number must not imply one. */
  lead: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <TileFrame
      index={index}
      numeral={
        <div className="numeral text-[clamp(1.5rem,2.4vw,2rem)] leading-tight text-muted">
          {lead}
        </div>
      }
      footer={source}
    >
      {children}
    </TileFrame>
  );
}

/**
 * Same shape, for a finding that is a bare count rather than a rate.
 *
 * Currently unused: the one tile that was a count is a `NoteTile` until the
 * payments pipeline writes a figure into a pinned run. Kept because that
 * figure is a count, and this is the tile it lands in.
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
    <TileFrame
      index={index}
      numeral={
        <div className="numeral text-[clamp(3.5rem,6vw,5.25rem)] text-text">
          {value.toLocaleString("en-US")}
        </div>
      }
      footer={source}
    >
      {children}
    </TileFrame>
  );
}
