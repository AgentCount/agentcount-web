import { OutboundLink } from "@/components/OutboundLink";
import { Section } from "@/components/Section";
import { TextLink } from "@/components/TextLink";
import { LINKAGE } from "@/lib/linkage";

export const metadata = {
  title: "Linkage",
  description:
    "Where the census identity layer meets the payments layer: what the join is, how an address is the only thing the two share, and the 369,130 registered agents on four chains it is read against.",
};

const num = (n: number) => n.toLocaleString("en-US");

/**
 * The join between who is registered and who gets paid.
 *
 * ## Why this is its own page
 *
 * The census answers "does this agent conform". The payments layer answers
 * "has this address ever received money". Neither is interesting on its own —
 * every registry has registrations, and every chain has transfers. The join
 * is the finding, and it is the one number in this project that a reader is
 * most likely to arrive already having an opinion about.
 *
 * ## Why the page carries no payment figures
 *
 * The figures it carried came from a log scan run outside the census database,
 * against no pinned run, reproducible from no published archive. Every other
 * number on this site recomputes from a run id and a block; those did not, so
 * they are not here. The page keeps the subject, the method and the population
 * the join is read against, and states no rate until the payments pipeline
 * produces one under a pinned run.
 */
export default function LinkagePage() {
  const { census } = LINKAGE;

  return (
    <>
      <header className="border-b border-edge pb-6">
        <h1 className="headline max-w-[22ch] text-[clamp(1.75rem,3.4vw,2.75rem)] text-text">
          Where registration meets payment
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Two layers that are usually discussed as one. This page joins them on
          the only thing they share — an address — and reports what survives.
        </p>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-xs text-dead">
          <span>
            census <span className="text-muted">{census.label}</span>
          </span>
          <span className="text-line">|</span>
          <span>
            <span className="text-muted">{num(census.agents)}</span> agents
          </span>
          <span className="text-line">|</span>
          <span>four chains</span>
        </div>
      </header>

      <Section
        title="What the join asks"
        aside="one address, two layers"
        className="mt-16 max-w-3xl"
      >
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          An ERC-8004 registration is an entry in the Identity Registry and a
          document at a URI. A payment is a token transfer to an address. The
          registry and the transfer share exactly one field that could tie them
          together: the address an agent nominates to be paid at. Everything on
          this page turns on that one join, and on how weak it is.
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          There are two candidate addresses, and they are not the same thing.
          The spec&rsquo;s own field is{" "}
          <code className="font-mono text-xs text-text">agentWallet</code>:
          reserved registry metadata, changeable only by proving control of the
          new address, and cleared automatically when the agent is transferred.
          Beside it sits a community convention that appears nowhere in the
          spec, a <code className="font-mono text-xs text-text">services[]</code>{" "}
          entry also named{" "}
          <code className="font-mono text-xs text-text">agentWallet</code>,
          which carries no proof of control and is served over mutable HTTP. A
          rate computed on the second is a rate about what people wrote down.
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          <span className="text-text">What a match would establish.</span>{" "}
          A matching address confirms that a transfer occurred and who received
          it. It never confirms who initiated it or why: airdrops, refunds,
          mistakes and an operator&rsquo;s own capital returning from DeFi all
          look identical to it. And a seller with no match is not &ldquo;not an
          agent&rdquo;; it is not a{" "}
          <span className="text-text">registered</span> ERC-8004 identity on
          the chains this census sweeps.
        </p>
      </Section>

      <Section
        title="Why x402 is the protocol-level signal"
        aside="method"
        className="mt-16 max-w-3xl"
      >
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          A plain stablecoin transfer is the primary measure: it is what
          &ldquo;paid&rdquo; means, and it needs no protocol to be true. On top
          of it, a payment can be flagged{" "}
          <span className="text-text">x402-style</span> when its transaction
          also carries an EIP-3009 authorization from the same token, which is
          how <OutboundLink href="https://www.x402.org">x402</OutboundLink>{" "}
          settles on EVM chains.
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          x402 is singled out for two reasons and no others. It is the one
          payment protocol the ERC-8004 spec name-checks — a registration
          document may declare{" "}
          <code className="font-mono text-xs text-text">x402Support</code> — and
          it is the one with an independent index to check a count against.
          Other rails, Google&rsquo;s AP2 and Solana&rsquo;s among them, exist
          and are out of scope. The authorization signal is also broader than
          x402 itself: any gasless EIP-3009 transfer authorises the same way, so
          a count built on it is an upper bound on x402 and has to be checked
          against a second source before it is published.
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Any figure produced this way is a{" "}
          <span className="text-text">lower bound</span> on payment. It reads a
          fixed set of stablecoins and nothing else, so native ETH, every other
          token and every off-chain settlement are invisible to it, and a
          settlement aggregated off-chain leaves no per-transfer authorisation
          to see. Symbols and decimals have to be read from each contract rather
          than assumed: BNB Chain&rsquo;s USDC and USDT are 18 decimals, not 6.
        </p>
      </Section>

      <Section
        title="The population it is read against"
        aside={`census ${census.label}`}
        className="mt-16 max-w-3xl"
        intro={
          <>
            The denominator of any rate this page eventually carries.
            Registration counts from the most recent published sweep of each
            chain, which is the same population every other figure on this site
            divides by.
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full max-w-md border-collapse text-left text-[0.8125rem]">
            <thead>
              <tr>
                <th scope="col" className="label border-b border-edge px-3 py-2 font-normal">
                  chain
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  agents
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  share
                </th>
              </tr>
            </thead>
            <tbody>
              {/* `hover:bg-raised` row scan aid — same pattern as
                  `AgentTable.tsx` and the other reference tables site-wide.
                  Applied to the totals row too: it is still a data row a
                  reader might be scanning to. */}
              {census.chains.map((c) => (
                <tr key={c.chain} className="transition-colors hover:bg-raised">
                  <td className="border-b border-line px-3 py-2 font-mono text-muted">{c.chain}</td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-text">
                    {num(c.agents)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {((c.agents / census.agents) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="transition-colors hover:bg-raised">
                <td className="border-b border-edge px-3 py-2 font-mono text-text">all four</td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-text">
                  {num(census.agents)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-dead">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          <span className="text-text">Attestation does not stand in for
          payment.</span>{" "}
          Celo attests at a rate an order of magnitude above
          every other chain, and that rate is three addresses writing feedback
          for one platform&rsquo;s batch of agents. It was never a measure of
          commerce. No report on this site lets one of these measures stand in
          for the other.
        </p>
      </Section>

      <Section title="Where the numbers come from" aside="reproducible" className="mt-16 max-w-3xl">
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          Every conformance figure on this site recomputes from a published run:
          one sweep per chain, each pinned to a block, each with its archive and
          sha256 committed. The payments side does not recompute that way yet,
          which is why this page carries the method and the population and no
          rate. A figure that cannot be recomputed from a run id is not
          published here.
        </p>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <TextLink href="/data" tone="bright">Every run, with its archive →</TextLink>
          <TextLink href="/coverage" tone="bright">What the census covers →</TextLink>
          <TextLink href="/methodology" tone="bright">What each check measures →</TextLink>
        </p>
      </Section>
    </>
  );
}
