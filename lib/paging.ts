/**
 * Page-number arithmetic. The API pages by `offset`; humans page by number.
 *
 * This is the only non-trivial logic in this repo, which is why it is the only
 * thing with its own unit tests: everything else is a render of a `display`
 * string the API already decided.
 */
export const PAGE_SIZE = 50;

/**
 * A ceiling on the page number, independent of how many agents actually
 * exist. Without it, a huge digit run (`?page=99999999999999999999`) survives
 * the regex check, overflows `Number`, and produces an offset so large that
 * `String()` renders it in exponent notation — which the Rust side then
 * rejects as an invalid `i64`. Clamping here keeps every downstream integer
 * (and its string form) sane.
 */
export const MAX_PAGE = 1_000_000;

/** 1-based, and forgiving: any junk becomes page 1 rather than an error. */
export function pageFromParam(v: string | undefined): number {
  if (!v || !/^\d+$/.test(v)) return 1;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_PAGE);
}

export function offsetFor(page: number): number {
  return (page - 1) * PAGE_SIZE;
}

/** At least one page, so an empty directory still renders "Page 1 of 1". */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function buildQuery(
  params: Record<string, string | number | string[] | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    // Page 1 is the default; omitting it keeps a page-1 link bare instead of
    // carrying a redundant `?page=1`.
    if (k === "page" && v === 1) continue;
    // Repeated keys, not a comma-joined value: `facet=2:pass&facet=5:pass` is
    // what the filter form itself emits, so a "next page" link built here is
    // byte-identical to the URL the reader already has. Two spellings of the
    // same filter would still work — both parse — but they would look like
    // different pages in a log, a cache key, and a shared link.
    if (Array.isArray(v)) {
      for (const item of v) if (item !== "") q.append(k, item);
      continue;
    }
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
