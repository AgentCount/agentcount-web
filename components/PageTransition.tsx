"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The sixth client component in this app, and the fifth by choice.
 *
 * Wraps `<main>`'s content in `app/layout.tsx` so a click in the masthead
 * nav — Findings, Agents, Reports, Data — lands with the same fade-in-up the
 * preflight and spot-check results already use, instead of the new page
 * snapping into place. Same animation, same reasoning: see
 * `--animate-fade-in`'s own doc in `globals.css`. Asked for by name, for
 * navigation specifically — every other entrance on the site still renders
 * with no motion at all, including this one before it existed.
 *
 * `key={pathname}` is what actually causes the retrigger: a CSS `animation`
 * plays on mount, not on update, and without a changing key React would just
 * patch this element's children in place on navigation rather than
 * replacing it. `usePathname()`, not the full URL: a filter, a chain switch
 * or a page of pagination changes only the query string on the SAME page,
 * and re-fading the whole page every time a reader ticks a checkbox would be
 * far more motion than "clicking nav" asked for. A route change — a
 * different pathname — is the one thing this animates.
 *
 * `motion-safe:` (see the animation's own definition) means a reader with
 * `prefers-reduced-motion` gets instant navigation, exactly as before this
 * component existed.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="motion-safe:animate-fade-in">
      {children}
    </div>
  );
}
