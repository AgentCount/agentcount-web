import type { Flag } from "@/lib/api/schemas";

export function FlagList({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) return null;
  return (
    <section className="mt-6 rounded-xl bg-panel p-6">
      <h2 className="text-lg font-semibold">Flags</h2>
      <ul className="mt-2 space-y-3">
        {flags.map((fl) => (
          <li
            key={fl.kind}
            className="rounded-lg border border-warn bg-warn/10 px-4 py-3"
          >
            <strong>⚑ {fl.display.label}</strong> — {fl.display.statement}
            <span className="ml-1 text-sm text-muted">
              (raised {fl.raised_at.slice(0, 10)})
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
