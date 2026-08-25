import { Fragment, type ReactNode } from "react";

/**
 * The one motion device layered onto this site's arrow-suffixed links —
 * "Next →", "← Prev", "All reports →" — everywhere they occur, from one
 * place, so a reader who has learned "the arrow moves toward where it
 * points" on one link finds it true on every other one without re-learning
 * it.
 *
 * It moves the glyph, not the sentence: wrapping only the arrow character
 * in its own `inline-block` keeps the label's own colour/underline
 * treatment (owned by `TextLink`, `CtaLink`, `OutboundLink`, each already
 * documented on its own terms) completely untouched, and reads as the
 * arrow leaning toward its destination rather than the whole button
 * lurching. `group-hover` rather than a bare `hover:` on the span itself,
 * because the glyph is usually a few words into the label — the reader's
 * pointer is over the word, not the character, and the nudge has to answer
 * to that.
 *
 * Deliberately narrow: it recognises exactly the two shapes every call site
 * already uses — a trailing " →" / " ↓", a leading "← " — on the FIRST and
 * LAST child only. It does not attempt to find an arrow buried mid-sentence
 * (none exist) or move more than one glyph per link (no call site has two).
 * A caller whose children don't match either shape pass through unchanged,
 * so this is safe to wrap around every link body on the site rather than
 * something that has to be opted into per call site.
 */
const TRAILING_ARROW = / (→|↓)$/;

export function withArrowNudge(children: ReactNode): ReactNode {
  const items = Array.isArray(children) ? children.slice() : [children];
  if (items.length === 0) return children;

  const first = items[0];
  if (typeof first === "string" && first.startsWith("← ")) {
    items[0] = (
      <>
        <span className="inline-block transition-transform group-hover:-translate-x-0.5">
          ←
        </span>
        {first.slice(1)}
      </>
    );
  }

  const lastIndex = items.length - 1;
  const last = items[lastIndex];
  if (typeof last === "string") {
    const match = last.match(TRAILING_ARROW);
    if (match) {
      const arrow = match[1];
      const rest = last.slice(0, last.length - arrow.length);
      // → points along reading direction, so it nudges horizontally; ↓ (the
      // hero's in-page jump) points down the page, so it nudges vertically.
      const move =
        arrow === "→" ? "group-hover:translate-x-0.5" : "group-hover:translate-y-0.5";
      items[lastIndex] = (
        <>
          {rest}
          <span className={`inline-block transition-transform ${move}`}>{arrow}</span>
        </>
      );
    }
  }

  // Fragment-wrapped with an index key rather than returned as a bare array:
  // this runs on every render, so the array is never stable identity, and an
  // un-keyed array of elements embedded via `{...}` is exactly the shape
  // React's list-key check warns on.
  return (
    <>
      {items.map((item, i) => (
        <Fragment key={i}>{item}</Fragment>
      ))}
    </>
  );
}
