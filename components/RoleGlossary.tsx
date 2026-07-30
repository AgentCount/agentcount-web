/**
 * The seven roles an "agent" collapses into, and which of them this census
 * actually reads.
 *
 * These are routinely conflated — by the ecosystem, by 8004scan, and by this
 * project's own earlier drafts. The identity-role audit found a published claim
 * that turned on the difference: 148 agents held by one registrant paid into 148
 * contracts controlled by 126 *other* addresses, so "one operator earned 97.9%"
 * was wrong at the level of who the money reached.
 *
 * The `reads` field is the part that keeps the census honest: a role we do not
 * read is a role we must never make claims about. `ownerOf` is read; ERC-721
 * approvals are not, so nothing here can speak to approved operators.
 *
 * Seven, not six: PAYMENT-CONTRACT CONTROLLER was added because it appeared in
 * none of the original six and is exactly what broke the 97.9% claim — it is
 * the address that actually controls the money. AGENT-CONTROLLED KEY was added
 * because every other role is a human-side one, and an agent that signs for
 * itself is a different thing entirely.
 */
type Role = {
  name: string;
  source: string;
  reads: "read" | "not read";
  body: React.ReactNode;
};

const ROLES: Role[] = [
  {
    name: "NFT owner",
    source: "ownerOf(agentId) — on-chain, block-dependent",
    reads: "read",
    body: (
      <>
        Who holds the agent&rsquo;s ERC-721 token at a given block. This is the
        only identity the census reads, and it is <strong>not stable</strong>:
        the token can be transferred, so &ldquo;the owner&rdquo; means &ldquo;the
        owner at the pinned block&rdquo; and nothing more. 42 of the 313 agents whose
        declared wallet has been paid have changed hands at least once.
      </>
    ),
  },
  {
    name: "Minter",
    source: "sender of the registration transaction — not stored",
    reads: "not read",
    body: (
      <>
        Who called <code className="font-mono text-text">register()</code>. Often
        but not always the first owner, and frequently a platform registering on
        a customer&rsquo;s behalf. The census does{" "}
        <strong>not currently store this</strong>; where a report names a minter
        it was pulled by hand from the mint transaction and says so. 8004scan
        displays it as CREATOR; capturing it is on the sweeper backlog.
      </>
    ),
  },
  {
    name: "Approved operator",
    source: "ERC-721 approve / setApprovalForAll",
    reads: "not read",
    body: (
      <>
        An address the owner has authorised to act on the token. The spec bans
        feedback from operators as well as owners (line 217), but{" "}
        <strong>this census never reads approvals</strong> — so it cannot
        identify an operator, and no rung or report may claim otherwise.
      </>
    ),
  },
  {
    name: "agentWallet",
    source: "getAgentWallet(agentId) — on-chain, signature-verified",
    reads: "read",
    body: (
      <>
        The spec&rsquo;s payment address: reserved registry metadata, changeable
        only by proving control of the new address (EIP-712, or ERC-1271 for
        contract wallets), and cleared automatically when the agent is
        transferred. Set for 40,473 agents on Base — but equal to the owner for
        40,126 of them, which is the default and required no proof. Only{" "}
        <strong>347</strong> agents have verified a distinct address.
      </>
    ),
  },
  {
    name: "Declared wallet (convention)",
    source: 'a services[] entry named "agentWallet" — off-chain, unverified',
    reads: "read",
    body: (
      <>
        A community convention that appears <strong>nowhere in the spec</strong>.
        920 documents use it. It carries no proof of control, no link to the
        on-chain identity, and is served over mutable HTTP — and for 409 agents
        it disagrees with the address the registry has verified. Never presented
        as conformance.
      </>
    ),
  },
  {
    name: "Payment-contract controller",
    source: "owner() of a per-agent payment or vault contract",
    reads: "not read",
    body: (
      <>
        Where an <code className="font-mono text-text">agentWallet</code> is a
        contract rather than an EOA, whoever that contract answers to. Appears in
        no registry and in none of the other roles. It is the address that
        actually controls the money: for the largest registrant in the dataset,
        148 agents held by <strong>one</strong> owner paid into contracts
        controlled by <strong>126 different addresses</strong>, none of them the
        owner. Ignoring this role produced a published claim that was wrong about
        who had been paid.
      </>
    ),
  },
  {
    name: "Agent-controlled key",
    source: "a TEE-held or agent-held signing key — nothing on-chain marks it",
    reads: "not read",
    body: (
      <>
        An address the agent itself signs with, rather than a human. Nothing in
        ERC-8004 distinguishes it from any other EOA: a key in a TEE and a key on
        a founder&rsquo;s laptop are the same 20 bytes on-chain. So the census{" "}
        <strong>cannot tell autonomous action from human action</strong>, and no
        rung or report may imply it can.
      </>
    ),
  },
  {
    name: "Service operator",
    source: "whoever runs the endpoints — in no registry at all",
    reads: "not read",
    body: (
      <>
        The party actually answering the agent&rsquo;s declared endpoints. Not
        recorded on-chain, not in the registration document, and not knowable
        from either. An agent&rsquo;s owner, minter, wallet controller and
        service operator can all be four different parties, and{" "}
        <strong>nothing in ERC-8004 lets a reader tell</strong>.
      </>
    ),
  },
];

export function RoleGlossary() {
  return (
    <div>
      <p className="max-w-prose text-sm leading-relaxed text-muted">
        &ldquo;The agent&rdquo; is seven different parties wearing one word. They
        are frequently the same address and just as frequently not, so every
        claim on this site names which one it means — and says whether the
        census reads it at all.
      </p>
      <dl className="mt-5">
        {ROLES.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[13rem_1fr]"
          >
            <dt>
              <span className="font-mono text-xs uppercase tracking-[0.1em] text-text">
                {r.name}
              </span>
              <span className="mt-1 block font-mono text-[0.6875rem] leading-relaxed text-dead">
                {r.source}
              </span>
              <span
                className={`mt-1.5 inline-block border px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.08em] ${
                  r.reads === "read"
                    ? "border-live/45 text-live"
                    : "border-dim/40 text-dim"
                }`}
              >
                {r.reads === "read" ? "census reads this" : "not read"}
              </span>
            </dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">
              {r.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
