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
