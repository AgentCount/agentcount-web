import { getMethodology } from "@/lib/api/endpoints";

export const metadata = { title: "Methodology — Ledgerscope" };
// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy
// if the API happens to be restarting.
export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const m = await getMethodology();

  return (
    <>
      <h1 className="text-2xl font-bold">What we measure</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Ledgerscope is a conformance census, not a rating agency. Every agent
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
            <dt className="font-semibold text-muted">7 · independent</dt>
            <dd>
              Whether at least one Reputation Registry feedback entry for this
              agent comes from an address other than the agent&rsquo;s own —
              a floor check against an agent attesting only to itself.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">Rung 4&rsquo;s required fields</h2>
        <p className="mt-2 text-muted">
          Pinned against spec commit{" "}
          <code className="break-all rounded bg-bg px-1 text-sm">{m.spec_commit}</code>,
          checker version {m.checker_version} (schema {m.schema_version}).
        </p>
        <table className="mt-4 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="border-b border-line px-3 py-2 font-semibold">Field</th>
              <th className="border-b border-line px-3 py-2 font-semibold">Condition</th>
            </tr>
          </thead>
          <tbody>
            {m.rung4_required_fields.map((f) => (
              <tr key={f.field}>
                <td className="border-b border-line px-3 py-2 font-mono text-xs">{f.field}</td>
                <td className="border-b border-line px-3 py-2 text-muted">{f.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">What a status means</h2>
        <p className="mt-2 text-muted">
          Each rung answers with one of four words, always in the checker&rsquo;s
          own vocabulary: <em>pass</em>, <em>fail</em>, <em>skipped</em> (an
          earlier rung&rsquo;s failure made this one moot — for example, an
          agent that fails rung 2 cannot meaningfully be asked rung 3), or{" "}
          <em>error</em> (the check itself could not complete — a timeout, a
          malformed response — which is a different claim from a clean
          fail). A rung with no row at all was never reached this run, which
          this site renders as &ldquo;not checked&rdquo; — distinct from
          <em> skipped</em>, since &ldquo;not checked&rdquo; and &ldquo;we
          couldn&rsquo;t ask&rdquo; are different claims.
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
