/**
 * The loading skeleton, drawn in the register's own vocabulary.
 *
 * Hairlines and dead-tone blocks, no spinner and no colour: colour is
 * reserved for measurement (`globals.css`), and a page that is still loading
 * has measured nothing yet.
 *
 * ## Why these are per-segment files rather than one at the app root
 *
 * A `loading.tsx` turns its segment into a streaming boundary, and a
 * streamed response has already sent its status line by the time the page
 * body runs — so `notFound()` can no longer make the response a 404. A root
 * `loading.tsx` therefore silently turned every missing agent into HTTP 200,
 * which the smoke suite caught. Routes that can answer "no such thing" —
 * `/agent/[chain]/[id]`, `/reports/[slug]` — must not stream, so the loading
 * files live on the segments that only ever answer 200.
 *
 * The homepage is deliberately not among them: giving it one means moving
 * `app/page.tsx` into a route group so the boundary does not cascade to the
 * routes above, and that is a structural change worth doing on its own.
 */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="border-b border-edge pb-6">
        <div className="h-9 w-2/3 max-w-md bg-panel" />
        <div className="mt-5 h-4 w-1/2 max-w-sm bg-panel" />
      </div>
      <div className="mt-10 space-y-6">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-40 bg-panel" />
            <div className="h-[10px] w-full bg-panel" />
          </div>
        ))}
      </div>
    </div>
  );
}
