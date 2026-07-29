/**
 * Renders a rung's evidence object key by key.
 *
 * This is deliberately generic: evidence is the product ("its evidence
 * rendered, not summarised"), and its shape differs by rung and by status (a
 * `pass` on rung 4 carries `fields_found`/`fields_missing`; a `skipped` row
 * carries `skipped_because_rung` instead). A bespoke renderer per rung would
 * either miss fields or need updating every time the checker adds one —
 * printing every key the API actually sent cannot drift from it.
 *
 * Keys are set in dim mono and values in brighter mono on a two-column grid,
 * so a long evidence object scans as a register rather than a paragraph.
 * Values are never reformatted beyond making them printable: a timestamp stays
 * exactly as it arrived, because re-rendering it would make this app the
 * author of a fact it only received.
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
    return <p className="mt-3 text-sm text-dead">No evidence recorded.</p>;
  }
  return (
    <dl className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-[minmax(9rem,max-content)_1fr]">
      {keys.map((k) => (
        <div key={k} className="contents">
          <dt className="border-t border-line/60 py-1.5 font-mono text-[0.6875rem] text-dead">
            {k}
          </dt>
          <dd className="break-all border-line/60 pb-1.5 font-mono text-xs text-muted sm:border-t sm:py-1.5">
            {formatValue(evidence[k])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
