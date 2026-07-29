/**
 * Status → presentation. The status WORD is never invented here — every place
 * that renders one prints the string the API sent, untouched. This module maps
 * that string to a colour, a glyph, and a spelled-out label.
 *
 * ## Why there is a glyph at all
 *
 * The rung badges used to encode status in colour alone: green border for
 * `pass`, red for `fail`, grey for `skipped`. Red and green are the two
 * hardest colours to tell apart for the ~8% of men with a red-green colour
 * vision deficiency, which made the single densest piece of information in
 * this product unreadable to them — pass and fail, the two statuses whose
 * difference matters most, were the two rendered most similarly.
 *
 * So every status now carries a second, non-colour channel: a distinct glyph,
 * plus a `title`/`aria-label` spelling the status out in words. Colour is now
 * reinforcement, never the carrier.
 *
 * ## Six states, six renderings
 *
 * `pass`, `fail`, `skipped`, `error`, `unclaimed` and "not checked" are six
 * distinct claims and must never collapse into each other. Note especially
 * that `unclaimed` and an unrecognised status share a colour — deliberately,
 * since neither should look like a pass or a fail — and are told apart by
 * their glyph. Without one they were indistinguishable.
 */

/** The four statuses the checker has always produced, plus `unclaimed`
 * (2026-07-29, rung 5 only). Anything else renders verbatim with neutral
 * styling rather than being guessed at as one of these. */
export function statusClasses(status: string): string {
  switch (status) {
    case "pass":
      return "border-live text-live";
    case "fail":
      return "border-fail text-fail";
    case "error":
      return "border-warn text-warn";
    case "skipped":
      return "border-dead text-dead";
    case "unclaimed":
      return "border-line text-muted";
    default:
      return "border-line text-muted";
  }
}

/**
 * The non-colour channel. Chosen to be distinguishable at badge size and to
 * survive a monochrome print or a screenshot run through a colour filter.
 */
export function statusGlyph(status: string): string {
  switch (status) {
    case "pass":
      return "✓";
    case "fail":
      return "✗";
    case "error":
      return "!";
    case "skipped":
      return "–";
    case "unclaimed":
      return "○";
    default:
      return "•";
  }
}

/**
 * The status in words, for a `title` and an `aria-label`. Observational, never
 * judgemental: `fail` is "did not pass", not "broken".
 *
 * An unrecognised status falls back to the API's own word rather than a
 * sentence this app made up about it.
 */
export function statusLabel(status: string): string {
  switch (status) {
    case "pass":
      return "passed";
    case "fail":
      return "did not pass";
    case "error":
      return "the check could not complete";
    case "skipped":
      return "skipped — a rung this one depends on did not pass";
    case "unclaimed":
      return "unclaimed — the document made no claim to check";
    default:
      return status;
  }
}

/** A rung with no row at all was never reached this run — visibly different
 * from `skipped`, which is a status the API actively assigned. Dashed, so it
 * differs from every solid-bordered status by outline as well as by glyph. */
export const notCheckedClasses = "border-line border-dashed text-dead";
export const NOT_CHECKED_GLYPH = "·";
export const NOT_CHECKED_LABEL = "not checked — this run never reached this rung";

/** Same mapping, as a solid background — used for the population-rate bars on
 * the census page, where a filled segment reads better than an outlined chip. */
export function statusBgClasses(status: string): string {
  switch (status) {
    case "pass":
      return "bg-live";
    case "fail":
      return "bg-fail";
    case "error":
      return "bg-warn";
    case "skipped":
      return "bg-dead";
    case "unclaimed":
      return "bg-line";
    default:
      return "bg-line";
  }
}

/**
 * A repeating-stripe overlay for the rate bars, so a stacked bar is readable
 * without colour too. `unclaimed` and `skipped` are the pair most easily
 * confused there — both neutral greys — so only they carry a pattern.
 */
export function statusBarPattern(status: string): string {
  switch (status) {
    case "unclaimed":
      return "bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,.14)_3px,rgba(255,255,255,.14)_6px)]";
    case "skipped":
      return "bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,.10)_4px,rgba(255,255,255,.10)_8px)]";
    default:
      return "";
  }
}
