/**
 * The one place this app talks to the network.
 *
 * Two failure modes are distinguished on purpose: the API being unreachable is
 * an operational problem, while a response that does not match its schema is a
 * contract problem between two repos. Conflating them makes the second one
 * invisible, and the second one is the one that silently misrenders data.
 */
import type { ZodType } from "zod";
import { BRAND } from "../brand";

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

/**
 * The caller's input was rejected, and the API said why in words meant for a
 * human. Distinct from `UpstreamError`: nothing is wrong with the service, and
 * showing "the API may be down" for a malformed paste would be a lie.
 */
export class SubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubmissionError";
  }
}

/**
 * The API declined to do the work, and said why in words meant for a human.
 *
 * Distinct from both of the above: the service is healthy and the request was
 * well-formed — a rate limit bound, or a chain this deployment has no RPC for.
 * `retryAfterSeconds` is carried separately from the message because the wait
 * is the only part of a 429 a reader can act on, and it must not have to be
 * scraped back out of a sentence.
 */
export class RefusedError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "RefusedError";
  }
}

export class ContractError extends Error {
  constructor(
    readonly path: string,
    readonly issues: string,
  ) {
    super(`GET ${path} returned a shape this app does not understand: ${issues}`);
    this.name = "ContractError";
  }
}

function baseUrl(): string {
  const url = process.env.AGENTCOUNT_API_URL;
  if (!url) {
    throw new UpstreamError(
      "AGENTCOUNT_API_URL is not set — copy .env.example to .env.local",
    );
  }
  return url.replace(/\/$/, "");
}

export type GetOptions = { revalidate?: number; allow404?: boolean };

/**
 * Fetch, then validate. Returns `null` only when `allow404` is set and the API
 * said 404 — every other non-2xx is an UpstreamError.
 */
export async function get<T>(
  path: string,
  schema: ZodType<T>,
  { revalidate = 60, allow404 = false }: GetOptions = {},
): Promise<T | null> {
  const url = `${baseUrl()}${path}`;

  let res: Response;
  try {
    // A refused connection fails instantly, but a hung upstream (process
    // stopped, network black hole) does not — without a bound, the request
    // would wait indefinitely, and on a platform like Vercel that burns the
    // function to its own execution limit and returns the platform's 504
    // instead of this app's error panel. Bound it ourselves so the failure is
    // ours to explain.
    res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(8000) });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new UpstreamError(`the ${BRAND.name} API at ${url} did not answer in time`);
    }
    throw new UpstreamError(`could not reach the ${BRAND.name} API at ${url}`);
  }

  if (res.status === 404 && allow404) return null;
  if (!res.ok) {
    throw new UpstreamError(`the ${BRAND.name} API returned ${res.status}`, res.status);
  }

  const body = await res.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    console.error(`[agentcount] contract mismatch on ${path}`, parsed.error.issues);
    throw new ContractError(path, issues);
  }
  return parsed.data;
}

/**
 * POST a raw body and validate the JSON reply.
 *
 * Separate from `get` rather than a flag on it: this is the only write-shaped
 * call the app makes, it never caches, and its body is bytes the caller
 * supplied rather than anything this app constructed. Keeping the two apart
 * means the read path cannot accidentally grow a body.
 */
