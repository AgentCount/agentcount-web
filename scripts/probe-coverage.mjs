#!/usr/bin/env node
/**
 * probe-coverage.mjs — recomputable probe of ERC-8004 Identity Registry
 * registrations across every chain where the canonical registry is deployed.
 *
 * Method: the Identity Registry is CREATE2-deployed at the same address on
 * every EVM chain. totalSupply() reverts, so the population is recovered by
 * binary-searching ownerOf(id) (ERC-721 selector 0x6352211e) via eth_call:
 * find the boundary id where ownerOf(n) succeeds and ownerOf(n+1) reverts.
 * Agent ids are 0-based on some chains (e.g. BSC) and 1-based on others, so
 * the basis is detected per chain by probing ownerOf(0).
 *
 * Plain Node >= 20, zero dependencies (global fetch).
 *
 * Usage:
 *   node probe-coverage.mjs            # JSON to stdout
 *   node probe-coverage.mjs --out coverage-probe.json
 */

const REGISTRY = "0x8004a169fb4a3325136eb29fa0ceb6d2e539a432";
const OWNER_OF_SELECTOR = "0x6352211e";
const RPC_TIMEOUT_MS = 12_000;
const RETRIES_PER_RPC = 2;
const CHAIN_CONCURRENCY = 4;
// Upper bound for the exponential ramp; no chain is anywhere near this.
const MAX_ID = 100_000_000;

