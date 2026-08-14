/**
 * Product metadata: whether an instrument is live. NOT a rung status.
 *
 * Rung statuses are coloured, glyphed, bordered chips whose words come from
 * the API verbatim. This tag is none of those things on purpose — it is the
 * site talking about itself, so it gets no colour, no glyph, no border, and
 * its two words are hardcoded here. It must never be routed through
 * `lib/status.ts`, and nothing in it may ever read as a verdict on an agent.
 */
export function StatusTag({ status }: { status: "live" | "in development" }) {
  // Spelled out rather than the `label` utility so the colour cannot lose a
  // specificity race with it (see the note in Section.tsx).
  const tone = status === "live" ? "text-muted" : "text-dead";
  return (
    <span
      className={`font-mono text-[0.6875rem] uppercase leading-none tracking-[0.14em] ${tone}`}
    >
      {status}
    </span>
  );
}
