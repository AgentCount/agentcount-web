"use client";

import { useActionState } from "react";
import { EvidenceTable } from "@/components/EvidenceTable";
import { OutboundLink } from "@/components/OutboundLink";
import { Section } from "@/components/Section";
import { questionFor } from "@/lib/checks";
import { resourceLink } from "@/lib/links";
import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  notCheckedClasses,
  statusClasses,
  statusGlyph,
  statusLabel,
} from "@/lib/status";
import type { SpotCheck as SpotCheckResult } from "@/lib/api/schemas";
import { runSpotCheck, type SpotCheckState } from "./actions";

/**
 * The third client component in this app, and the second by choice.
 *
 * It is a client component for one reason: the check must not happen unless a
 * person asks for it. A spot check makes our API send a real HTTP request to a
 * stranger's server, so it can never be a page render, a `<Link>` a browser
 * may prefetch, an unfurler's peek at a shared URL, or anything a crawler
 * follows — all of which issue GET, and none of which issues a form POST that
 * a human pressed. `useActionState` over a server action is the same shape
 * `app/preflight/PreflightForm.tsx` uses, and it keeps the work where it
 * belongs: `AGENTCOUNT_API_URL` never reaches the browser, and the outbound
 * request leaves our infrastructure rather than the reader's.
 *
 * The form also carries `chain` and `agent_id` as hidden fields rather than
 * closing over them, so it degrades to a plain POST before hydration —
 * pressing the button on a page whose JavaScript has not loaded still runs the
 * check instead of doing nothing.
 */
const INITIAL: SpotCheckState = { kind: "idle" };

export function SpotCheck({ chain, agentId }: { chain: string; agentId: number }) {
  const [state, formAction, pending] = useActionState(runSpotCheck, INITIAL);

  return (
    // The SECTION is an ordinary one — a rule running to the far edge, like
    // every other heading on the page. Only the ANSWER is drawn differently,
    // because only the answer can be screenshotted and passed off as census
    // output. Boxing the invitation as well would say the feature is a
    // different kind of thing than the register it sits in; it is not, it is
    // one more thing this page can tell you about this agent.
    <Section
      title="Check it again, now"
      aside="outside the census"
      className="mt-16"
      intro={
        <>
          Everything above is one sweep, pinned to one block. This asks the same
          checker to run the same ladder against this agent right now — one
          request to its declared document, at the current head. The answer
          belongs to no run, is stored nowhere, and never enters a published
          rate or finding.
        </>
      }
    >
      <form action={formAction} className="flex flex-wrap items-center gap-4">
        <input type="hidden" name="chain" value={chain} />
        <input type="hidden" name="agent_id" value={agentId} />
        <button
          type="submit"
          disabled={pending}
          className="border border-edge px-5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-text transition-colors hover:bg-raised disabled:text-dead"
        >
          {pending ? "Checking…" : "Check this agent now"}
        </button>
        <span className="text-xs text-dead">
          Sends one request to the agent&rsquo;s own server. Rate limited.
        </span>
      </form>

      {/* The live region is mounted from the first render, empty, rather than
          appearing with the answer inside it: a live region that arrives
          already populated announces nothing in most screen readers, and the
          button has stopped saying "Checking…" by then, so a reader who cannot
          see the panel would be given no signal at all that it landed.
          `polite` — this is a reply to something they asked for. */}
      <div className={state.kind === "idle" ? "" : "mt-6"} aria-live="polite">
        {state.kind === "checked" ? (
          <SpotCheckPanel result={state.result} />
        ) : state.kind === "idle" ? null : (
          <Refusal state={state} />
        )}
      </div>
    </Section>
  );
}

/**
 * Why this is a BOX, on a site that removed every box.
 *
 * `globals.css` retired bordered cards because a page of them reads as a
 * dashboard rather than a register, and `Section` replaced them with a rule
 * running to the far edge. That rule is suspended exactly here, and the reason
 * is the one thing this panel has to survive: a screenshot.
 *
 * A spot check and a census row use the same seven checks, the same status
 * words and the same evidence keys, and they mean different things — one is a
 * pinned, reproducible measurement of a whole population, the other is one
 * agent at whatever block the chain was at when a button was pressed. The API
 * protects that distinction by sharing no field name between the two shapes.
 * This panel has to protect it in pixels, for a reader who will only ever see
 * a cropped image of it. So: four sides of border, a hatched header bar that
 * appears nowhere else, the words SPOT CHECK at the top, and the timestamp,
 * block and checker build inline in that header — crop this anywhere and it
 * still says what it is.
 *
 * ## Why not `RungStrip` or `RungLadder`
 *
 * `RungStrip` is refused outright: seven cells in one frame is the census's
 * signature readout, it appears in the header of this very page, and an image
 * of one is precisely the thing that must not be passable as the other. Its
 * `n/c` cells would also be a lie in miniature here — rung 6 is not "not
 * reached", it is deliberately never probed on demand, which needs a sentence
 * the strip has no room for.
 *
 * `RungLadder` is refused for a softer reason: it is the component rendering
 * the census result eighteen inches up the same page, complete with its
 * printed-clause numerals, so reusing it verbatim would put two visually
 * identical ladders on one page differing only by heading. What IS reused is
 * the vocabulary — `lib/status.ts` for the words, colours and glyphs,
 * `lib/checks.ts` for the questions, `EvidenceTable` for the evidence — so a
 * `pass` here means exactly what a `pass` means there. The layout differs; the
 * measurement language must not.
 */
