"use client";

import { useActionState } from "react";
import { RungLadder } from "@/components/RungLadder";
import { questionFor } from "@/lib/checks";
import { RungStrip } from "@/components/RungStrip";
import { Section } from "@/components/Section";
import { StatusLegend } from "@/components/StatusLegend";
import { runPreflight, type PreflightState } from "./actions";

/**
 * The second client component in this app, and the first by choice. (The
 * third is `app/agent/[chain]/[id]/SpotCheck.tsx`, on the same pattern.)
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
          {/* `focus:border-edge` only, no `focus:outline-none`, here and
              on the three identity fields below: all four used to
              suppress the site's accessible focus ring and replace it
              with a border barely a shade lighter — a keyboard user
              tabbing through this form got almost nothing. Dropping the
              suppression lets the global `:focus-visible` ring (see
              `globals.css`) return for keyboard focus, while the border
              tint — plain `:focus`, not `:focus-visible` — still answers
              a mouse click same as before; the two now stack instead of
              one silently winning.

              The three identity fields below carry a full border rather
              than the underline this form used before — same fix as the
              directory's search box (`DirectoryControls.tsx`): a bottom
              rule alone reads as plain text sitting on a line, not as
              something to type into, until the moment a reader's cursor
              already happens to be over it. */}
          <textarea
            name="document"
            rows={18}
            spellCheck={false}
            defaultValue={state.kind === "checked" ? state.document : ""}
            placeholder={'{\n  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",\n  "name": "…",\n  "registrations": [{ "agentId": 1, "agentRegistry": "eip155:8453:0x…" }]\n}'}
            className="w-full resize-y border border-line bg-panel px-3 py-2 font-mono text-xs leading-relaxed text-text placeholder:text-dead focus:border-edge"
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
                  className="w-full border border-line bg-raised/30 px-2 py-1 font-mono text-xs text-text transition-colors hover:border-edge focus:border-edge focus:bg-raised/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="label">chain id</span>
                <input
                  name="chain_id"
                  inputMode="numeric"
                  placeholder="8453"
                  className="w-full border border-line bg-raised/30 px-2 py-1 font-mono text-xs text-text placeholder:text-dead transition-colors hover:border-edge focus:border-edge focus:bg-raised/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="label">registry</span>
                <input
                  name="registry"
                  placeholder="0x8004…"
                  className="w-full border border-line bg-raised/30 px-2 py-1 font-mono text-xs text-text placeholder:text-dead transition-colors hover:border-edge focus:border-edge focus:bg-raised/50"
                />
              </label>
            </div>
          </fieldset>

          <div className="mt-5 flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="border border-edge px-5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-text transition hover:bg-raised active:scale-[0.97] disabled:text-dead disabled:active:scale-100"
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
            // `motion-safe:animate-fade-in`: see the animation's own doc
            // in `globals.css` — this result just landed after the reader
            // pressed the button below, so it gets the one entrance
            // animation on the site instead of snapping into place.
            //
            // `key`, because a CSS `animation` fires on mount, not on
            // update: without it, checking a second document would
            // reuse this same `Section` and the animation would only
            // ever have played for the first one. Keying on the result
            // itself forces a fresh element — and with it, a fresh
            // entrance — for every completed check.
            key={JSON.stringify(state)}
            className="motion-safe:animate-fade-in"
            // Not "N of 7": even about answerability, a numerator-over-seven
            // reads as the tally this product refuses, and screenshots do not
            // carry the distinction.
            aside="answers checks 3–5"
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
            {/* `min-w-0` — same fix as the agent page header (see
                `RungStrip.tsx` and that page's own comment): without it this
                flex item won't shrink below the strip's intrinsic width, and
                the whole page scrolls sideways on a phone instead of just
                the strip. */}
            <div className="flex min-w-0 flex-wrap items-center gap-4">
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