/** slug, display name, chainId, 1-3 public RPC URLs (tried in order). */
const CHAINS = [
  { slug: "mainnet",   name: "Ethereum",        chainId: 1,          rpcs: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://eth.drpc.org"] },
  { slug: "bsc",       name: "BNB Smart Chain", chainId: 56,         rpcs: ["https://bsc-dataseed.bnbchain.org", "https://bsc-rpc.publicnode.com", "https://bsc.drpc.org"] },
  { slug: "base",      name: "Base",            chainId: 8453,       rpcs: ["https://mainnet.base.org", "https://base-rpc.publicnode.com", "https://base.drpc.org"] },
  { slug: "polygon",   name: "Polygon",         chainId: 137,        rpcs: ["https://polygon-rpc.com", "https://polygon-bor-rpc.publicnode.com", "https://polygon.drpc.org"] },
  { slug: "arbitrum",  name: "Arbitrum One",    chainId: 42161,      rpcs: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com", "https://arbitrum.drpc.org"] },
  { slug: "optimism",  name: "Optimism",        chainId: 10,         rpcs: ["https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com", "https://optimism.drpc.org"] },
  { slug: "avalanche", name: "Avalanche",       chainId: 43114,      rpcs: ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche-c-chain-rpc.publicnode.com", "https://avalanche.drpc.org"] },
  { slug: "celo",      name: "Celo",            chainId: 42220,      rpcs: ["https://forno.celo.org", "https://celo-rpc.publicnode.com", "https://celo.drpc.org"] },
  { slug: "gnosis",    name: "Gnosis",          chainId: 100,        rpcs: ["https://rpc.gnosischain.com", "https://gnosis-rpc.publicnode.com", "https://gnosis.drpc.org"] },
  { slug: "linea",     name: "Linea",           chainId: 59144,      rpcs: ["https://rpc.linea.build", "https://linea-rpc.publicnode.com", "https://linea.drpc.org"] },
  { slug: "scroll",    name: "Scroll",          chainId: 534352,     rpcs: ["https://rpc.scroll.io", "https://scroll-rpc.publicnode.com", "https://scroll.drpc.org"] },
  { slug: "mantle",    name: "Mantle",          chainId: 5000,       rpcs: ["https://rpc.mantle.xyz", "https://mantle-rpc.publicnode.com", "https://mantle.drpc.org"] },
  { slug: "metis",     name: "Metis",           chainId: 1088,       rpcs: ["https://andromeda.metis.io/?owner=1088", "https://metis-mainnet.public.blastapi.io", "https://metis.drpc.org"] },
  { slug: "taiko",     name: "Taiko",           chainId: 167000,     rpcs: ["https://rpc.mainnet.taiko.xyz", "https://taiko-rpc.publicnode.com", "https://taiko.drpc.org"] },
  { slug: "monad",     name: "Monad",           chainId: 143,        rpcs: ["https://rpc.monad.xyz", "https://monad.drpc.org"] },
  { slug: "megaeth",   name: "MegaETH",         chainId: 4326,       rpcs: ["https://mainnet.megaeth.com/rpc"] },
  { slug: "xlayer",    name: "X Layer",         chainId: 196,        rpcs: ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"] },
  { slug: "billions",  name: "Billions",        chainId: 45056,      rpcs: ["https://rpc.billions.gateway.fm", "https://billions-rpc.eu-north-2.gateway.fm"] },
  { slug: "shape",     name: "Shape",           chainId: 360,        rpcs: ["https://mainnet.shape.network", "https://shape-mainnet.g.alchemy.com/public"] },
  { slug: "abstract",  name: "Abstract",        chainId: 2741,       rpcs: ["https://api.mainnet.abs.xyz", "https://abstract.drpc.org"] },
  { slug: "injective", name: "Injective EVM",   chainId: 1776,       rpcs: ["https://sentry.evm-rpc.injective.network", "https://injectiveevm-rpc.polkachu.com"] },
  { slug: "tempo",     name: "Tempo",           chainId: 4217,       rpcs: ["https://rpc.mainnet.tempo.xyz"] },
  { slug: "lukso",     name: "LUKSO",           chainId: 42,         rpcs: ["https://rpc.mainnet.lukso.network", "https://42.rpc.thirdweb.com", "https://rpc.lukso.sigmacore.io"] },
  { slug: "goat",      name: "GOAT Network",    chainId: 2345,       rpcs: ["https://rpc.goat.network"] },
  { slug: "soneium",   name: "Soneium",         chainId: 1868,       rpcs: ["https://rpc.soneium.org", "https://soneium.drpc.org"] },
  { slug: "ink",       name: "Ink",             chainId: 57073,      rpcs: ["https://rpc-gel.inkonchain.com", "https://rpc-qnd.inkonchain.com"] },
  { slug: "hyperevm",  name: "HyperEVM",        chainId: 999,        rpcs: ["https://rpc.hyperliquid.xyz/evm", "https://hyperliquid.drpc.org"] },
  { slug: "plasma",    name: "Plasma",          chainId: 9745,       rpcs: ["https://rpc.plasma.to"] },
  { slug: "gatelayer", name: "Gate Layer",      chainId: 10088,      rpcs: ["https://gatelayer-mainnet.gatenode.cc"] },
  { slug: "skale-base",name: "SKALE Base",      chainId: 1187947933, rpcs: ["https://skale-base.skalenodes.com/v1/base"] },
  { slug: "robinhood", name: "Robinhood Chain", chainId: 4663,       rpcs: ["https://rpc.mainnet.chain.robinhood.com"] },
  { slug: "fantom",    name: "Fantom Opera",    chainId: 250,        rpcs: ["https://rpcapi.fantom.network", "https://fantom-rpc.publicnode.com", "https://fantom.drpc.org"] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Thrown when the transport itself failed (network / HTTP / malformed). */
class RpcTransportError extends Error {}

let nextId = 1;
async function rawRpc(url, method, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
      signal: controller.signal,
    });
    if (!res.ok) throw new RpcTransportError(`HTTP ${res.status} from ${url}`);
    let body;
    try {
      body = await res.json();
    } catch {
      throw new RpcTransportError(`non-JSON response from ${url}`);
    }
    if (typeof body !== "object" || body === null) {
      throw new RpcTransportError(`malformed JSON-RPC response from ${url}`);
    }
    return body; // { result } or { error }
  } catch (err) {
    if (err instanceof RpcTransportError) throw err;
    throw new RpcTransportError(`${err.name === "AbortError" ? "timeout" : err.message} (${url})`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A per-chain RPC client that fails over across the chain's RPC list.
 * Every call retries the current endpoint, then advances to the next one.
 * When every endpoint has been exhausted it throws RpcTransportError, which
 * marks the chain rpc_unreachable — a revert is NOT a transport error and is
 * returned to the caller as { error }.
 */
class ChainClient {
  constructor(chain) {
    this.chain = chain;
    this.rpcIndex = 0;
    this.rpcUsed = null;
  }
  async call(method, params) {
    let lastErr;
    for (let i = this.rpcIndex; i < this.chain.rpcs.length; i++) {
      const url = this.chain.rpcs[i];
      for (let attempt = 0; attempt <= RETRIES_PER_RPC; attempt++) {
        try {
          const body = await rawRpc(url, method, params);
          // Some gateways surface overload as a JSON-RPC error; treat rate
          // limits as transport trouble so we back off / fail over instead of
          // misreading them as reverts.
          if (body.error && /rate|limit|capacity|exceed|timeout|busy/i.test(String(body.error.message ?? ""))) {
            throw new RpcTransportError(`rpc overloaded: ${body.error.message} (${url})`);
          }
          this.rpcIndex = i;
          this.rpcUsed = url;
          return body;
        } catch (err) {
          lastErr = err;
          if (attempt < RETRIES_PER_RPC) await sleep(400 * (attempt + 1));
        }
      }
    }
    throw lastErr ?? new RpcTransportError(`no RPCs configured for ${this.chain.slug}`);
  }
}

function encodeOwnerOf(id) {
  return OWNER_OF_SELECTOR + BigInt(id).toString(16).padStart(64, "0");
}

/**
 * true  -> ownerOf(id) returned an address (agent id exists)
 * false -> the call reverted / returned empty (agent id does not exist)
 * throws RpcTransportError if no RPC could answer at all.
 */
async function ownedAt(client, id) {
  const body = await client.call("eth_call", [
    { to: REGISTRY, data: encodeOwnerOf(id) },
    "latest",
  ]);
  if (body.error) return false; // revert -> nonexistent token
  const result = typeof body.result === "string" ? body.result : "0x";
  // A successful ownerOf returns a 32-byte word holding a nonzero address.
  return /^0x[0-9a-fA-F]{64}$/.test(result) && BigInt(result) !== 0n;
}

async function probeChain(chain) {
  const client = new ChainClient(chain);
  const record = {
    slug: chain.slug,
    name: chain.name,
    chain_id: chain.chainId,
    rpc_used: null,
    deployed: false,
    agents: null,
    id_basis: null,
    status: "rpc_unreachable",
  };
  try {
    // Sanity: the RPC serves the chain we think it does.
    const cid = await client.call("eth_chainId", []);
    if (cid.error || parseInt(cid.result, 16) !== chain.chainId) {
      throw new RpcTransportError(
        `chainId mismatch: expected ${chain.chainId}, got ${cid.result ?? cid.error?.message}`
      );
    }

    // 1. Is the canonical registry deployed here?
    const code = await client.call("eth_getCode", [REGISTRY, "latest"]);
    if (code.error) throw new RpcTransportError(`eth_getCode failed: ${code.error.message}`);
    if (!code.result || code.result === "0x") {
      record.rpc_used = client.rpcUsed;
      record.status = "not_deployed";
      return record;
    }
    record.deployed = true;

    // 2. Detect the id basis (0-based on some chains, 1-based on others).
    const hasZero = await ownedAt(client, 0);
    const basis = hasZero ? 0 : 1;
    record.id_basis = basis;
    if (!hasZero && !(await ownedAt(client, 1))) {
      // Deployed but empty registry.
      record.agents = 0;
      record.id_basis = null; // no ids exist; basis is undeterminable
      record.rpc_used = client.rpcUsed;
      record.status = "ok";
      return record;
    }

    // 3. Exponential ramp to bracket the highest existing id.
    let lo = basis; // known to exist
    let hi = null; // known not to exist
    for (let step = 1; ; step *= 2) {
      const candidate = lo + step;
      if (candidate > MAX_ID) throw new Error(`ramp exceeded MAX_ID on ${chain.slug}`);
      if (await ownedAt(client, candidate)) {
        lo = candidate;
      } else {
        hi = candidate;
        break;
      }
    }

    // 4. Binary search the boundary: lo = last existing id.
    while (hi - lo > 1) {
      const mid = lo + Math.floor((hi - lo) / 2);
      if (await ownedAt(client, mid)) lo = mid;
      else hi = mid;
    }

    record.agents = basis === 0 ? lo + 1 : lo;
    record.rpc_used = client.rpcUsed;
    record.status = "ok";
    return record;
  } catch (err) {
    record.status = "rpc_unreachable";
    record.error = String(err.message ?? err);
    record.rpc_used = client.rpcUsed;
    return record;
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const outFlag = process.argv.indexOf("--out");
  const outPath = outFlag !== -1 ? process.argv[outFlag + 1] : null;

  const results = await mapWithConcurrency(CHAINS, CHAIN_CONCURRENCY, async (chain) => {
    const rec = await probeChain(chain);
    process.stderr.write(
      `${chain.slug.padEnd(11)} ${rec.status.padEnd(15)} ${rec.agents ?? "-"}\n`
    );
    return rec;
  });

  results.sort((a, b) => (b.agents ?? -1) - (a.agents ?? -1) || a.slug.localeCompare(b.slug));

  const payload = {
    generated_at: new Date().toISOString(),
    registry: REGISTRY,
    method: "ownerOf binary search",
    chains: results,
  };
  const json = JSON.stringify(payload, null, 2) + "\n";
  if (outPath) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(outPath, json);
    process.stderr.write(`wrote ${outPath}\n`);
  } else {
    process.stdout.write(json);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
