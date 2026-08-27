"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * One masthead nav link, aware of its own active state.
 *
 * `app/layout.tsx` renders the masthead nav from a Server Component —
 * sensibly, since the fixed four-item list changes only when a page ships,
 * never per request — but knowing which one is CURRENT needs the request's
 * own URL, and a Server Component sees that only as `params`/`searchParams`
 * on the page it renders, not as a plain string the layout could diff
 * against a fixed href. `usePathname` is the client-only way to ask "what
 * page is this", so the comparison is pulled into its own tiny client
 * component rather than making the whole masthead — and by extension
 * everything under it — client-rendered for one boolean. This repo's
 * fourth client component, after `app/error.tsx`, `SpotCheck.tsx` and
 * `PreflightForm.tsx` — see `NavSearch.tsx`'s own doc for why the count is
 * kept low on purpose.
 *
 * `aria-current="page"` is the semantic signal a screen reader keys off,
 * and it is the hook the stylesheet keys off as well; the colour and
 * underline are its visual expression, styled from `globals.css`'s
 * `nav[aria-label="Main"] a[aria-current="page"]` rule rather than a
 * Tailwind colour class here — see that rule's own comment for why. One
 * attribute carrying both is what keeps the announced state and the visible
 * state from drifting apart. This is one of the handful of places the brand
 * accent is allowed to appear at all; see the design-system comment at the
 * top of `globals.css`.
 */
export function NavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  /**
   * Current means "inside this section", not "at this exact URL".
   *
   * An exact match was losing the indicator on every child route: a reader
   * on `/reports/linkage` or on a report's own permalink was demonstrably
   * inside Reports and saw no nav item marked at all, which is worse than
   * no indicator anywhere — it reads as "you have left the site's four
   * places" rather than "you are deeper in one of them". `/reports` is the
   * only NAV entry with children today; the rule is written generally so
   * the next section to grow one does not have to rediscover this.
   *
   * The `/` guard matters: a bare `startsWith(href)` would mark `/data`
   * current on a future `/database`, and — if `/` ever joined NAV — would
   * mark it current on every page on the site.
   */
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${className} border-b-2 border-transparent py-[13px] transition-colors hover:text-text`}
    >
      {children}
    </Link>
  );
}
