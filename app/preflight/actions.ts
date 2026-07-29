"use server";

import { SubmissionError } from "@/lib/api/client";
import { validateDocument } from "@/lib/api/endpoints";
import type { ValidateResponse } from "@/lib/api/schemas";

export type PreflightState =
  | { kind: "idle" }
  /** The submission itself was wrong — an empty paste, a partial identity.
   * The API's own words, not a sentence invented here. */
  | { kind: "rejected"; message: string }
  | { kind: "checked"; result: ValidateResponse; document: string };

/**
 * Runs on the server, so `LEDGERSCOPE_API_URL` never reaches the browser and
 * the pasted document is posted from here rather than from the reader's
 * machine.
 *
 * A `SubmissionError` is surfaced verbatim: it is the API telling the person
 * who pasted something what is wrong with what they pasted. Every other
 * failure is left to throw into the error boundary, which correctly refuses to
 * guess whether the API is down or the contract drifted.
 */
export async function runPreflight(
  _prev: PreflightState,
  formData: FormData,
): Promise<PreflightState> {
  const document = String(formData.get("document") ?? "");
  if (document.trim() === "") {
    return { kind: "rejected", message: "Paste a registration document first." };
  }

  const agentId = String(formData.get("agent_id") ?? "").trim();
  const chainId = String(formData.get("chain_id") ?? "").trim();
  const registry = String(formData.get("registry") ?? "").trim();
  const supplied = [agentId, chainId, registry].filter((v) => v !== "").length;

  // Caught here as well as in the API so the reader is told which of the three
  // is missing before a round trip, rather than after one.
  if (supplied > 0 && supplied < 3) {
    return {
      kind: "rejected",
      message:
        "To check rung 5, give all three of agent id, chain id and registry — or leave all three empty and rung 5 stays unchecked.",
    };
  }

  try {
    const result = await validateDocument(
      document,
      supplied === 3 ? { agentId, chainId, registry } : undefined,
    );
    return { kind: "checked", result, document };
  } catch (e) {
    if (e instanceof SubmissionError) {
      return { kind: "rejected", message: e.message };
    }
    throw e;
  }
}
