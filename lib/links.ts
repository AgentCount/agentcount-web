/**
 * Outbound links: block explorers, and the places an agent's document actually
 * lives.
 *
 * ## Why this is presentation, not derivation
 *
 * Nothing here decides anything about an agent. A block explorer URL is where
 * a reader goes to check the same fact against a second source — it is chrome
 * pointing outward, not a verdict. No status, count or evidence value is
 * produced or altered by this module.
 *
 * ## The rule when we don't know
 *
 * Every function returns `null` rather than guessing. An unrecognised chain
 * renders as plain text, not a link to an explorer that may not exist; an
 * unrecognised URI scheme renders as plain text too. Guessing
 * `https://<chain>scan.io` would produce confident links to nowhere, which is
 * worse than no link at all — the reader cannot tell a dead link from a wrong
 * one.
 *
 * ## Security: agent-supplied URLs are hostile input
 *
 * `tokenURI`, `request_url` and `final_url` come from third-party documents
 * that anybody can register on-chain for the price of gas. Turning those into
 * `href`s without a scheme allowlist is an XSS vector: a `javascript:` URI in
 * a tokenURI would execute on click. So `resourceLink` allowlists four schemes
 * and refuses everything else, and every outbound link to agent-supplied
 * content carries `rel="noopener noreferrer nofollow ugc"` — `nofollow ugc`
 * because this census indexes 60,097 unvetted documents and must not pass
 * ranking signal to any of them.
 */

export type Explorer = { name: string; base: string };

/**
 * Chain → block explorer, keyed by the chain string the API sends (which is
 * the `chains.chain` column, e.g. `base`).
 *
 * Every entry here is an Etherscan-family explorer, which is why one set of
 * path builders serves all of them. Adding a chain to the census means adding
 * a row here too — and if it is not added, that chain's pages still render,
 * just without outbound links.
 */
const EXPLORERS: Record<string, Explorer> = {
  base: { name: "BaseScan", base: "https://basescan.org" },
  ethereum: { name: "Etherscan", base: "https://etherscan.io" },
  bsc: { name: "BscScan", base: "https://bscscan.com" },
  celo: { name: "Celoscan", base: "https://celoscan.io" },
};

export function explorerFor(chain: string): Explorer | null {
  return EXPLORERS[chain.trim().toLowerCase()] ?? null;
}

/** Lowercase hex, 20 bytes. Anything else is not an address and gets no link. */
function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

/** 32-byte hash. */
function isTxHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

export function addressUrl(chain: string, address: string): string | null {
  const ex = explorerFor(chain);
  if (!ex || !isAddress(address)) return null;
  return `${ex.base}/address/${address.trim()}`;
}

export function txUrl(chain: string, hash: string): string | null {
  const ex = explorerFor(chain);
  if (!ex || !isTxHash(hash)) return null;
  return `${ex.base}/tx/${hash.trim()}`;
}

export function blockUrl(chain: string, block: number | string): string | null {
  const ex = explorerFor(chain);
  if (!ex) return null;
  const n = typeof block === "number" ? block : Number(block);
  if (!Number.isInteger(n) || n < 0) return null;
  return `${ex.base}/block/${n}`;
}

/**
 * The ERC-721 token page for one agent id on its registry contract. Etherscan
 * and every fork spell this `/token/<contract>?a=<tokenId>`.
 *
 * `tokenId` is a string because it is a `uint256` and can exceed `i64` — the
 * API sends it as text for exactly that reason, and parsing it here to
 * validate would reintroduce the precision loss the API avoided.
 */
export function tokenUrl(
  chain: string,
  registry: string,
  tokenId: string,
): string | null {
  const ex = explorerFor(chain);
  if (!ex || !isAddress(registry) || !/^\d+$/.test(tokenId.trim())) return null;
  return `${ex.base}/token/${registry.trim()}?a=${tokenId.trim()}`;
}

export type ResourceLink = {
  /** Where a click goes. Always http(s) after gateway rewriting. */
  href: string;
  /** How it was reached — shown beside the link so a reader knows an IPFS
   * link is going through a gateway rather than to the network directly. */
  via: string | null;
};