function SpotCheckPanel({ result }: { result: SpotCheckResult }) {
  const uri = resourceLink(result.identity.agent_uri);

  return (
    <article className="border border-edge bg-panel">
      <header className="border-b border-edge bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(232,228,220,.05)_4px,rgba(232,228,220,.05)_8px)] px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-text">
            Spot check
          </span>
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-dead">
            no run · not stored · not a census measurement
          </span>
        </div>
        {/* The provenance sits in the header rather than in a footer, because a
            screenshot of the verdicts alone must not be able to leave it
            behind. Timestamps are printed exactly as the API sent them — a
            reformatted one would make this app the author of the fact. */}
        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.6875rem] text-dead">
          <div className="flex gap-1.5">
            <dt>checked at</dt>
            <dd className="text-muted">{result.checked_at}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>block</dt>
            <dd className="text-muted">
              {result.block_number.toLocaleString("en-US")}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>checker</dt>
            <dd className="text-muted">
              {result.checker_version} · {result.checker_commit.slice(0, 12)}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>schema</dt>
            <dd className="text-muted">{result.schema_version}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>spec</dt>
            <dd className="text-muted">{result.spec_commit.slice(0, 12)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>source</dt>
            <dd className="text-muted">{result.source}</dd>
          </div>
        </dl>
      </header>

      {/* The API's own sentence, rendered verbatim. It is written to survive a
          paste or a curl transcript, and rewording it here would leave two
          differently-worded disclaimers describing one thing. */}
      <p className="border-b border-line px-4 py-3 text-xs leading-relaxed text-muted">
        {result.notice}
      </p>

      <div className="px-4 py-4">
        <h3 className="label">
          What the checker just found · {result.chain} · agent {result.agent_id}
        </h3>
        <ol className="mt-3">
          {result.checks.map((c) => (
            <li
              key={c.rung}
              className="grid grid-cols-1 gap-x-4 border-t border-line py-3 sm:grid-cols-[minmax(0,1fr)_max-content]"
            >
              <div className="min-w-0">
                <h4 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-dead">
                    check {c.rung}
                  </span>
                  <span className="font-sans text-sm font-semibold text-text">
                    {questionFor(c.rung, c.name)}
                  </span>
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dead">
                    {c.name}
                  </span>
                </h4>
                {/* Evidence collapsed by default: the census section above is
                    where evidence is the product and is rendered open. Here
                    the verdict is the answer to "is it still true?", and eight
                    open evidence tables would bury it. Nothing is summarised —
                    it is one click away, in full, keyed exactly as sent. */}
                <details className="mt-1">
                  <summary className="cursor-pointer list-none font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dead hover:text-muted">
                    evidence ▸
                  </summary>
                  <EvidenceTable evidence={c.evidence} chain={result.chain} />
                  <p className="mt-3 font-mono text-[0.6875rem] text-dead">
                    checked at {c.checked_at}
                  </p>
                </details>
              </div>
              <span
                title={statusLabel(c.status)}
                className={`mt-2 inline-flex h-min items-center gap-1.5 justify-self-start border px-2 py-0.5 font-mono text-xs sm:mt-0 sm:justify-self-end ${statusClasses(
                  c.status,
                )}`}
              >
                <span aria-hidden="true">{statusGlyph(c.status)}</span>
                {c.status}
              </span>
            </li>
          ))}
        </ol>

        {/* Never a guessed status: a rung this check did not ask carries the
            same dashed "not checked" treatment the census uses for a rung a
            run never reached, plus the API's own reason for the absence. Rung
            6 is the standing case — it is not unimplemented here, it is
            deliberately not probed, and only the API's sentence says why. */}
        {result.not_checked.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <h3 className="label">Not checked, and why</h3>
            <ul className="mt-3 space-y-4">
              {result.not_checked.map((n) => (
                <li key={n.rung}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      title={NOT_CHECKED_LABEL}
                      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-xs ${notCheckedClasses}`}
                    >
                      <span aria-hidden="true">{NOT_CHECKED_GLYPH}</span>
                      not checked
                    </span>
                    <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-dead">
                      check {n.rung} · {n.name}
                    </span>
                    <span className="font-sans text-sm text-text">
                      {questionFor(n.rung, n.name)}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted">
                    {n.reason}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-x-10 border-t border-line pt-4 lg:grid-cols-2">
          <div>
            <h3 className="label">Identity, read at this block</h3>
            <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-5">
              {(
                [
                  ["chain id", String(result.identity.chain_id)],
                  ["registry", result.identity.registry],
                  ["token id", result.identity.token_id],
                  ["owner", result.identity.owner],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-t border-line/60 py-1.5 font-mono text-[0.6875rem] text-dead">
                    {k}
                  </dt>
                  <dd className="break-all border-t border-line/60 py-1.5 font-mono text-xs text-muted">
                    {v}
                  </dd>
                </div>
              ))}
              <dt className="border-t border-line/60 py-1.5 font-mono text-[0.6875rem] text-dead">
                agent uri
              </dt>
              <dd className="max-h-24 overflow-auto break-all border-t border-line/60 py-1.5 font-mono text-xs text-muted">
                {result.identity.agent_uri === "" ? (
                  <span className="text-dead">(empty)</span>
                ) : uri ? (
                  // Agent-supplied, so `untrusted` — same rule as every other
                  // link to a document a stranger registered.
                  <OutboundLink href={uri.href} untrusted>
                    {result.identity.agent_uri}
                  </OutboundLink>
                ) : (
                  result.identity.agent_uri
                )}
              </dd>
            </dl>
          </div>

          <div className="mt-6 lg:mt-0">
            {/* Called "the fetch", never "the archive": nothing was archived.
                These bytes were read, judged and dropped, which is the
                difference the API's field name is also making. */}
            <h3 className="label">
              What this fetch saw · {result.fetch?.scheme ?? "no request made"}
            </h3>
            {result.fetch === null ? (
              <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
                No request was sent. Check 1 did not pass, so the ladder would
                have discarded the answer — and a request nobody may use is one
                this site will not make of somebody else&rsquo;s server.
              </p>
            ) : (
              <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-5">
                {(
                  [
                    ["request url", result.fetch.request_url ?? "—"],
                    ["final url", result.fetch.final_url ?? "—"],
                    ["http status", result.fetch.http_status?.toString() ?? "—"],
                    ["content type", result.fetch.content_type ?? "—"],
                    [
                      "size",
                      result.fetch.body_bytes !== null
                        ? `${result.fetch.body_bytes.toLocaleString("en-US")} bytes${
                            result.fetch.truncated ? " (truncated)" : ""
                          }`
                        : "—",
                    ],
                    ["sha256", result.fetch.body_sha256 ?? "—"],
                    [
                      "elapsed",
                      result.fetch.elapsed_ms !== null
                        ? `${result.fetch.elapsed_ms.toLocaleString("en-US")} ms`
                        : "—",
                    ],
                    ...(result.fetch.via_gateway
                      ? [["via gateway", result.fetch.via_gateway] as const]
                      : []),
                    ...(result.fetch.error
                      ? [["error", result.fetch.error] as const]
                      : []),
                  ] as [string, string][]
                ).map(([k, v]) => {
                  const link =
                    k === "request url" || k === "final url" ? resourceLink(v) : null;
                  return (
                    <div key={k} className="contents">
                      <dt className="border-t border-line/60 py-1.5 font-mono text-[0.6875rem] text-dead">
                        {k}
                      </dt>
                      <dd className="break-all border-t border-line/60 py-1.5 font-mono text-xs text-muted">
                        {link ? (
                          <OutboundLink href={link.href} untrusted>
                            {v}
                          </OutboundLink>
                        ) : (
                          v
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Every non-answer, rendered as something rather than as nothing.
 *
 * The panel is deliberately the same box as a result — a reader who pressed a
 * button gets a reply in the place they were looking, not a silently unchanged
 * page. The 429 is the case with real information in it: the API's own
 * sentence names which limit bound and where the unlimited census answer
 * lives, and the wait comes from `Retry-After` rather than from parsing that
 * sentence back apart.
 */
function Refusal({
  state,
}: {
  state: Exclude<SpotCheckState, { kind: "idle" } | { kind: "checked" }>;
}) {
  const heading =
    state.kind === "limited"
      ? "Rate limited"
      : state.kind === "unavailable"
        ? "Not available here"
        : "No answer";

  return (
    <article className="border border-edge bg-panel">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-edge bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(232,228,220,.05)_4px,rgba(232,228,220,.05)_8px)] px-4 py-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-text">
          Spot check
        </span>
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-dead">
          {heading}
        </span>
      </header>
      <div className="px-4 py-4">
        {state.kind === "limited" ? (
          <>
            <p className="max-w-prose text-sm leading-relaxed text-text">
              {state.retryAfterSeconds !== null
                ? `Try again in ${state.retryAfterSeconds} ${
                    state.retryAfterSeconds === 1 ? "second" : "seconds"
                  }.`
                : "Try again shortly."}
            </p>
            <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
              {state.message}
            </p>
          </>
        ) : state.kind === "unavailable" ? (
          <>
            <p className="max-w-prose text-sm leading-relaxed text-text">
              This deployment&rsquo;s API does not offer spot checks yet.
            </p>
            <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
              The census record above is unaffected — it comes from a published
              run and does not need this endpoint.
            </p>
          </>
        ) : (
          <p className="max-w-prose text-sm leading-relaxed text-text">
            {state.message}
          </p>
        )}
      </div>
    </article>
  );
}
