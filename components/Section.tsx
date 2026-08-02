/**
 * A titled section whose rule runs to the far edge of its column.
 *
 * This replaced the bordered card. A page of `rounded-xl bg-panel p-6` blocks
 * reads as a dashboard — every region equally weighted, every region shouting
 * the same amount — which is the opposite of what a register should feel like.
 * A micro-label with a hairline running off to the right groups content just
 * as clearly, costs no visual weight, and lets density come from the data
 * instead of from decoration.
 *
 * `aside` carries the count or scope that belongs to the heading rather than
 * to the body: "60,097 agents", "6 of 7 implemented" — facts about the
 * section, printed in mono at the end of the rule.
 */
export function Section({
  title,
  aside,
  intro,
  children,
  className = "",
  id,
}: {
  title: string;
  aside?: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Anchor target, for in-page links like the hero's "provenance ↓". */
  id?: string;
}) {
  return (
    <section aria-label={title} className={className} id={id}>
      <div className="ruled">
        <h2 className="label text-muted">{title}</h2>
        <span className="ruled-line" />
        {/* Muted rather than dead: the aside is load-bearing — it often names
            the SCOPE of the section ("base rates on bsc"), and a scope printed
            at the floor of legibility is how a reader misses that the page
            changed subject. Spelled out rather than using the `label` utility
            so the colour cannot lose a specificity race. */}
        {aside && (
          <span className="font-mono text-[0.6875rem] uppercase leading-none tracking-[0.14em] text-muted">
            {aside}
          </span>
        )}
      </div>
      {intro && (
        <div className="mt-4 max-w-prose text-sm leading-relaxed text-muted">{intro}</div>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
