/**
 * Boot the PRODUCTION build against a stub API and check that every route
 * actually serves.
 *
 * ## Why this exists
 *
 * On 2026-08-01 every agent permalink on the live site returned a 500, and
 * every page's link preview was missing its image. Both shipped through a
 * green CI, and neither was catchable by anything CI was doing:
 *
 *   * `pnpm run build` SUCCEEDED. The permalink fault was
 *     `DYNAMIC_SERVER_USAGE` — a page declaring `generateStaticParams` while
 *     reading `searchParams` — and that only throws at REQUEST time. Nothing
 *     was prerendered for the build to fail on.
 *   * `next dev` served the same page perfectly, because dev renders every
 *     route dynamically and never enters the static path at all.
 *   * `pnpm exec tsc` and `eslint` are both right about the code. The types
 *     are fine. The bug is in the interaction between two route exports.
 *
 * So the gap was structural: nothing ever ran the built app and asked it for a
 * page. This does exactly that, and nothing more.
 *
 * ## Why a stub API rather than the real one
 *
 * A smoke test that talks to production fails when production is down, which
 * is when you least want CI red for an unrelated reason — and it would make a
 * pull request's result depend on data nobody in the PR controls. The stub
 * serves `test/fixtures`, the same JSON the schema tests already parse, so a
 * response shape that drifts fails here too rather than only in production.
 *
 * Run with `pnpm run smoke`, after `pnpm run build`.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// `process.cwd()`, not `import.meta.dirname`: tsx transpiles this to CJS,
// where `import.meta` does not exist. The script is run through a package
// script, so the working directory is the repo root by construction.
const FIXTURES = join(process.cwd(), "test", "fixtures");
const fixture = (name: string) => readFileSync(join(FIXTURES, `${name}.json`), "utf8");

/** Ports well above anything a developer is likely to be running. */
const API_PORT = 39_071;
const WEB_PORT = 39_072;
const BASE = `http://127.0.0.1:${WEB_PORT}`;

/**
 * The stub API.
 *
 * Deliberately dumb: it matches on path shape and returns a fixture. It is not
 * a second implementation of the API, and it must never grow logic — the
 * moment it starts deciding things, a smoke failure stops being evidence about
 * the front end.
 */
function startStubApi(): Promise<Server> {
  const server = createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];
    const send = (body: string, type = "application/json") => {
      res.writeHead(200, { "content-type": type });
      res.end(body);
    };

    if (path === "/api/healthz") return send("ok", "text/plain");
    if (path === "/api/runs") return send(fixture("runs"));
    if (path === "/api/methodology") return send(fixture("methodology"));
    if (/^\/api\/runs\/[^/]+\/rates$/.test(path)) return send(fixture("rates"));
    if (/^\/api\/runs\/[^/]+\/findings$/.test(path)) return send(fixture("findings"));
    if (path === "/api/agents") return send(fixture("agents"));
    // Only agent 1 exists. Every other id 404s, which is what lets the test
    // below assert that a missing agent renders the app's own not-found page
    // rather than an error.
    if (path === "/api/agents/base/1") return send(fixture("agent-detail"));
    if (path.startsWith("/api/agents/")) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("not found");
    }

    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`stub API has no route for ${path}`);
  });
  return new Promise((resolve) => server.listen(API_PORT, "127.0.0.1", () => resolve(server)));
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(2000) });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error(`${url} never came up`);
}

/**
 * `expect` is the status the route must return. `card` means the HTML must
 * carry an `og:image`, and that image must fetch as a PNG.
 *
 * The 404 rows are as load-bearing as the 200s: a bad agent id must reach the
 * app's not-found page, and the failure mode being guarded against is a route
 * that answers 500 to everything — which a list of 200-only expectations would
 * still pass if the route simply stopped existing.
 */
const ROUTES: { path: string; expect: number; card: boolean }[] = [
  { path: "/", expect: 200, card: true },
  { path: "/census", expect: 200, card: true },
  { path: "/directory", expect: 200, card: true },
  { path: "/directory?q=trading&facet=1:pass", expect: 200, card: true },
  { path: "/working", expect: 200, card: true },
  { path: "/preflight", expect: 200, card: true },
  { path: "/methodology", expect: 200, card: true },
  { path: "/reports", expect: 200, card: true },
  { path: "/reports/2026-07-census", expect: 200, card: true },
  { path: "/neutrality", expect: 200, card: true },
  { path: "/agent/base/1", expect: 200, card: true },
  // The `?run=` form is what took the route down: reading it is dynamic usage,
  // and a page declared static may not do it.
  { path: "/agent/base/1?run=cfbfcc01-fdaf-409f-9bed-abf706d865c7", expect: 200, card: true },
  { path: "/agent/base/999999", expect: 404, card: false },
  { path: "/agent/base/not-a-number", expect: 404, card: false },
  { path: "/nope", expect: 404, card: false },
];

const failures: string[] = [];
function check(ok: boolean, message: string) {
  if (ok) console.log(`  ok   ${message}`);
  else {
    console.log(`  FAIL ${message}`);
    failures.push(message);
  }
}

async function run(): Promise<void> {
  const api = await startStubApi();
  const web: ChildProcess = spawn("pnpm", ["exec", "next", "start", "--port", String(WEB_PORT)], {
    // The stub's origin is the whole point: if the built app reached anything
    // else, the assertions below would be measuring the wrong system.
    env: { ...process.env, AGENTCOUNT_API_URL: `http://127.0.0.1:${API_PORT}` },
    stdio: ["ignore", "pipe", "pipe"],
  });
  // Kept and printed only on failure — a passing run should say nothing about
  // Next's startup banner, and a failing one needs the stack trace.
  let serverLog = "";
  web.stdout?.on("data", (d) => (serverLog += d));
  web.stderr?.on("data", (d) => (serverLog += d));

  try {
    await waitForServer(`${BASE}/healthz`);

    for (const route of ROUTES) {
      const res = await fetch(`${BASE}${route.path}`, { signal: AbortSignal.timeout(30_000) });
      check(res.status === route.expect, `${route.path} -> ${res.status} (want ${route.expect})`);
      if (!route.card) continue;

      const html = await res.text();
      const src = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      if (!src) {
        check(false, `${route.path} has no og:image`);
        continue;
      }
      // Absolute and https, or the crawler will not fetch it. This is the
      // `metadataBase` bug: unset, Next emits a plausible-looking absolute URL
      // on http://localhost, and the page still renders perfectly.
      check(src.startsWith("https://"), `${route.path} og:image is absolute https (${src})`);

      // And it has to be a real image. A card URL that 500s is the same
      // outcome as no card at all, but looks fine in the HTML.
      const imgPath = src.replace(/^https:\/\/[^/]+/, "");
      const img = await fetch(`${BASE}${imgPath}`, { signal: AbortSignal.timeout(30_000) });
      const type = img.headers.get("content-type") ?? "";
      check(
        img.status === 200 && type.startsWith("image/"),
        `${imgPath} -> ${img.status} ${type}`,
      );
    }
  } finally {
    web.kill("SIGTERM");
    api.close();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} smoke check(s) failed:`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(`\n--- next start output ---\n${serverLog}`);
    process.exit(1);
  }
  console.log(`\nAll ${ROUTES.length} routes served.`);
}

// Not top-level `await` — same CJS transpilation as above. A rejection here is
// a failure of the harness rather than of the app, so it exits 1 loudly rather
// than becoming an unhandled rejection warning and a zero exit code.
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