export async function postRaw<T>(
  path: string,
  body: string,
  schema: ZodType<T>,
): Promise<T> {
  const url = `${baseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      // text/plain, not application/json: the whole question rung 3 answers is
      // whether these bytes parse, so they must reach the checker untouched.
      headers: { "content-type": "text/plain" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new UpstreamError(`the ${BRAND.name} API at ${url} did not answer in time`);
    }
    throw new UpstreamError(`could not reach the ${BRAND.name} API at ${url}`);
  }

  // 400 is the API telling us the SUBMISSION is wrong, not that the API is
  // broken — it carries a message meant for the person who pasted the
  // document, so it is surfaced rather than swallowed as an upstream fault.
  if (res.status === 400) {
    throw new SubmissionError((await res.text()).trim());
  }
  if (!res.ok) {
    throw new UpstreamError(`the ${BRAND.name} API returned ${res.status}`, res.status);
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    console.error(`[agentcount] contract mismatch on ${path}`, parsed.error.issues);
    throw new ContractError(path, issues);
  }
  return parsed.data;
}

/**
 * The API's error bodies are PLAIN TEXT, not JSON — `ApiError::into_response`
 * returns `(status, String)`. Read as text and trimmed, with a fallback so a
 * body this app cannot read never becomes an empty panel.
 */
async function refusalText(res: Response, fallback: string): Promise<string> {
  try {
    const text = (await res.text()).trim();
    return text.length > 0 ? text : fallback;
  } catch {
    return fallback;
  }
}

/**
 * POST with NO body, for an endpoint that does work rather than returning a
 * stored row.
 *
 * Separate from `postRaw` (which posts bytes a reader pasted) and from `get`
 * (which caches) because the refusals are the point here: a 429 carries a wait
 * the reader has to be shown, a 503 means a capability is unconfigured, and a
 * 404 has two entirely different meanings that must not be merged.
 *
 * Returns `null` when the ROUTE is absent — an API deployed before this
 * endpoint existed. That case is told apart from the API's own "no such agent"
 * 404 by the body: axum's unmatched-route fallback sends an empty one, while
 * `ApiError::NotFound` sends the words `not found`. It is a heuristic and it
 * is the only one available (both are 404s, and asking the API what it
 * supports would need a capabilities endpoint that does not exist), so it errs
 * toward "the deployment is old": a CDN's HTML 404 page also lands here, and
 * telling a reader the feature is unavailable is honest in that case too,
 * whereas claiming their agent vanished from the chain would not be.
 */
export async function postNoBody<T>(
  path: string,
  schema: ZodType<T>,
  timeoutMs = 50_000,
): Promise<T | null> {
  const url = `${baseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      // No body and no content-type: the endpoint takes everything it needs
      // from the path. Sending an empty JSON object would be this app
      // inventing a request shape the API never asked for.
      cache: "no-store",
      // Longer than the 8s the read path allows, because this is not a read:
      // the API pins a block, reads two contracts and fetches a stranger's
      // document under its own 45s ceiling. Giving up first would report a
      // timeout for work the API was still about to answer.
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new UpstreamError(`the ${BRAND.name} API at ${url} did not answer in time`);
    }
    throw new UpstreamError(`could not reach the ${BRAND.name} API at ${url}`);
  }

  if (res.status === 404) {
    const text = await refusalText(res, "");
    if (!/^not found$/i.test(text)) return null;
    throw new RefusedError(text, 404);
  }
  if (res.status === 429) {
    // Whole seconds per RFC 9110; the API never sends the date form. An
    // unparsable header becomes `null` rather than a guessed number — "try
    // again in NaN seconds" is worse than not saying.
    const header = res.headers.get("retry-after");
    const seconds = header !== null && /^\d+$/.test(header.trim()) ? Number(header) : null;
    throw new RefusedError(
      await refusalText(res, "this check is rate limited — try again shortly"),
      429,
      seconds,
    );
  }
  if (res.status === 400 || res.status === 503) {
    throw new RefusedError(
      await refusalText(res, `the ${BRAND.name} API returned ${res.status}`),
      res.status,
    );
  }
  if (!res.ok) {
    throw new UpstreamError(`the ${BRAND.name} API returned ${res.status}`, res.status);
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    console.error(`[agentcount] contract mismatch on ${path}`, parsed.error.issues);
    throw new ContractError(path, issues);
  }
  return parsed.data;
}

/**
 * `GET /api/healthz` returns the bare string `ok`, so it skips the JSON path.
 * Not `/healthz`: that path is reserved on Cloud Run and never reaches the API.
 *
 * A missing `AGENTCOUNT_API_URL` is a configuration mistake in this repo, not
 * a statement about the API's health — `baseUrl()` is called outside the
 * try/catch on purpose, so that error propagates instead of being folded into
 * the same `false` as "could not reach the API". Conflating the two would
 * make `pnpm check:api` print a misleading "API unreachable" when the real
 * problem is an unset env var.
 */
export async function pingApi(): Promise<boolean> {
  const url = baseUrl();
  try {
    const res = await fetch(`${url}/api/healthz`, { cache: "no-store" });
    return res.ok && (await res.text()).trim() === "ok";
  } catch {
    return false;
  }
}
