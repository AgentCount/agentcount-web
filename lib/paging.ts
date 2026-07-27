/**
 * Page-number arithmetic. The API pages by `offset`; humans page by number.
 *
 * This is the only non-trivial logic in this repo, which is why it is the only
 * thing with its own unit tests: everything else is a render of a `display`
 * string the API already decided.
 */
export const PAGE_SIZE = 50;

/** 1-based, and forgiving: any junk becomes page 1 rather than an error. */
export function pageFromParam(v: string | undefined): number {
  if (!v || !/^\d+$/.test(v)) return 1;
  const n = Number(v);
  return n >= 1 ? n : 1;
}

export function offsetFor(page: number): number {
  return (page - 1) * PAGE_SIZE;
}

/** At least one page, so an empty directory still renders "Page 1 of 1". */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    // Page 1 is the default; omitting it keeps a page-1 link bare instead of
    // carrying a redundant `?page=1`.
    if (k === "page" && v === 1) continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
