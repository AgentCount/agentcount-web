/**
 * Colour is styling and may be chosen here; the status word itself is never
 * invented here — every place that renders a status prints the string the
 * API sent, untouched. This function only maps that string to a Tailwind
 * class list, which is why `default` below falls back to a neutral style
 * instead of guessing: a status word this app doesn't recognise yet should
 * still render (verbatim), just without a colour opinion.
 */
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
    default:
      return "border-line text-muted";
  }
}

/** A rung with no row at all was never reached this run — visibly different
 * from `skipped`, which is a status the API actively assigned. This class is
 * for that "not checked" case specifically. */
export const notCheckedClasses = "border-line border-dashed text-muted";

/** Same mapping, as a solid background — used for the population-rate bars on
 * /stats, where a filled segment reads better than an outlined chip. */
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
    default:
      return "bg-line";
  }
}
