/**
 * Status → presentation. The status WORD is never invented here — every place
 * that renders one prints the string the API sent, untouched. This module maps
 * that string to a colour, a glyph, and a spelled-out label.
 *
 * ## These are the only saturated colours in the product
 *
 * The rest of the interface is monochrome by design (see `globals.css`):
 * colour is reserved for measurement, so a rung status is the only thing on
 * any page allowed to be a hue. That makes these six values load-bearing
 * rather than decorative — changing one changes the only visual vocabulary
 * the site has.
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
 * So every status carries a second, non-colour channel: a distinct glyph, plus
 * a `title`/`aria-label` spelling the status out in words. Colour is
 * reinforcement, never the carrier.
 *
 * ## Six states, six renderings
 *
 * `pass`, `fail`, `skipped`, `error`, `unclaimed` and "not checked" are six
 * distinct claims and must never collapse into each other. `unclaimed` has its
 * own cool blue — it used to share the neutral grey of an unrecognised status,
 * which meant the one status the checker invented for "there was nothing here
 * to check" looked like a status this app had never heard of.
 */

type StatusStyle = {
  /** Border + text, for outlined chips. */
  chip: string;
  /** Text colour alone, for the rung register — its cells share one neutral
   * frame, so they colour the glyph rather than their own border. */
  ink: string;
  /** Solid fill, for the rate bars. */
  fill: string;
  glyph: string;
  label: string;
};

/**
 * The closed set this app has styling for. A status outside it still renders —
 * verbatim, in neutral — rather than being guessed at as one of these.
 */
const STATUS: Record<string, StatusStyle> = {
  pass: {
    ink: "text-live",
    chip: "border-live/45 text-live",
    fill: "bg-live",
    glyph: "✓",
    label: "passed",
  },
  fail: {
    ink: "text-fail",
    chip: "border-fail/45 text-fail",
    fill: "bg-fail",
    glyph: "✗",
    label: "did not pass",
  },
  error: {
    ink: "text-warn",
    chip: "border-warn/45 text-warn",
    fill: "bg-warn",
    glyph: "!",
    label: "the check could not complete",
  },
  skipped: {
    ink: "text-dim",
    chip: "border-dim/40 text-dim",
    fill: "bg-dim",
    glyph: "–",
    label: "skipped — a rung this one depends on did not pass",
  },
  unclaimed: {
    ink: "text-claim",
    chip: "border-claim/40 text-claim",
    fill: "bg-claim",
    glyph: "○",
    label: "unclaimed — the document made no claim to check",
  },
};

const UNRECOGNISED: StatusStyle = {
  ink: "text-muted",
  chip: "border-line text-muted",
  fill: "bg-line",
  glyph: "•",
  label: "",
};

function styleFor(status: string): StatusStyle {
  return STATUS[status] ?? UNRECOGNISED;
}

export function statusClasses(status: string): string {
  return styleFor(status).chip;
}

/** Text colour only — for the rung register, whose cells share one frame. */
export function statusInkClass(status: string): string {
  return styleFor(status).ink;
}

/** The non-colour channel. Chosen to be distinguishable at badge size and to
 * survive a monochrome print or a screenshot run through a colour filter. */
export function statusGlyph(status: string): string {
  return styleFor(status).glyph;
}

/**
 * The status in words, for a `title` and an `aria-label`. Observational, never
 * judgemental: `fail` is "did not pass", not "broken".
 *
 * An unrecognised status falls back to the API's own word rather than a
 * sentence this app made up about it.
 */
export function statusLabel(status: string): string {
  return styleFor(status).label || status;
}

/** Same mapping, as a solid background — used for the population-rate bars on
 * the census page, where a filled segment reads better than an outlined chip. */
export function statusBgClasses(status: string): string {
  return styleFor(status).fill;
}

/** A rung with no row at all was never reached this run — visibly different
 * from `skipped`, which is a status the API actively assigned. Dashed, so it
 * differs from every solid-bordered status by outline as well as by glyph. */
export const notCheckedClasses = "border-dashed border-line text-dead";
export const NOT_CHECKED_GLYPH = "·";
// Worded to be true wherever it appears. The census means "this run never
// reached it"; the pre-flight checker means "a draft cannot answer it". Both
// are "never asked", and the specific reason is carried per rung by
// `RungLadder`'s `notApplicable`.
export const NOT_CHECKED_LABEL = "not checked — this rung was never asked";

/**
 * A repeating-stripe overlay for the rate bars, so a stacked bar is readable
 * without colour too. Applied to the two statuses most easily confused at a
 * glance in a stacked bar — the neutral `skipped` and the cool `unclaimed`.
 */
export function statusBarPattern(status: string): string {
  switch (status) {
    case "unclaimed":
      return "bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(8,9,11,.35)_3px,rgba(8,9,11,.35)_6px)]";
    case "skipped":
      return "bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(232,228,220,.10)_4px,rgba(232,228,220,.10)_8px)]";
    default:
      return "";
  }
}
