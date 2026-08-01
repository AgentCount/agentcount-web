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

export default nextConfig;
