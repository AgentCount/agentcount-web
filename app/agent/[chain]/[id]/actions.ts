"use server";

import { RefusedError, UpstreamError } from "@/lib/api/client";
import { spotCheckAgent } from "@/lib/api/endpoints";
import type { SpotCheck } from "@/lib/api/schemas";

/**
 * Every way the button can end, as a closed set.
 *
 * There is no "nothing happened" state after a submit: each branch below
 * carries something to render, because a panel that appears empty reads as a
 * check that quietly failed — and this is the one feature on the site that
 * sends traffic to somebody else's server, so what it did has to be legible.
 */
export type SpotCheckState =
  | { kind: "idle" }
  /** The API answered. Rendered by `SpotCheckPanel`, verbatim. */
  | { kind: "checked"; result: SpotCheck }
  /** The endpoint is not there — an API deployed before spot checks existed. */
  | { kind: "unavailable" }
  /** A rate limit bound. `retryAfterSeconds` comes from `Retry-After`. */
  | { kind: "limited"; message: string; retryAfterSeconds: number | null }
  /** Anything else, in one plain sentence. */
  | { kind: "refused"; message: string };

/**
 * These mirror `normalise_chain` and `parse_agent_id` in the API's
 * `routes::spot_check`, and exist for the same reason the agent page validates
 * an id before fetching: the chain and id reach this action as hidden form
 * fields, which anyone can edit, and a request built from junk would spend an
 * upstream round trip to be told the same thing this regex knows.
 *
 * Deliberately NOT stricter than the API. Narrowing further here would make
 * this app the authority on what an agent id is, and the two would drift.
 */
const CHAIN = /^[a-z0-9_-]{1,32}$/;
const AGENT_ID = /^\d{1,20}$/;

/**
 * Runs on the server, which is the whole reason it exists: `AGENTCOUNT_API_URL`
 * never reaches the browser, and the POST leaves our infrastructure rather than
 * the reader's — the same property the API's rate limiter assumes when it keys
 * on the target host.
 *
 * ## Why this catches what `runPreflight` rethrows
 *
 * The pre-flight action lets an unexpected failure throw into the error
 * boundary, correctly refusing to guess whether the API is down or the
 * contract drifted. Here the error boundary is the wrong destination: throwing
 * would replace a page the reader is already reading — an agent's whole census
 * record — with an error screen, because they pressed an optional button. The
 * census data on that page is still true whatever the spot check did. So every
 * failure is caught and rendered inside the panel, and the two kinds are still
 * kept apart in the message rather than merged into "something went wrong".
 */
export async function runSpotCheck(
  _prev: SpotCheckState,
  formData: FormData,
): Promise<SpotCheckState> {
  const chain = String(formData.get("chain") ?? "").trim();
  const id = String(formData.get("agent_id") ?? "").trim();
  if (!CHAIN.test(chain) || !AGENT_ID.test(id)) {
    return {
      kind: "refused",
      message: "That agent address is not one this checker can ask about.",
    };
  }

  try {
    const result = await spotCheckAgent(chain, id);
    return result === null ? { kind: "unavailable" } : { kind: "checked", result };
  } catch (e) {
    if (e instanceof RefusedError) {
      if (e.status === 429) {
        return {
          kind: "limited",
          // The API's own sentence, untouched: it names which limit bound and
          // where the unlimited census answer lives. The wait is carried
          // beside it rather than parsed back out of it.
          message: e.message,
          retryAfterSeconds: e.retryAfterSeconds,
        };
      }
      // The one refusal whose body is a status phrase rather than a sentence
      // for a human: `ApiError::NotFound` sends the bare words "not found",
      // which tells a reader nothing about what was not found. This app
      // supplies the sentence — it is the only place it writes over the API's
      // words, and it does so because there is no sentence to preserve. What
      // it must not do is guess: the census record above stays true either
      // way, and the wording says only what a 404 here actually establishes.
      if (e.status === 404) {
        return {
          kind: "refused",
          message:
            "The registry has no such agent at the current block. The census record above still stands — it describes a block in the past, and an agent can be burned or a registry replaced after a sweep.",
        };
      }
      return { kind: "refused", message: e.message };
    }
    if (e instanceof UpstreamError) {
      return { kind: "refused", message: e.message };
    }
    // A ContractError lands here: the API answered something this app cannot
    // read, which is a disagreement between two repos and not a fact about
    // the agent. It is already logged by the client with the offending
    // fields; the reader gets a sentence that does not blame their agent.
    console.error("[agentcount] spot check failed", e);
    return {
      kind: "refused",
      message:
        "The checker answered in a shape this site does not understand. The census record above is unaffected.",
    };
  }
}
