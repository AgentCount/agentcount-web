/**
 * The search box, in the masthead on every page.
 *
 * ## Why it is a plain form
 *
 * A native `method="get"` form, exactly like `DirectoryControls`: submitting
 * navigates to `/directory?q=…`, which is a real, bookmarkable, shareable URL
 * rendered on the server. There is no `useState`, no `router.push`, and no
 * client bundle — this app ships six client components in total (see
 * `PageTransition.tsx` for the newest), and a search box that needs JavaScript to
 * put a string in a query parameter would be one more for no gain. It also
 * means search works before hydration and with scripting off, which for a
 * public register is the point.
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
      action="/search"
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
        placeholder="Agent name or 0x owner address"
        // `w-full` on mobile where the form owns its own row; a fixed measure
        // from `sm` up, where it shares the masthead with the nav and must not
        // push the CTA off the end.
        //
        // No focus ring at all: on focus the input's own 1px border turns
        // `border-accent` instead — see the `#nav-q:focus-visible` rule in
        // `globals.css`, which switches the shared ring off for this id so
        // this colour change is the only thing that moves. That rule can't
        // live as a Tailwind utility itself (unlayered CSS always beats a
        // layered one), but the colour change can, since it does not
        // compete with the shared rule for the same property.
        //
        // `focus-visible:z-10`: the button sits `-ml-px` left of this input
        // so the two share one hairline instead of drawing it twice — which
        // means whichever element paints later (the button, since it is
        // next in the DOM) owns that shared pixel. Flex items read z-index
        // without needing `position` set, so lifting the input above the
        // button only while its own border has turned accent is enough to
        // make that shared edge read as the input's coloured border rather
        // than the button's resting grey one.
        className="h-[38px] w-full border border-line bg-panel px-3.5 py-0 font-mono text-xs text-text placeholder:text-dead transition-colors focus-visible:z-10 focus-visible:border-accent sm:w-72"
      />
      {/* The one hover state on the site with colour in it, beside the
          `:focus-visible` ring every element already gets — see the accent
          exception list at the top of `globals.css` for why this button
          specifically earns it: it is the masthead's one `<button>`, not an
          `<a>`, so the underline convention that tells every other
          interactive element apart never applied here in the first place.
          Resting text is full `text-text` (matching every other masthead
          label) rather than the site's usual muted default, because a
          submit button reading as disabled-grey invites nobody to press
          it; the accent only shows up on hover, same as it does for
          `TextLink`. */}
      <button
        id="nav-find"
        type="submit"
        // Same no-ring, border-turns-accent focus treatment as the input
        // beside it (see that element's own comment and the shared
        // `#nav-find:focus-visible` rule in `globals.css`) — the same
        // colour its hover already turns to, so keyboard focus and mouse
        // hover land on the identical signal instead of two different ones.
        className="-ml-px flex h-[38px] items-center border border-line px-4 py-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-text transition hover:border-accent hover:text-accent focus-visible:border-accent active:scale-[0.97]"
      >
        Find
      </button>
    </form>
  );
}
