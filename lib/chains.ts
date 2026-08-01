/**
 * Chain display names, for prose only.
 *
 * Slugs stay slugs everywhere they are identifiers — API parameters, URLs,
 * rerun commands, provenance tables — because those must match what the API
 * and the archives actually say. Prose is the one place "bsc" should read
 * "BNB Chain".
 *
 * This map is a lookup, not a scope claim: nothing here says which chains the
 * census sweeps. A chain missing from the map renders as its slug, so a newly
 * swept chain reaches every sentence built from this module before anyone
 * edits it.
 */
const CHAIN_DISPLAY: Record<string, string> = {
  base: "Base",
  bsc: "BNB Chain",
  mainnet: "Ethereum mainnet",
  celo: "Celo",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
  avalanche: "Avalanche",
  gnosis: "Gnosis",
  billions: "Billions",
  megaeth: "MegaETH",
  xlayer: "X Layer",
  monad: "Monad",
};

export function chainDisplayName(slug: string): string {
  return CHAIN_DISPLAY[slug] ?? slug;
}

/** "BNB Chain, Base, Ethereum mainnet and Celo" — in the order given. */
export function formatChainList(slugs: readonly string[]): string {
  return new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(slugs.map(chainDisplayName));
}
