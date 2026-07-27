import { StatTile } from "@/components/StatTile";
import { getMethodology, getStats } from "@/lib/api/endpoints";

export const metadata = { title: "Stats — Ledgerscope" };

export default async function StatsPage() {
  const [stats, methodology] = await Promise.all([getStats(), getMethodology()]);
  const widest = Math.max(1, ...stats.flags_by_kind.map((f) => f.count));

  return (
    <>
      <h1 className="text-2xl font-bold">The numbers</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Raw counts across every indexed chain. No ratios, no rates — thresholds
        are yours to choose.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Agents indexed" value={stats.total_agents} />
        <StatTile
          label="Responding endpoints"
          value={stats.live_endpoints}
          note="at the most recent probe"
        />
        <StatTile
          label="Payable endpoints"
          value={stats.payable_endpoints}
          note="answered HTTP 402 at least once"
        />
        <StatTile
          label="Metadata resolving"
          value={stats.metadata_resolving}
          note="has served a parseable card at least once"
        />
        <StatTile label="Flagged agents" value={stats.flagged_agents} />
      </div>

      <section className="mt-8 rounded-xl bg-panel p-6">
        <h2 className="text-lg font-semibold">Flags by kind</h2>
        {stats.flags_by_kind.length === 0 ? (
          <p className="mt-2 text-muted">No flags raised yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {stats.flags_by_kind.map((f) => (
              <li key={f.kind}>
                <div className="flex justify-between text-sm">
                  <span>{f.label}</span>
                  <span className="tabular-nums text-muted">
                    {f.count.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-bg">
                  <div
                    className="h-2 rounded-full bg-warn"
                    style={{ width: `${(f.count / widest) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-sm text-muted">
        Liveness is measured over {methodology.liveness_window_days} days;
        metadata counts as rotted after {methodology.rot_after_days}.
      </p>
    </>
  );
}
