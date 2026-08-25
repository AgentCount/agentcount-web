import { StatusTag } from "@/components/StatusTag";
import { TextLink } from "@/components/TextLink";

/**
 * One instrument of the audit layer, as a ruled row: index, a linked title,
 * whether it is live, one paragraph of what it measures, and — when the
 * instrument has published figures — a mono facts line in the same grammar
 * as a finding tile's denominator line.
 *
 * Not currently rendered: the homepage's Instruments section describes its
 * one instrument in a plain paragraph instead, since a list of one is list
 * chrome around a single row. This component is what that section switches
 * to the day a second instrument ships — a new instrument becomes a new row
 * here, and not one day before: nothing unshipped is listed, linked or
 * teased. The row asserts existence, never quality: no colour, no glyph, no
 * box.
 */
export function InstrumentRow({
  index,
  title,
  href,
  status,
  figures,
  children,
}: {
  /** Position in the list, printed as a small ordinal. It orders the
   * instruments by the date they shipped, it does not rank them. */
  index: number;
  title: string;
  href: string;
  status: "live" | "in development";
  /** Mono facts line — population, scope. Only for instruments with
   * published figures; a row without numbers must not imply any. */
  figures?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative border-t border-edge pt-5">
      <span className="label absolute -top-px right-0 hidden translate-y-[-50%] bg-bg pl-2 xl:block">
        {String(index).padStart(2, "0")}
      </span>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h3 className="font-display text-2xl font-semibold tracking-[-0.01em]">
          <TextLink href={href} tone="bright">
            {title}
          </TextLink>
        </h3>
        <StatusTag status={status} />
      </div>
      <p className="mt-3 max-w-[60ch] text-[0.9375rem] leading-relaxed text-muted">
        {children}
      </p>
      {figures !== undefined && (
        <p className="mt-4 border-t border-line pt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
          {figures}
        </p>
      )}
    </div>
  );
}
