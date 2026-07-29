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
  const url = process.env.LEDGERSCOPE_API_URL;
  if (!url) {
    throw new UpstreamError(
      "LEDGERSCOPE_API_URL is not set — copy .env.example to .env.local",
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
    console.error(`[ledgerscope] contract mismatch on ${path}`, parsed.error.issues);
    throw new ContractError(path, issues);
  }
  return parsed.data;
}

/**
 * `GET /healthz` returns the bare string `ok`, so it skips the JSON path.
 *
 * A missing `LEDGERSCOPE_API_URL` is a configuration mistake in this repo, not
 * a statement about the API's health — `baseUrl()` is called outside the
 * try/catch on purpose, so that error propagates instead of being folded into
 * the same `false` as "could not reach the API". Conflating the two would
 * make `pnpm check:api` print a misleading "API unreachable" when the real
 * problem is an unset env var.
 */
export async function pingApi(): Promise<boolean> {
  const url = baseUrl();
  try {
    const res = await fetch(`${url}/healthz`, { cache: "no-store" });
    return res.ok && (await res.text()).trim() === "ok";
  } catch {
    return false;
  }
}
