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
    // The method-changed variant, not the captured `delta.json`: the smoke
    // run asserts the "method changed" marker renders, and no live pair spans
    // a method change yet — same reason the stub's `runs.json` carries an
    // in-flight run the live API has no example of.
    if (/^\/api\/runs\/[^/]+\/delta$/.test(path))
      return send(fixture("delta-method-changed"));
    if (path === "/api/agents") return send(fixture("agents"));
    // Cross-run search. The fixture carries three groups — one with more
    // matches than it returns rows for, and one with none — so the page's
    // "all N on this chain" link and its per-chain empty group both render.
    if (path === "/api/search") return send(fixture("search"));
    // The on-demand spot check. POST-only here as on the real API: a stub
    // that answered GET would let a prefetch or an unfurler trigger the one
    // call this app must never make speculatively, and the smoke run would
    // stop being evidence about that.
    if (/^\/api\/agents\/[^/]+\/[^/]+\/spot-check$/.test(path)) {
      if (req.method !== "POST") {
        res.writeHead(405, { "content-type": "text/plain" });
        return res.end("method not allowed");
      }
      return send(fixture("spot-check"));
    }
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
  // A legacy census deep link: `?chain=` on the homepage renders the census
  // in place (it cannot redirect — see next.config.ts on the cached-308
  // loop), so this exercises that branch specifically.
  { path: "/?chain=base", expect: 200, card: true },
  // The census's own address, in both modes: the default aggregates one
  // findings document per chain, `?chain=` reads a single run. The fixtures
  // carry three chains so the first genuinely sums.
  { path: "/census", expect: 200, card: true },
  { path: "/census?chain=base", expect: 200, card: true },
  { path: "/directory", expect: 200, card: true },
  { path: "/directory?q=trading&facet=1:pass", expect: 200, card: true },
  // Both shapes: the empty form, and a query that reaches the API stub.
  { path: "/search", expect: 200, card: false },
  { path: "/search?q=trading", expect: 200, card: false },
  { path: "/preflight", expect: 200, card: true },
  { path: "/methodology", expect: 200, card: true },
  { path: "/reports", expect: 200, card: true },
  { path: "/reports/2026-07-census", expect: 200, card: true },
  { path: "/reports/linkage", expect: 200, card: true },
  { path: "/data", expect: 200, card: true },
  // The subscribe form's landing page, in both its shapes. `card: false`
  // because it is `noindex` — a page nobody should ever arrive at from a
  // search result has no business having a share image.
  { path: "/subscribed", expect: 200, card: false },
  { path: "/subscribed?state=invalid", expect: 200, card: false },
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

/**
 * Every URL this site has published still resolves, and lands somewhere real.
 *
 * A census asks to be cited. A citation that 404s is worse than the
 * reorganisation was good, so each folded section is asserted twice: the old
 * path answers 308 with the expected `location`, and that destination is
 * itself a 200. Checking only the redirect would let a permanent redirect
 * point confidently at a dead page.
 */
const REDIRECTS: { from: string; to: string }[] = [
  { from: "/stats", to: "/census" },
  { from: "/linkage", to: "/reports/linkage" },
  { from: "/neutrality", to: "/methodology#independence" },
  {
    from: "/working",
    // Unencoded colons: Next normalises `%3A` in a redirect destination back
    // to `:` before emitting the Location header, and a colon is legal in a
    // query value. Asserting the encoded form fails against a redirect that
    // is working correctly.
    to: "/directory?facet=1:pass&facet=2:pass&facet=3:pass&facet=4:pass&facet=5:pass&facet=7:pass",
  },
];

