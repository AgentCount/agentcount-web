/**
 * The identity↔payments join, as published.
 *
 * ## Why this is a static module and not an API call
 *
 * Every figure here comes from an analysis that ran once, against four pinned
 * blocks, and is reported in `docs/reports/2026-07-30-four-chain.md` §9. None
 * of it is computed by the API, because none of it is a rung — the payments
 * scan reads token transfer logs and EIP-3009 authorisations, which the census
 * database does not hold.
 *
 * Hardcoding published numbers is a real hazard, so it is bounded here in two
 * ways. Each figure carries the run it came from and the date it was measured,
 * rendered on the page beside it. And the whole module is one object, so
 * wiring it to a live source later replaces the object rather than hunting
 * numbers out of JSX.
 *
 * ## What these numbers are not
 *
 * `externalValue` is **external post-mint inflow to agent-declared addresses**.
 * It is not revenue and not earnings: airdrops, refunds, mistakes and an
 * operator's own capital returning from DeFi all look identical to it, and on
 * Base the largest recipient's inflows are Morpho vault yield. Every
 * figure is also a lower bound — two stablecoins per chain, nothing else.
 *
 * The page says all of this. It is repeated here because the next person to
 * reuse this module will read the type, not the page.
 */

export type ChainLinkage = {
  chain: string;
  agents: number;
  /** Agents that ever received an external stablecoin transfer post-mint. */
  paid: number;
  /** Agents that ever received an x402 (EIP-3009) settlement. */
  x402: number;
  /** External post-mint stablecoin inflow, USD. A lower bound. NOT revenue. */
  externalValue: number;
  /** Share of that value arriving from contracts rather than EOAs. */
  fromContracts: number | null;
};

export const LINKAGE: {
  /** The runs every per-chain figure is scoped to. */
  runs: { chain: string; runId: string; pinnedBlock: number }[];
  measuredOn: string;
  chains: ChainLinkage[];
  total: ChainLinkage;
  /** The reverse direction — testing x402's busiest sellers against the census. */
  crossCheck: {
    source: string;
    sourceUrl: string;
    queriedOn: string;
    /** Distinct EVM addresses in x402scan's top 100 by volume and by count. */
    sellersExamined: number;
    /** The forward direction: our 34 x402-settled agents resolve to this many
     * receiving addresses on a chain x402scan indexes. */
    baseAddresses: number;
    /** …of which this many x402scan corroborates (exact or within 15%). */
    corroborated: number;
    /** …of which this many match to the exact settlement count. */
    exactMatches: number;
    /** …that are a declared `agentWallet` on any of the four chains. */
    declaredAgentWallet: number;
    /** …that own an agent, the spec's default value for `agentWallet`. */
    agentOwner: number;
    topSellerSettlements: number;
    topSellerVolume: number;
    ourSettlements: number;
    ourVolume: number;
    /** Our corroborated agent volume as a share of the top 100's. */
    agentLinkedShare: number;
  };
} = {
  runs: [
    { chain: "base", runId: "cfbfcc01-fdaf-409f-9bed-abf706d865c7", pinnedBlock: 49_262_617 },
    { chain: "bsc", runId: "f78c7891-e787-43f1-9748-61d5a361e9ff", pinnedBlock: 112_874_357 },
    { chain: "mainnet", runId: "18a25593-9098-40fd-a0d2-75553c6ee31d", pinnedBlock: 25_640_407 },
    { chain: "celo", runId: "7833fc49-a5b7-477b-99ce-946f650f0064", pinnedBlock: 73_448_013 },
  ],
  measuredOn: "2026-07-30",
  chains: [
    { chain: "base", agents: 60_097, paid: 181, x402: 32, externalValue: 1_164_083, fromContracts: 93.9 },
    { chain: "bsc", agents: 244_208, paid: 128, x402: 0, externalValue: 1_639_492, fromContracts: 86.5 },
    { chain: "mainnet", agents: 40_806, paid: 31, x402: 0, externalValue: 203_121, fromContracts: 68.1 },
    { chain: "celo", agents: 9_747, paid: 18, x402: 2, externalValue: 2_813, fromContracts: 50.8 },
  ],
  total: {
    chain: "all four",
    agents: 354_858,
    paid: 358,
    x402: 34,
    externalValue: 3_009_509,
    fromContracts: null,
  },
  crossCheck: {
    source: "x402scan",
    sourceUrl: "https://www.x402scan.com",
    queriedOn: "2026-07-30",
    sellersExamined: 138,
    baseAddresses: 20,
    corroborated: 18,
    exactMatches: 9,
    declaredAgentWallet: 0,
    agentOwner: 3,
    topSellerSettlements: 139_636_446,
    topSellerVolume: 49_617_581,
    ourSettlements: 5_717,
    ourVolume: 8_596,
    agentLinkedShare: 0.017,
  },
};

/** `1 in N`, rounded — the form these rates are quoted in. */
export function oneIn(numerator: number, denominator: number): string {
  if (numerator === 0) return "never";
  return `1 in ${Math.round(denominator / numerator).toLocaleString("en-US")}`;
}
