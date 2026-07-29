import { getMethodology } from "@/lib/api/endpoints";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Methodology" };
// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy
// if the API happens to be restarting.
export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const m = await getMethodology();

  return (
    <>
      <h1 className="text-2xl font-bold">What we measure</h1>

      {/* The summary block. Five bullets, before the long-form detail, for the
          reader who arrived from a shared agent link and wants to know what
          they are looking at without reading two thousand words first. Every
          claim here is restated in full below — this adds no new fact, it just
          arrives sooner. */}
      <section
        aria-label="In short"
        className="mt-4 max-w-prose rounded-lg border border-line bg-panel/60 px-5 py-4"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          In short
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Every agent registered under ERC-8004 gets the{" "}
            <strong>same seven questions</strong>, called rungs, and every
            answer carries the evidence collected to reach it.
          </li>
          <li>
            An answer is one of{" "}
            <em>pass</em>, <em>fail</em>, <em>skipped</em>, <em>error</em>, or —
            rung 5 only — <em>unclaimed</em>. A rung with no row at all was
            never reached, which this site shows as{" "}
            <strong>not checked</strong>: a different claim from any of the
            five.
          </li>
          <li>
            <strong>Rung 6 (<em>live</em>) is not implemented.</strong> It shows
            as not checked for every agent, never as a failure — the question is
            not being asked of anyone yet.
          </li>
          <li>
            There is <strong>no score, grade, tier, or ranking</strong> anywhere
            in this product, and no count of how many rungs an agent passed.
            Compressing seven independent questions into one number is the move
            this census exists to refuse.
          </li>
          <li>
            Rungs measure <strong>conformance to a spec</strong> — not safety,
            intent, or quality. Passing everything is not an endorsement, and
            failing is not proof of bad intent.
          </li>
        </ul>
      </section>

      <p className="mt-6 max-w-prose leading-relaxed text-muted">
        {BRAND.name} is a conformance census, not a rating agency. Every agent
        registered under ERC-8004 gets the same seven yes/no/skip/error
        questions, called rungs, and every answer carries the evidence the
        checker collected to reach it. There is deliberately no score, grade,
        tier, or ranking anywhere in this product — compressing seven
        independent questions into one number is exactly the move every
        competitor makes, and exactly the one this census refuses to make.
        Reaching your own conclusion from the seven answers is the point.
      </p>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">The seven rungs</h2>
        <dl className="mt-2 space-y-4">
          <div>
            <dt className="font-semibold text-muted">1 · registered</dt>
            <dd>
              The agent id exists in the on-chain Identity Registry with an
              <code className="mx-1 rounded bg-bg px-1">agentURI</code>
              recorded against it.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">2 · resolvable</dt>
            <dd>
              That URI can be fetched and returns a body — a strict 2xx over
              HTTP, or a successfully decoded <code className="rounded bg-bg px-1">data:</code> URI.
              An HTTP 402 does not count as resolving.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">3 · parseable</dt>
            <dd>The fetched body parses as JSON.</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">4 · conformant</dt>
            <dd>
              The parsed document contains every field the spec pinned below
              requires — see the exact list underneath.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">5 · bound</dt>
            <dd>
              The document&rsquo;s own registration entry names the same agent
              id, registry, and chain that the on-chain lookup used to find
              it — the card and the registry entry agree about who this is.
              Since a registration entry is only recommended, not required
              (rung 4), a document can pass conformance while making no
              binding claim at all — that case is neither a pass nor a fail;
              it renders as <em>unclaimed</em>. See &ldquo;What a status
              means&rdquo; below.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">6 · live</dt>
            <dd>
              Whether the endpoints the card declares in{" "}
              <code className="rounded bg-bg px-1">services[]</code> actually
              respond. Not yet implemented — every agent currently shows no
              row for this rung, rendered on this site as &ldquo;not
              checked&rdquo;, never as a guessed status.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">7 · attested</dt>
            <dd>
              Whether this agent has received at least one Reputation
              Registry feedback entry, from any client address at all.
              Runs for every agent that passes rung 1 — it does not depend on
              whether the document itself ever resolved, parsed, conformed,
              or bound.{" "}
              <strong>
                This rung does not, and cannot, check whether the feedback
                came from the agent&rsquo;s own owner
              </strong>
              : the registry&rsquo;s own rules make owner self-feedback
              impossible to submit in the first place, so there is nothing
              here for this rung to detect. It answers only &ldquo;did anyone
              at all vouch for this agent&rdquo;, not &ldquo;was it
              independent&rdquo; — renamed from <code className="rounded bg-bg px-1">independent</code> on
              2026-07-29 for exactly that reason.
            </dd>
          </div>
        </dl>
      </section>

      {/* Rung 4's three severity buckets. This section read
          `m.rung4_required_fields` until 2026-07-29 — a field the API stopped
          sending when rung 4 was split by RFC 2119 severity — so every load of
          this page threw a ContractError and showed the error panel instead.
          Every list below is read from the API, never restated here. */}
      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">
          Rung 4&rsquo;s fields, by severity
        </h2>
        <p className="mt-2 max-w-prose text-muted">
          The spec invokes RFC 2119, so MUST, SHOULD and MAY are three
          different promises and rung 4 keeps them apart. Pinned against spec
          commit{" "}
          <code className="break-all rounded bg-bg px-1 text-sm">{m.spec_commit}</code>
          , checker version {m.checker_version} (schema {m.schema_version}).
        </p>

        <h3 className="mt-5 font-semibold">
          MUST — the only fields whose absence fails the rung
        </h3>
        <p className="mt-1 max-w-prose text-sm text-muted">
          {m.rung4_must_requirements.length === 1 ? "One requirement" : `${m.rung4_must_requirements.length} requirements`}
          {m.rung4_must_requirements.every((r) => r.conditional) &&
            ", and conditional — a document carrying no registrations array has nothing it must do"}
          .
        </p>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="border-b border-line px-3 py-2 font-semibold">
                Field
              </th>
              <th scope="col" className="border-b border-line px-3 py-2 font-semibold">
                Condition
              </th>
            </tr>
          </thead>
          <tbody>
            {m.rung4_must_fields.map((f) => (
              <tr key={f.field}>
                <td className="border-b border-line px-3 py-2 font-mono text-xs">
                  {f.field}
                </td>
                <td className="border-b border-line px-3 py-2 text-muted">
                  {f.condition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-6 font-semibold">
          SHOULD — recorded as a gap, never a failure
        </h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {m.rung4_should_fields.map((f) => (
            <li
              key={f}
              className="rounded border border-line px-2 py-0.5 font-mono text-xs text-muted"
            >
              {f}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-semibold">MAY — purely informational</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {m.rung4_may_fields.map((f) => (
            <li
              key={f}
              className="rounded border border-line px-2 py-0.5 font-mono text-xs text-muted"
            >
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">What a status means</h2>
        <p className="mt-2 text-muted">
          Each rung answers with one of a small fixed vocabulary, always in
          the checker&rsquo;s own words: <em>pass</em>, <em>fail</em>,{" "}
          <em>skipped</em> (a rung this one depends on didn&rsquo;t pass, so
          this question could not be meaningfully asked — for example, an
          agent that fails rung 2 cannot meaningfully be asked rung 3;
          dependencies run within a rung&rsquo;s own track, not across every
          rung number in order — rung 7 depends only on rung 1, so a rung-2
          failure never skips it), or{" "}
          <em>error</em> (the check itself could not complete — a timeout, a
          malformed response — which is a different claim from a clean
          fail). A rung with no row at all was never reached this run, which
          this site renders as &ldquo;not checked&rdquo; — distinct from
          <em> skipped</em>, since &ldquo;not checked&rdquo; and &ldquo;we
          couldn&rsquo;t ask&rdquo; are different claims.
        </p>
        <p className="mt-2 text-muted">
          <strong>Rung 5 alone</strong> can also answer <em>unclaimed</em>,
          added 2026-07-29: the document made no binding claim (no
          registration entry, or an empty one) for this rung to check. That
          is neither a pass (nothing was verified) nor a fail (a
          merely-recommended field, not a broken one) — it is its own,
          honest word for &ldquo;there was nothing here to check&rdquo;. Any
          status word this site does not recognise renders with neutral
          styling and the verbatim text the API sent, never guessed at as one
          of the words above.
        </p>
      </section>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">What this does not tell you</h2>
        <p className="mt-2 text-muted">
          A pass on every rung is not a safety guarantee, and a fail is not
          proof of bad intent — the rungs measure conformance to a spec, not
          intent or quality. Absence of an implemented rung 6 today does not
          mean an agent&rsquo;s endpoints work; it means that question is not
          yet being asked of anyone. Every claim here is scoped to exactly
          what the evidence attached to it shows.
        </p>
      </section>
    </>
  );
}
