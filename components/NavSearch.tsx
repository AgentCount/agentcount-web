/**
 * The search box, in the masthead on every page.
 *
 * ## Why it is a plain form
 *
 * A native `method="get"` form, exactly like `DirectoryControls`: submitting
 * navigates to `/directory?q=…`, which is a real, bookmarkable, shareable URL
 * rendered on the server. There is no `useState`, no `router.push`, and no
 * client bundle — this app ships two client components in total, and a search
 * box that needs JavaScript to put a string in a query parameter would be the
 * third for no gain. It also means search works before hydration and with
 * scripting off, which for a public register is the point.
 *
 * ## What it actually searches
 *
 * The API's `q` covers agent name, description, and an owner-address prefix —
 * NOT the on-chain agent id (see `listAgents` in `lib/api/endpoints.ts`). The
 * placeholder says so rather than implying a universal lookup, because the
 * fastest way to lose a reader is to promise a search that silently returns
 * nothing for the thing they pasted. Numeric-id lookup is handled inside the
 * directory, which can offer the agent permalink per chain once it knows no
 * name matched.
 */
export function NavSearch() {
  return (
    <form
      method="get"
      action="/directory"
      role="search"
      className="flex w-full items-stretch sm:w-auto"
    >
      <label htmlFor="nav-q" className="sr-only">
        Search agents by name, description or owner address
      </label>
      <input
        id="nav-q"
        type="search"
        name="q"
        placeholder="Search name, description or owner"
        // `w-full` on mobile where the form owns its own row; a fixed measure
        // from `sm` up, where it shares the masthead with the nav and must not
        // push the CTA off the end.
        className="w-full border border-line bg-panel px-2.5 py-1.5 font-mono text-xs text-text placeholder:text-dead focus:border-edge focus:outline-none sm:w-56"
      />
      <button
        type="submit"
        className="-ml-px border border-line px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted transition-colors hover:border-edge hover:text-text"
      >
        Find
      </button>
    </form>
  );
}
