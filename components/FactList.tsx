import type { Fact } from "@/lib/api/schemas";

/**
 * Every string here is the API's. This component chooses layout only — if it
 * ever needs to compose a sentence, that sentence belongs in the Rust `facts`
 * crate instead.
 */
export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <section className="mt-6 rounded-xl bg-panel p-6">
      <h2 className="text-lg font-semibold">Facts</h2>
      <dl className="mt-2">
        {facts.map((f) => (
          <div key={f.kind} className="mt-3">
            <dt className="font-semibold text-muted">{f.display.label}</dt>
            <dd className="mt-0.5">
              {f.display.statement}
              {f.display.evidence_summary && (
                <span className="block text-sm text-muted">
                  evidence: {f.display.evidence_summary}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
