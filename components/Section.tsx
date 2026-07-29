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
}: {
  title: string;
  aside?: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={title} className={className}>
      <div className="ruled">
        <h2 className="label text-muted">{title}</h2>
        <span className="ruled-line" />
        {aside && <span className="label">{aside}</span>}
      </div>
      {intro && (
        <div className="mt-4 max-w-prose text-sm leading-relaxed text-muted">{intro}</div>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
