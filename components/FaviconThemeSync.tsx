"use client";

import { useEffect } from "react";

/**
 * The seventh client component in this app, and the sixth by choice.
 *
 * `app/icon.svg` already carries the fix for dark mode on its own — an
 * embedded `@media (prefers-color-scheme:light)` rule that swaps the tally
 * bars' stroke, no script involved (see that file, and the geometry it
 * comes from in `lib/tally.ts`). That covers every fresh page load. What it
 * does not cover: a reader who already has the tab open when their OS
 * flips theme, say at sunset. Chromium and Firefox both decode a favicon
 * once, at the moment they first draw the tab strip, and do not re-decode
 * it just because a media query inside it now evaluates differently — the
 * `<link>` sits there unchanged, so the icon in the tab stays whatever it
 * was at load until something makes the browser fetch it again.
 *
 * This component's only job is to be that something: it listens for
 * `(prefers-color-scheme: dark)` flipping, and re-points the icon
 * `<link>`'s `href` at itself with a cache-busting query string. That is a
 * genuine re-fetch, not a no-op — the browser decodes the SVG again, and
 * this time the embedded media query is evaluated against the new theme.
 * No colour, geometry, or logic lives here; all of it stays in `icon.svg`,
 * exactly as before this component existed. Delete this component and the
 * site is still correct on every load — just a refresh behind on a theme
 * flip mid-session.
 *
 * Renders nothing, `null` always. The DOM node it touches is `<head>`'s own
 * `<link rel="icon">`, which Next.js emits from the `app/icon.svg` file
 * convention, not from anything this component writes.
 */
export function FaviconThemeSync() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");

    function resync() {
      const link = document.querySelector<HTMLLinkElement>(
        'link[rel="icon"][type="image/svg+xml"]',
      );
      if (!link) return;
      const url = new URL(link.href, window.location.origin);
      url.searchParams.set("t", Date.now().toString());
      link.href = url.toString();
    }

    query.addEventListener("change", resync);
    return () => query.removeEventListener("change", resync);
  }, []);

  return null;
}
