"use client";

import { useActionState } from "react";
import { RungLadder } from "@/components/RungLadder";
import { questionFor } from "@/lib/checks";
import { RungStrip } from "@/components/RungStrip";
import { Section } from "@/components/Section";
import { StatusLegend } from "@/components/StatusLegend";
import { runPreflight, type PreflightState } from "./actions";

/**
 * The second client component in this app, and the first by choice.
 *
 * `app/error.tsx` is a client component because Next requires it. This one is
 * because a paste-and-check tool is genuinely interactive: the result has to
 * appear next to the textarea that produced it, without losing what was
 * typed, and a document is far too large to round-trip through a URL. The
 * alternative — a route handler returning a fresh page — would throw away the
 * paste on every check.
 *
 * The check itself still happens on the server: `runPreflight` is a server
 * action, so `AGENTCOUNT_API_URL` never reaches the browser and no check
 * logic is shipped to it either. This component renders an answer; it never
 * computes one.
 */
const INITIAL: PreflightState = { kind: "idle" };

export function PreflightForm({ statuses }: { statuses: string[] }) {
  const [state, formAction, pending] = useActionState(runPreflight, INITIAL);

  return (
    <div className="mt-10 grid grid-cols-1 gap-x-14 gap-y-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={formAction}>
        <Section
          title="Your document"
          aside="nothing is stored"
          intro={
            <>
              Paste the registration file you are about to mint. It is sent to
              the checker, judged, and discarded — no run is written and
              nothing is kept.
            </>
          }
        >
          <textarea
            name="document"
            rows={18}
            spellCheck={false}
            defaultValue={state.kind === "checked" ? state.document : ""}
            placeholder={'{\n  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",\n  "name": "…",\n  "registrations": [{ "agentId": 1, "agentRegistry": "eip155:8453:0x…" }]\n}'}
            className="w-full resize-y border border-line bg-panel px-3 py-2 font-mono text-xs leading-relaxed text-text placeholder:text-dead focus:border-edge focus:outline-none"
          />

          <fieldset className="mt-5 border-t border-line pt-4">
            <legend className="sr-only">Intended identity</legend>
            <div className="flex items-baseline gap-3">
              <span className="label">Intended identity</span>
              <span className="text-[0.6875rem] text-dead">
                optional — all three, or check 5 (Claims its identity?) stays
                unchecked
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[7rem_7rem_1fr]">
              <label className="flex flex-col gap-1">
                <span className="label">agent id</span>
                <input
                  name="agent_id"
                  inputMode="numeric"
                  className="border-b border-line bg-transparent pb-1 font-mono text-xs text-text focus:border-edge focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="label">chain id</span>
                <input
                  name="chain_id"
                  inputMode="numeric"
                  placeholder="8453"
                  className="border-b border-line bg-transparent pb-1 font-mono text-xs text-text placeholder:text-dead focus:border-edge focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="label">registry</span>
                <input
                  name="registry"
                  placeholder="0x8004…"
                  className="border-b border-line bg-transparent pb-1 font-mono text-xs text-text placeholder:text-dead focus:border-edge focus:outline-none"
                />
              </label>
            </div>
          </fieldset>

          <div className="mt-5 flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="border border-edge px-5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-text transition-colors hover:bg-raised disabled:text-dead"
            >
              {pending ? "Checking…" : "Check document"}
            </button>
            {state.kind === "rejected" && (
              <p className="text-xs text-warn">{state.message}</p>
            )}
          </div>
        </Section>
      </form>

      <div>
        {state.kind === "checked" ? (
          <Section
            title="What the checker says"
            aside={`${state.result.rungs.length} of 7 answerable`}
            intro={
              <>
                The same checker that judged every agent in the census, at spec
                pin{" "}
                <span className="font-mono text-text">
                  {state.result.spec_commit.slice(0, 12)}
                </span>
                . A check shown as <em>not checked</em> is one a draft cannot
                answer — not a check you failed.
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-4">
              <RungStrip rungs={state.result.rungs} size="md" />
            </div>

            <div className="mt-5">
              <StatusLegend statuses={statuses} />
            </div>

            <div className="mt-8">
              {/* Chain is unknown for a draft, so evidence values render as
                  plain text rather than linking to an explorer for a chain
                  nobody has named yet. */}
              <RungLadder
                rungs={state.result.rungs}
                chain=""
                notApplicable={state.result.not_applicable}
              />
            </div>

            <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-6">
              <dt className="label border-t border-line py-2">bytes</dt>
              <dd className="border-t border-line py-2 font-mono text-xs text-muted">
                {state.result.body_bytes.toLocaleString("en-US")}
              </dd>
              <dt className="label border-t border-line py-2">sha256</dt>
              <dd className="break-all border-t border-line py-2 font-mono text-xs text-muted">
                {state.result.body_sha256}
              </dd>
              <dt className="label border-t border-line py-2">checker</dt>
              <dd className="border-t border-line py-2 font-mono text-xs text-muted">
                {state.result.checker_version} · schema {state.result.schema_version}
              </dd>
            </dl>

            <div className="mt-8 border-t border-line pt-4">
              <span className="label">Not answerable before minting</span>
              <ul className="mt-3 space-y-1.5">
                {state.result.not_applicable.map((n) => (
                  <li key={n.rung} className="flex gap-3 text-xs">
                    <span className="w-24 shrink-0 font-mono uppercase tracking-[0.08em] text-dead">
                      {n.rung} · {questionFor(n.rung, n.name)}
                    </span>
                    <span className="text-muted">{n.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        ) : (
          <Section title="What the checker says" aside="awaiting a document">
            <p className="max-w-prose text-sm leading-relaxed text-muted">
              Results appear here. The checker answers checks 3, 4 and 5 — the
              three a document can be judged on before it exists on-chain.
              Checks 1, 2 and 7 need a minted agent, a published URI and
              feedback respectively, so a draft leaves them unchecked.
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
