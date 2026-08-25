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
  heading = "label",
}: {
  title: string;
  aside?: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Anchor target, for in-page links like the hero's "provenance ↓". */
  id?: string;
  /**
   * How the title is set. `"label"` is the site's default and stays the
   * default: a micro-label inline with the rule, which is what the other
   * eight files calling this component want, and what keeps a subsection
   * inside an agent's detail page from shouting as loudly as the page it
   * sits on.
   *
   * `"display"` is the chapter head — the title large and bold on the left,
   * the aside pushed to the right, and the rule moved BELOW the pair rather
   * than threaded between them. Scoped deliberately to `app/page.tsx`'s
   * three top-level sections (Instruments, What we found, Provenance): the
   * homepage is the one page whose sections are chapters rather than
   * shelves — each one changes the subject completely — so it is the one
   * page where a section head is worth a display size and a rule of its
   * own. Adding it as a variant rather than changing the default is what
   * keeps that scope true — grep for `heading="display"` to see every place
   * it applies.
   */
  heading?: "label" | "display";
}) {
  if (heading === "display") {
    return (
      <section aria-label={title} className={className} id={id}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-line pb-3">
          <h2 className="font-display text-[1.75rem] font-bold leading-none text-text">
            {title}
          </h2>
          {aside && (
            <span className="font-mono text-[0.6875rem] uppercase leading-none tracking-[0.14em] text-muted">
              {aside}
            </span>
          )}
        </div>
        {intro && (
          <div className="mt-5 max-w-prose text-sm leading-relaxed text-muted">{intro}</div>
        )}
        <div className="mt-6">{children}</div>
      </section>
    );
  }

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
