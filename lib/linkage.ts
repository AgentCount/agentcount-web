/**
 * The population the identity↔payments join is scoped to.
 *
 * ## Why this module holds no payment figures
 *
 * It used to. Those figures came from a log scan that read token transfer logs
 * and EIP-3009 authorisations outside the census database: not a rung, not
 * pinned to a run, and not recomputable from any published archive. Nothing
 * this site prints may be unreproducible, so they are gone rather than
 * annotated, and they return when the payments pipeline writes them into a
 * pinned run like every other figure here.
 *
 * What is left is the population, which is a real census output and the thing
 * any future payment rate divides by.
 *
 * ## This is still typed rather than read
 *
 * A hardcoded population is the same hazard the payment figures were, and it
 * is on the audit for exactly that reason. `getPublishedRuns()` already
 * returns one entry per published run with its `agent_count`, and summing the
 * newest per chain replaces every literal below. It is typed here only because
 * the committed fallback in `content/published-runs.json` still holds the
 * previous sweep, so wiring it today would render the older population
 * wherever the core repo cannot be reached.
 */
export const LINKAGE: {
  census: {
    /** The census this population belongs to, as a reader would name it. */
    label: string;
    agents: number;
    /** Largest first, the order every chain list on this site reads in. */
    chains: { chain: string; agents: number }[];
  };
} = {
  census: {
    label: "2026-08",
    agents: 369_130,
    chains: [
      { chain: "bsc", agents: 251_782 },
      { chain: "base", agents: 60_589 },
      { chain: "mainnet", agents: 47_001 },
      { chain: "celo", agents: 9_758 },
    ],
  },
};