async function checkLegacyRedirects() {
  for (const { from, to } of REDIRECTS) {
    const res = await fetch(`${BASE}${from}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    const location = res.headers.get("location") ?? "";
    check(
      res.status === 308 && location === to,
      `${from} -> ${res.status} ${location || "(no location)"} (want 308 ${to})`,
    );

    const landed = await fetch(`${BASE}${to}`, { signal: AbortSignal.timeout(30_000) });
    check(landed.status === 200, `  ...and ${to} -> ${landed.status} (want 200)`);
  }

  // A retired page's CARD url outlives the page: platforms cache it and
  // re-fetch it later, so a stranded one breaks a preview on somebody else's
  // timeline, where it cannot be fixed.
  for (const from of [
    "/linkage/opengraph-image",
    "/census/opengraph-image",
    "/neutrality/opengraph-image",
    "/working/opengraph-image",
  ]) {
    const res = await fetch(`${BASE}${from}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    const type = res.headers.get("content-type") ?? "";
    check(
      res.status === 200 && type.startsWith("image/"),
      `retired card ${from} still resolves to an image (${res.status} ${type})`,
    );
  }

  // The query string must survive, or `/stats?chain=bsc` silently loses the
  // chain it was asking about.
  const withQuery = await fetch(`${BASE}/stats?chain=bsc`, {
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  check(
    (withQuery.headers.get("location") ?? "").includes("chain=bsc"),
    `/stats?chain=bsc keeps its query (${withQuery.headers.get("location")})`,
  );

  // A legacy census deep link on `/` must render the census itself, not the
  // overview — a 200 alone would pass if the branch silently fell through to
  // the homepage. "Every check, every status" is the census's rate-bar
  // section title and appears on no other page.
  const legacy = await fetch(`${BASE}/?chain=base`, {
    signal: AbortSignal.timeout(30_000),
  });
  const legacyBody = await legacy.text();
  check(
    legacyBody.includes("Every check, every status"),
    "/?chain=base renders the census view in place",
  );

  // The delta section, and the two caveats it may never drop: the declined
  // footnote always renders, and the method-changed note renders whenever a
  // row's pair spans a method change (the fixture's does).
  const censusBody = await fetch(`${BASE}/census`, {
    signal: AbortSignal.timeout(30_000),
  }).then((r) => r.text());
  check(
    censusBody.includes("Changed since the last sweep"),
    "/census renders the delta ledger",
  );
  check(
    censusBody.includes("declined is not the agent having gone away"),
    "  ...with the refused-exclusion footnote",
  );
  check(
    censusBody.includes("our failure is never the agent"),
    "  ...and the error-exclusion footnote",
  );
  check(
    censusBody.includes("method changed"),
    "  ...and the method-changed marker for a pair that spans one",
  );
}

/**
 * The masthead's SHAPE — deliberately not its pixels.
 *
 * The header fits a 360px phone because of four structural facts: at most
 * five sections, a search form, one action, and a `<details>` disclosure that
 * collapses the sections on a small screen without JavaScript. Those were
 * verified as pixels during development, at exact widths, by rendering the
 * page inside a fixed-width same-origin iframe — Chrome's `--window-size`
 * silently floors at ~500px, so the obvious method (screenshot at 390) renders
 * a 500px page and crops it, which looks exactly like a clipped layout and is
 * not one. That measurement needs a browser and does not belong in CI.
 *
 * What DOES belong here is the invariant that survives without one: the
 * realistic regression is someone appending a sixth nav item, or dropping the
 * disclosure, not someone subtly breaking flex-wrap. This asserts the shape
 * and says plainly that it is not a layout measurement.
 */
async function checkHeaderShape() {
  const html = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(30_000) }).then((r) =>
    r.text(),
  );

  const nav = html.match(/<nav[^>]*aria-label="Main"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  const items = nav.match(/<a\b/g)?.length ?? 0;
  check(
    items > 0 && items <= 5,
    `masthead lists ${items} sections (<= 5, or it stops fitting a phone)`,
  );

  check(
    /<form[^>]*action="\/search"[^>]*>/.test(html) && /name="q"/.test(html),
    "masthead carries the search form, posting to /search",
  );
  // The pre-flight checker moved from the masthead to the footer's Tools
  // list, so what has to hold is that EVERY page still links it — a tool
  // nothing links to is a tool nobody finds. The label is asserted as a rule
  // rather than a string: it must not be named after the page
  // ("Pre-flight"), because that name asks a reader to already know what the
  // feature is. Pinning exact wording would make every copy edit a red
  // build, which trains people to edit the test instead of the label.
  const action = html.match(/href="\/preflight"[^>]*>([^<]+)</)?.[1]?.trim() ?? "";
  check(
    action.length > 0 && !/^pre-?flight$/i.test(action),
    `every page links the checker, labelled for the errand ("${action}")`,
  );
  check(
    /<summary[^>]*>/.test(html),
    "sections collapse behind a <details> disclosure on small screens",
  );
}

/**
 * The spot check is a POST a person presses, and nothing else.
 *
 * This is the one control on the site whose failure mode lands on somebody
 * else's server: a spot check makes the API fetch a stranger's document. So
 * the shape that must hold is that nothing which follows links speculatively
 * can reach it — browser prefetch, a link unfurler, a crawler, an `<img src>`
 * — all of which issue GET and none of which submits a form.
 *
 * Asserted as structure rather than as pixels or copy: a `<form method="POST">`
 * carrying the agent's identity, a submit button inside it, and no anchor
 * anywhere on the page pointing at a spot-check URL. A regression here would
 * most likely arrive as somebody "simplifying" the button into a link, which
 * is exactly what this catches.
 */
async function checkSpotCheckButton() {
  const html = await fetch(`${BASE}/agent/base/1`, {
    signal: AbortSignal.timeout(30_000),
  }).then((r) => r.text());

  const form =
    html
      .match(/<form\b[^>]*method="post"[^>]*>[\s\S]*?<\/form>/gi)
      ?.find((f) => /name="chain"/.test(f) && /name="agent_id"/.test(f)) ?? "";
  check(form.length > 0, "agent page carries a POST form naming the agent to check");

  const label = form.match(/<button\b[^>]*type="submit"[^>]*>([^<]+)</)?.[1]?.trim() ?? "";
  // Labelled for the errand, like the footer's link to the checker: a button
  // named after the internal feature ("Spot check") asks the reader to know
  // what that is before pressing it. Wording is not pinned — the rule is.
  check(
    label.length > 0 && !/^spot ?check$/i.test(label),
    `the button says what pressing it does ("${label}")`,
  );

  check(
    !/href="[^"]*spot-check/i.test(html),
    "nothing on the page links to a spot check — a link is a GET, and a GET is a prefetch",
  );
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
    await checkHeaderShape();
    await checkSpotCheckButton();
    await checkLegacyRedirects();
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
