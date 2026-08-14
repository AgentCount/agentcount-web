import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Ship the report markdown with the function that reads it.
   *
   * Next decides what a serverless bundle contains by tracing the imports and
   * `fs` calls it can see statically. `lib/reports-content.ts` builds its path
   * at runtime from `process.cwd()` and a slug, which is invisible to that
   * trace, so without this the deployed bundle carries the route and not the
   * files — and `/reports/<slug>` fails with ENOENT on a page that works
   * perfectly in local dev, where the whole repository is on disk anyway.
   *
   * Keyed by route rather than set globally, so adding a large asset somewhere
   * else does not silently start inflating every function.
   */
  outputFileTracingIncludes: {
    "/reports/[slug]": ["./content/reports/**"],
    /**
     * Same disease, different organ: `lib/og.tsx` reads the two IBM Plex Mono
     * TTFs with a `process.cwd()`-relative path at request time, so the trace
     * cannot see them either. Every `opengraph-image` route renders through
     * that module; without the fonts in the bundle each card route 500s in
     * production only.
     */
    "/**/opengraph-image": ["./lib/fonts/*.ttf"],
    "/opengraph-image": ["./lib/fonts/*.ttf"],
  },
};

/**
 * Every URL this site has ever published still resolves.
 *
 * Four sections were folded into the pages that already contained their
 * subject — but a census asks to be cited, and a citation that 404s is worse
 * than the reorganisation was good. These are permanent (308) rather than
 * temporary because the moves are: 308 also preserves the method and body,
 * unlike the 301 a browser may silently downgrade to GET.
 *
 * `/stats` was a page-level `permanentRedirect` before this; it moves here so
 * every legacy URL is declared in one list rather than half in config and half
 * as route files that look like real pages.
 *
 * Query strings survive automatically — Next appends the original query to the
 * destination — so `/census?chain=bsc` lands on the right chain's rates.
 */
nextConfig.redirects = async () => [
  /**
   * `/census` is a real page again — the full census view lives there, and
   * the homepage is the product overview. This REVERSES a permanent redirect
   * (`/census → /`) that shipped 2026-08-01, and permanent is forever on the
   * client: browsers cache a 308 indefinitely, so some returning visitors
   * will keep landing on `/` for a while. That is also why `/` must NEVER
   * gain a redirect to `/census`: a client still holding the old 308 would
   * bounce between the two until the browser gives up
   * (ERR_TOO_MANY_REDIRECTS). Legacy census deep links (`/?chain=…`) are
   * handled by rendering the census view in place on `/` instead.
   */
  // The per-rung base rates live on the census page. `/stats` was that
  // page's first address; one hop, as before.
  { source: "/stats", destination: "/census", permanent: true },
  // "Agents that passed every check" was always a filter rather than a
  // section. The destination is the directory carrying that filter, spelled
  // out as facets so the URL says what it means and can be widened from the
  // controls it arrives with.
  //
  // The rungs are LITERAL here, which is the one place in this app that is
  // true: `next.config.ts` is evaluated at build time with no API to ask, and
  // the alternative — redirecting to a bare `/directory` — would silently drop
  // the filter that was the whole point of the old URL. Rung 6 is deliberately
  // absent, matching what the page computed from the run's own rates. If a
  // rung is added, this list wants updating; the preset chip in
  // `DirectoryControls` derives itself and does not.
  {
    source: "/working",
    destination:
      "/directory?facet=1%3Apass&facet=2%3Apass&facet=3%3Apass&facet=4%3Apass&facet=5%3Apass&facet=7%3Apass",
    permanent: true,
  },
  // The identity-to-payments join is a report: long-form, dated, cited.
  { source: "/linkage", destination: "/reports/linkage", permanent: true },
  // The funding/independence page was written before this project had any
  // readers. Its substance — nobody we audit pays us, there is nothing to
  // buy, no payment changes a finding — is now four lines on the method
  // page, which is where someone checking our numbers already is.
  { source: "/neutrality", destination: "/methodology#independence", permanent: true },

  /**
   * The old cards, kept alive.
   *
   * A page's `opengraph-image` is a URL in its own right, and social platforms
   * cache it independently of the page and re-fetch it later. Moving or
   * removing a page therefore strands its card URL: the post keeps pointing at
   * `/linkage/opengraph-image`, the re-fetch 404s, and a link that unfurled
   * yesterday shows a broken preview today — on someone else's timeline, where
   * we cannot fix it.
   *
   * So each retired card redirects to the card of the page that absorbed its
   * subject. `/linkage` keeps its own image byte-for-byte; the other two point
   * at the card for the page their content now lives on.
   */
  {
    source: "/linkage/opengraph-image",
    destination: "/reports/linkage/opengraph-image",
    permanent: true,
  },
  {
    source: "/neutrality/opengraph-image",
    destination: "/methodology/opengraph-image",
    permanent: true,
  },
  {
    source: "/working/opengraph-image",
    destination: "/directory/opengraph-image",
    permanent: true,
  },
];

export default nextConfig;
