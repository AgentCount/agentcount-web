import { Section } from "@/components/Section";
import probe from "@/content/coverage-probe.json";
import { chainDisplayName } from "@/lib/chains";
import { getPublishedRuns, sweptChains } from "@/lib/published-runs";

export const metadata = {
  title: "Coverage",
  description:
    "Every chain the canonical ERC-8004 Identity Registry is deployed on, how many agents each holds, and which of them this census sweeps.",
};

type ProbedChain = {
  slug: string;
  name: string;
  chain_id: number;
  rpc_used: string | null;
  deployed: boolean;
  agents: number | null;
  id_basis: number | null;
  status: string;
  error?: string;
};

type Probe = {
  generated_at: string;
  registry: string;
  method: string;
  chains: ProbedChain[];
};

const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));

/**
 * The coverage page: what fraction of the registry the census actually sees.
 *
 * This page exists because the homepage once claimed the census swept "the
 * four largest chains" and nobody had checked. The probe that falsified the
 * claim is committed to this repo (`scripts/probe-coverage.mjs`), its output
 * is the committed dataset this page renders, and the coverage figure is
 * computed here from that dataset — never typed.
 *
 * Designed for expansion: a row's "swept" cell derives from the published
 * runs. When a new chain's run is published, its row flips to swept with no
 * edit to this file, and the coverage figure moves on its own.
 *
 * The comparison is same-date on both sides: the swept share is computed from
 * the PROBE's counts for swept chains over the probe's total, so a probe from
 * one day never divides into pinned counts from another. The census's own
 * headline numbers come from pinned runs and differ slightly; the page says
 * so rather than letting the two be confused.
 */
export default async function CoveragePage() {
  const data = probe as Probe;
  // The live canonical list, so a newly published chain flips its own row
  // without waiting for this app to be redeployed.
  const swept = new Set(sweptChains(await getPublishedRuns()));

  const counted = data.chains.filter(
    (c) => c.status === "ok" && c.agents !== null,
  );
  const probedTotal = counted.reduce((n, c) => n + (c.agents ?? 0), 0);
  const sweptTotal = counted
    .filter((c) => swept.has(c.slug))
    .reduce((n, c) => n + (c.agents ?? 0), 0);
  const coverage =
    probedTotal === 0 ? null : (sweptTotal / probedTotal) * 100;

  const probedDate = data.generated_at.slice(0, 10);

  const statusWord = (c: ProbedChain): string => {
    if (c.status === "rpc_unreachable") return "rpc unreachable";
    if (!c.deployed) return "not deployed";
    if (swept.has(c.slug)) return "swept";
    if (c.agents === 0) return "no agents";
    return "not swept";
  };

  return (
    <>
      <header className="border-b border-edge pb-6">
        <h1 className="numeral text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">
          Coverage
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          The canonical Identity Registry is deployed on more chains than this
          census sweeps. This page lists every deployment the probe could find,
          how many agents each held on {probedDate}, and which of them the
          census covers. The swept set is derived from the published runs, so a
          newly published chain flips its own row.
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          As of {probedDate}, the swept chains held{" "}
          <span className="font-mono text-text">{num(sweptTotal)}</span> of{" "}
          <span className="font-mono text-text">{num(probedTotal)}</span>{" "}
          probed registrations —{" "}
          <span className="text-text">
            {coverage === null ? "—" : `${coverage.toFixed(1)}%`}
          </span>
          . The census&rsquo;s own headline counts are read at pinned blocks
          and therefore differ slightly from the probe&rsquo;s live counts;
          this figure compares the probe with itself, on one date, so the
          division is honest.
        </p>
      </header>

      <Section
        title="Every known deployment"
        aside={`probed ${probedDate}`}
        className="mt-12 max-w-4xl"
        intro={
          <>
            Population is recovered by binary search on{" "}
            <code className="font-mono text-xs text-text">ownerOf(id)</code>{" "}
            against the registry at{" "}
            <code className="font-mono text-xs text-text">{data.registry}</code>{" "}
            on each chain — the same population definition the census itself
            uses. A chain whose RPCs all failed is listed as unreachable, with
            no invented count.
          </>
        }
      >
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="label border-b border-edge">
              <th className="py-2 pr-4 font-normal">chain</th>
              <th className="py-2 pr-4 text-right font-normal">chain id</th>
              <th className="py-2 pr-4 text-right font-normal">agents</th>
              <th className="py-2 font-normal">status</th>
            </tr>
          </thead>
          <tbody>
            {data.chains.map((c) => (
              <tr key={c.slug} className="border-b border-line/60">
                <td className="py-1.5 pr-4 text-muted">
                  {chainDisplayName(c.slug) === c.slug
                    ? c.name
                    : chainDisplayName(c.slug)}
                </td>
                {/* A chain id is an identifier, not a quantity: 8453, never
                    "8,453". The global tabular-nums still aligns the column. */}
                <td className="py-1.5 pr-4 text-right text-dead">{c.chain_id}</td>
                <td className="py-1.5 pr-4 text-right text-muted">
                  {c.status === "ok" ? num(c.agents) : "—"}
                </td>
                <td
                  className={`py-1.5 ${
                    swept.has(c.slug) ? "text-text" : "text-dead"
                  }`}
                >
                  {statusWord(c)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted">
          Solana is absent by method, not by judgment: its ERC-8004 presence is
          a third-party port with no CREATE2 address, so a probe of this
          registry cannot count it in either direction.
        </p>
      </Section>

      <Section
        title="Recompute it"
        aside="one command"
        className="mt-16 max-w-prose"
        intro={
          <>
            The probe that produced this table is committed beside it. Public
            RPCs, no keys, a few minutes.
          </>
        }
      >
        <pre className="overflow-x-auto border-l-2 border-edge bg-panel px-5 py-4 font-mono text-xs leading-relaxed text-muted">
          node scripts/probe-coverage.mjs --out content/coverage-probe.json
        </pre>
      </Section>
    </>
  );
}
