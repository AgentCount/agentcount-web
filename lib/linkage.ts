/**
 * The identity↔payments join, as published — and what has been withdrawn.
 *
 * ## Two things live here, and they are dated differently
 *
 * `census` is the registered population: how many agents exist on the four
 * chains this project sweeps. It moves every sweep.
 *
 * `payments` is a single study that ran once, on 2026-07-30, against four
 * pinned blocks, and is reported in `docs/reports/2026-07-30-four-chain.md`
 * §9. It is **superseded**. The scan read token transfer logs and EIP-3009
 * authorisations on a declared-wallet basis; none of that is a rung, none of
 * it is held in the census database, and none of it can be recomputed from a
 * published archive. The corrections ledger had already retracted part of it
 * once — 313 agents paid on Base became 190 after an attribution error — and
 * the maintainer has ruled every version of these figures unpublishable as a
 * headline claim until a pinned pipeline reproduces them
 * (AgentCount/agentcount#35).
 *
 * They are kept rather than deleted because a figure that was published and
 * then vanished is worse than one that is published with its retraction
 * attached. Every consumer must render them inside `payments`, dated, and
 * never as the claim a page leads with.
 *
 * ## Why the payments basis is not the census population
 *
 * `payments.total.agents` is 354,858 — the population at the four blocks the
 * study pinned, not today's. Dividing a 2026-07-30 numerator by a 2026-08
 * denominator would manufacture a rate nobody measured, so the study keeps
 * its own denominators and the page says which date each side carries.
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
  /**
   * The registered population, from the most recent published sweep of each
   * chain. Typed here rather than read from `/api/runs` because this page
   * renders without the API; that is a known hazard, tracked in the hardcoded
   * -figures audit, and the fix is to sum `getPublishedRuns()` here.
   */
  census: {
    /** The census this population belongs to, as a reader would name it. */
    label: string;
    agents: number;
    chains: { chain: string; agents: number }[];
  };
  /** The 2026-07-30 payments study. Superseded — see the module doc. */
  payments: {
    /** The runs every per-chain figure is scoped to. */
    runs: { chain: string; runId: string; pinnedBlock: number }[];
    measuredOn: string;
    /** When the maintainer withdrew these as headline claims. */
    supersededOn: string;
    /** The rebuild that will replace them. */
    issue: string;
    issueUrl: string;
    /** The one line that must travel with every figure below. */
    note: string;
    chains: ChainLinkage[];
    total: ChainLinkage;
    /** The reverse direction — testing x402's busiest sellers against the census. */
    crossCheck: {
      source: string;
      sourceUrl: string;
      queriedOn: string;
      /** Distinct EVM addresses in x402scan's top 100 by volume and by count. */
      sellersExamined: number;
      /** The forward direction: the 34 x402-settled agents resolve to this many
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
      /** Corroborated agent volume as a share of the top 100's. */
      agentLinkedShare: number;
    };
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
  payments: {
    runs: [
      { chain: "base", runId: "cfbfcc01-fdaf-409f-9bed-abf706d865c7", pinnedBlock: 49_262_617 },
      { chain: "bsc", runId: "f78c7891-e787-43f1-9748-61d5a361e9ff", pinnedBlock: 112_874_357 },
      { chain: "mainnet", runId: "18a25593-9098-40fd-a0d2-75553c6ee31d", pinnedBlock: 25_640_407 },
      { chain: "celo", runId: "7833fc49-a5b7-477b-99ce-946f650f0064", pinnedBlock: 73_448_013 },
    ],
    measuredOn: "2026-07-30",
    supersededOn: "2026-08-06",
    issue: "AgentCount/agentcount#35",
    issueUrl: "https://github.com/AgentCount/agentcount/issues/35",
    note:
      "measured 2026-07-30, one-off log study, declared-wallet basis. Superseded; a pinned recomputation is in progress.",
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
  },
};