/**
 * The four schemes this site will link out to, and the gateways used for the
 * two that are not directly fetchable by a browser.
 *
 * `ipfs.io` is not an arbitrary choice: it is the gateway the checker itself
 * resolved `ipfs://` through for this run (see `request_url` on any
 * ipfs-scheme archive row, and `crates/probe/src/netguard.rs`). Linking
 * through the same gateway means a reader clicking the link fetches the same
 * bytes the census judged, rather than a different gateway's view of the
 * network.
 */
const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
const ARWEAVE_GATEWAY = "https://arweave.net/";

/**
 * Turn an agent-supplied URI into something safe to click, or `null`.
 *
 * `null` for:
 *   * `data:` — the document is inline and already rendered on the page in
 *     full; there is nowhere to go, and linking it would also mean emitting a
 *     `data:` href, which is a script-execution vector in some browsers.
 *   * the empty string — a legitimate `tokenURI` value, and not a location.
 *   * every other scheme, including `javascript:`, `vbscript:`, `file:` and
 *     `blob:`. This is an allowlist, not a blocklist, so a scheme nobody has
 *     thought of yet is refused by default rather than permitted by omission.
 */
export function resourceLink(uri: string): ResourceLink | null {
  const raw = uri.trim();
  if (raw === "") return null;

  // Compare case-insensitively: `JavaScript:` and `jAvAsCrIpT:` are the same
  // scheme to a browser, and a case-sensitive check is the classic way this
  // allowlist gets bypassed.
  const lower = raw.toLowerCase();

  if (lower.startsWith("https://") || lower.startsWith("http://")) {
    return { href: raw, via: null };
  }
  if (lower.startsWith("ipfs://")) {
    const rest = raw.slice("ipfs://".length).replace(/^\/+/, "");
    if (rest === "") return null;
    return { href: `${IPFS_GATEWAY}${rest}`, via: "ipfs.io" };
  }
  if (lower.startsWith("ar://")) {
    const rest = raw.slice("ar://".length).replace(/^\/+/, "");
    if (rest === "") return null;
    return { href: `${ARWEAVE_GATEWAY}${rest}`, via: "arweave.net" };
  }
  return null;
}

/**
 * `rel` for any link to agent-supplied content. Not for internal links, and
 * not for explorer links (those go to sites we chose, so they need no
 * `nofollow`).
 */
export const UNTRUSTED_REL = "noopener noreferrer nofollow ugc";

/**
 * Which evidence keys are worth linking, and as what.
 *
 * Evidence is rendered generically (key/value) precisely so it cannot drift
 * from what the checker writes — see `EvidenceTable`. This map is the one
 * exception, and it is additive only: a key not listed renders exactly as it
 * did before, as plain text. Nothing here changes a value, and a key whose
 * value fails its type check (an `owner` that is not 20 bytes) falls back to
 * plain text rather than producing a broken link.
 */
export type EvidenceLinkKind = "address" | "tx" | "block" | "resource";

export const EVIDENCE_LINK_KINDS: Record<string, EvidenceLinkKind> = {
  owner: "address",
  registry: "address",
  tx_hash: "tx",
  block_number: "block",
  uri: "resource",
  request_url: "resource",
  final_url: "resource",
};

/** Resolve one evidence key/value to an href, or `null` to render it plain. */
export function evidenceHref(
  chain: string,
  key: string,
  value: unknown,
): { href: string; untrusted: boolean } | null {
  const kind = EVIDENCE_LINK_KINDS[key];
  if (!kind) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value);

  switch (kind) {
    case "address": {
      const href = addressUrl(chain, text);
      return href ? { href, untrusted: false } : null;
    }
    case "tx": {
      const href = txUrl(chain, text);
      return href ? { href, untrusted: false } : null;
    }
    case "block": {
      const href = blockUrl(chain, text);
      return href ? { href, untrusted: false } : null;
    }
    case "resource": {
      const link = resourceLink(text);
      return link ? { href: link.href, untrusted: true } : null;
    }
  }
}
