/**
 * The one place this app talks to the network.
 *
 * Two failure modes are distinguished on purpose: the API being unreachable is
 * an operational problem, while a response that does not match its schema is a
 * contract problem between two repos. Conflating them makes the second one
 * invisible, and the second one is the one that silently misrenders data.
 */
import type { ZodType } from "zod";

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
    res = await fetch(url, { next: { revalidate } });
  } catch {
    throw new UpstreamError(`could not reach the Ledgerscope API at ${url}`);
  }

  if (res.status === 404 && allow404) return null;
  if (!res.ok) {
    throw new UpstreamError(`the Ledgerscope API returned ${res.status}`, res.status);
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

/** `GET /healthz` returns the bare string `ok`, so it skips the JSON path. */
export async function pingApi(): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl()}/healthz`, { cache: "no-store" });
    return res.ok && (await res.text()).trim() === "ok";
  } catch {
    return false;
  }
}
