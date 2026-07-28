/**
 * Renders a rung's evidence object key by key. This is deliberately generic:
 * evidence is the product ("its evidence rendered, not summarised"), and its
 * shape differs by rung and by status (a `pass` on rung 4 carries
 * `fields_found`/`fields_missing`; a `skipped` row carries
 * `skipped_because_rung` instead). A bespoke renderer per rung would either
 * miss fields or need updating every time the checker adds one — printing
 * every key the API actually sent cannot drift from it.
 */
function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) {
    return v.length === 0 ? "(empty)" : v.map((x) => formatValue(x)).join(", ");
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function EvidenceTable({ evidence }: { evidence: Record<string, unknown> }) {
  const keys = Object.keys(evidence);
  if (keys.length === 0) {
    return <p className="mt-2 text-sm text-muted">No evidence recorded.</p>;
  }
  return (
    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
      {keys.map((k) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="break-all">{formatValue(evidence[k])}</dd>
        </div>
      ))}
    </dl>
  );
}
