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
  },
};

export default nextConfig;
