import { getMethodology } from "@/lib/api/endpoints";

export const metadata = { title: "Methodology — Ledgerscope" };
// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy
// if the API happens to be restarting. The fetch-level `revalidate` still
// keeps the data fresh at request time.
export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const m = await getMethodology();

  return (
    <>
      <h1 className="text-2xl font-bold">What we measure</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Ledgerscope publishes facts, not judgments. Every claim below is a raw
        measurement with the evidence attached, and there is deliberately no
        score: with no observable ground truth to calibrate weights against, any
        0–100 number would be aesthetic. Consumers apply their own thresholds.
      </p>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">The facts</h2>
        <dl className="mt-2 space-y-3">
          <div>
            <dt className="font-semibold text-muted">Registered since</dt>
            <dd>
              The registration event on each chain, with the transaction hash as
              evidence.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">Endpoint liveness</dt>
            <dd>
              Raw probe counts over a {m.liveness_window_days}-day window. An
              HTTP 402 counts as alive — for a payable (x402) endpoint,
              &ldquo;Payment Required&rdquo; is a healthy answer.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">Metadata status</dt>
            <dd>
              Whether the registered URI still serves an agent card: resolving,
              rotted (nothing resolving for {m.rot_after_days}+ days, with the
              last archived snapshot as evidence), or never resolved. Every
              fetch is archived — content rots; the archive does not.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">Attestations</dt>
            <dd>
              A raw count of on-chain feedback received. In the deployed ERC-8004
              model each is left by a client address, so we assert nothing about
              who left it or whether it is reciprocal.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">The flags</h2>
        <p className="mt-2 text-muted">
          Flags are evidence-backed observations of coordination, not
          accusations. Each carries the peers, addresses, and windows behind it
          so a reader can check the claim.
        </p>
      </section>

      <section className="mt-6 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">What this does not tell you</h2>
        <p className="mt-2 text-muted">
          A responding endpoint is not a working agent. A flag is not proof of
          fraud — shared operators and batch registrations have legitimate
          explanations. Absence of a flag is not absolution: we only see what we
          measure.
        </p>
      </section>
    </>
  );
}
