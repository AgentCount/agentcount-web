/**
 * Product metadata: whether an instrument is live. NOT a rung status.
 *
 * Rung statuses are coloured, glyphed, bordered chips whose words come from
 * the API verbatim. This tag is still none of those things — no border, and
 * its two words are hardcoded here rather than read from anywhere. It must
 * never be routed through `lib/status.ts`, and nothing in it may ever read
 * as a verdict on an agent.
 *
 * What DID change, deliberately and on request: the live state now carries
 * the brand accent and a small dot. This is a real departure from what this
 * file used to say — "it is the site talking about itself, so it gets no
 * colour, no glyph" — so the reasoning is worth writing down rather than
 * quietly deleting:
 *
 *   * The accent is not one of the five rung hues (`live`/`fail`/`warn`/
 *     `dim`/`claim` in `globals.css`). A reader cannot mistake a cyan dot
 *     for a verdict, because no verdict is ever cyan. That is the property
 *     that made the accent safe in the other five places it appears, and it
 *     is the same property here.
 *   * The dot is not a status glyph. `lib/status.ts` pairs every rung with
 *     a spelled-out word AND a glyph precisely so colour is never the sole
 *     carrier of meaning; here the word "live" carries all of it and the
 *     dot carries none, so removing the colour would lose nothing. That is
 *     the test this passes and a rung badge would fail.
 *   * `in development` stays exactly as it was — dead grey, no dot. Only
 *     one of the two states is ever decorated, so the pair still reads as
 *     a difference in fact rather than a difference in emphasis.
 *
 * The cost, stated plainly: `globals.css` opens with "colour is reserved
 * for measurement", and this is the seventh place that is not true. It is
 * the one the site points at itself, which is the one that argument least
 * wants to lose. Kept because the accent cannot be read as a verdict, not
 * because the rule stopped mattering.
 */
export function StatusTag({ status }: { status: "live" | "in development" }) {
  // Spelled out rather than the `label` utility so the colour cannot lose a
  // specificity race with it (see the note in Section.tsx).
  const live = status === "live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase leading-none tracking-[0.14em] ${
        live ? "text-accent" : "text-dead"
      }`}
    >
      {live && (
        // `aria-hidden`: the word beside it already says "live", and a
        // screen reader announcing a bullet before it would be noise, not
        // information.
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      )}
      {status}
    </span>
  );
}
