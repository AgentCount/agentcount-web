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
  // The census's slug for Optimism is `op` (chain id 10) — both spellings
  // stay, because a slug is whatever the run actually says.
  op: "OP Mainnet",
  polygon: "Polygon",
  avalanche: "Avalanche",
  gnosis: "Gnosis",
  billions: "Billions",
  megaeth: "MegaETH",
  xlayer: "X Layer",
  monad: "Monad",
};

/**
 * One slug per chain, whichever spelling arrived.
 *
 * Two vocabularies meet on the coverage page: the census names Optimism
 * `op` in its runs, and the deployment probe names it `optimism`. Both are
 * correct in their own source, which is why `CHAIN_NAMES` above carries
 * both — but a `Set` comparison between them silently fails, and the
 * failure is invisible because the row simply reads "not swept".
 *
 * It read that way in production: Optimism, 533 agents, swept weekly since
 * July, published on /coverage as a chain this census does not cover — and
 * excluded from the coverage percentage that page exists to state.
 *
 * So slugs are canonicalised before they are compared. The census's own
 * spelling wins, because that is what a run actually says and what
 * `/directory?chain=` accepts.
 */
const SLUG_ALIASES: Record<string, string> = {
  optimism: "op",
};

export function canonicalChainSlug(slug: string): string {
  return SLUG_ALIASES[slug] ?? slug;
}

export function chainDisplayName(slug: string): string {
  return CHAIN_DISPLAY[slug] ?? slug;
}

/** "BNB Chain, Base, Ethereum mainnet, and Celo" — in the order given. */
export function formatChainList(slugs: readonly string[]): string {
  return new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(slugs.map(chainDisplayName));
}

/**
 * The chain list at headline length.
 *
 * Naming every chain kept the scope claim honest when there were four; at
 * eleven the same sentence is a paragraph, and a scope line nobody can scan
 * hides the scope instead of stating it. So: up to four chains are named in
 * full, and beyond that the largest three stand for the list with the
 * remainder counted — "BNB Chain, Base, Ethereum mainnet + 8 more". The
 * order is the caller's, which everywhere in this app is population order,
 * so "the largest three" is true by construction rather than ranked here.
 * The count keeps the claim exact, and the line links to the page that
 * names every chain in full.
 */
export function compressChainList(slugs: readonly string[]): string {
  if (slugs.length <= 4) return formatChainList(slugs);
  const named = slugs.slice(0, 3).map(chainDisplayName).join(", ");
  return `${named} + ${slugs.length - 3} more`;
}

/**
 * Small counts spelled out, larger ones left as numerals — the usual prose
 * rule, applied so a derived count can sit in a sentence without reading like
 * a spreadsheet. Only used where the number is prose; every figure that is a
 * measurement stays a numeral.
 */
const WORDS = [
  "zero", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
];

export function spellCount(n: number): string {
  return WORDS[n] ?? n.toLocaleString("en-US");
}
