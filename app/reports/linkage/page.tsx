import Link from "next/link";
import { OutboundLink } from "@/components/OutboundLink";
import { Section } from "@/components/Section";
import { LINKAGE, oneIn } from "@/lib/linkage";

export const metadata = {
  title: "Linkage",
  description:
    "Where the census identity layer meets the payments layer: 358 agents of 354,858 have ever been paid, 34 have ever settled through x402, and agent-linked value is 0.017% of x402's top-100 volume.",
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const num = (n: number) => n.toLocaleString("en-US");

/**
 * The join between who is registered and who gets paid.
 *
 * ## Why this is its own page
 *
 * The census answers "does this agent conform". The payments scan answers
 * "has this address ever received money". Neither is interesting on its own —
 * every registry has registrations, and every chain has transfers. The join
 * is the finding, and it is the one number in this project that a reader is
 * most likely to arrive already having an opinion about.
 *
 * It is also the metric most worth watching over time, which is why the
 * placeholder below exists rather than being left until there is a second
 * observation. A page built for one number gets rebuilt when the second
 * arrives; a page built for a series just gets a second point.
 */
export default function LinkagePage() {
  const { chains, total, crossCheck, runs, measuredOn } = LINKAGE;

  return (
    <>
      <header className="border-b border-edge pb-6">
        <h1 className="numeral max-w-[22ch] text-[clamp(1.75rem,3.4vw,2.75rem)] text-text">
          Where registration meets payment
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Two layers that are usually discussed as one. This page joins them on
          the only thing they share — an address — and reports what survives.
          Every figure is scoped to the four pinned runs listed at the foot of
          the page, and every one of them is a{" "}
          <span className="text-text">lower bound</span>.
        </p>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-xs text-dead">
          <span>
            measured <span className="text-muted">{measuredOn}</span>
          </span>
          <span className="text-line">|</span>
          <span>
            <span className="text-muted">{num(total.agents)}</span> agents
          </span>
          <span className="text-line">|</span>
          <span>four chains</span>
        </div>
      </header>

      <section aria-label="Headline linkage" className="mt-12">
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-3">
          <div className="border-l-2 border-edge pl-5">
            <div className="numeral text-[clamp(2rem,4vw,3rem)] text-text">
              {oneIn(total.paid, total.agents)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              agents has ever been paid — {num(total.paid)} of{" "}
              {num(total.agents)}. &ldquo;Paid&rdquo; means an external
              stablecoin transfer arriving after the agent was minted, at the
              wallet its own document declared.
            </p>
          </div>
          <div className="border-l-2 border-edge pl-5">
            <div className="numeral text-[clamp(2rem,4vw,3rem)] text-text">
              {oneIn(total.x402, total.agents)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              has ever received a settlement through x402 — {num(total.x402)}{" "}
              agents, and {chains.find((c) => c.chain === "base")?.x402} of them
              are on one chain. x402 is the ecosystem&rsquo;s own payment
              protocol.
            </p>
          </div>
          <div className="border-l-2 border-edge pl-5">
            <div className="numeral text-[clamp(2rem,4vw,3rem)] text-text">
              {crossCheck.agentLinkedShare}%
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              of x402&rsquo;s top-100 seller volume is agent-linked, tested
              against an index built by someone else, by a different method,
              that has no concept of ERC-8004.
            </p>
          </div>
        </div>
      </section>

      <Section
        title="Per chain"
        aside="lower bounds"
        className="mt-20"
        intro={
          <>
            Two stablecoins per chain and nothing else, so every value is a
            floor rather than a total. Symbols and decimals were read from each
            contract rather than assumed — BNB Chain&rsquo;s USDC and USDT are
            18 decimals, not 6.
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.8125rem]">
            <thead>
              <tr>
                <th scope="col" className="label border-b border-edge px-3 py-2 font-normal">
                  chain
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  agents
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  ever paid
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  rate
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  ever x402
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  external value
                </th>
                <th scope="col" className="label border-b border-edge px-3 py-2 text-right font-normal">
                  from contracts
                </th>
              </tr>
            </thead>
            <tbody>
              {chains.map((c) => (
                <tr key={c.chain}>
                  <td className="border-b border-line px-3 py-2 font-mono text-muted">{c.chain}</td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {num(c.agents)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-text">
                    {num(c.paid)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {((c.paid / c.agents) * 100).toFixed(3)}%
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-text">
                    {num(c.x402)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {usd(c.externalValue)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {c.fromContracts === null ? "—" : `${c.fromContracts}%`}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="border-b border-edge px-3 py-2 font-mono text-text">{total.chain}</td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-text">
                  {num(total.agents)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-text">
                  {num(total.paid)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-text">
                  {((total.paid / total.agents) * 100).toFixed(3)}%
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-text">
                  {num(total.x402)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-text">
                  {usd(total.externalValue)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-dead">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          <span className="text-text">Attestation does not predict payment.</span>{" "}
          Celo attests at 79.5% and pays at 0.185% — a ratio of 430 to 1. Its
          attestation rate was three addresses writing feedback for one
          platform&rsquo;s batch of agents; it was never a measure of commerce.
          No report should let one of these measures stand in for the other.
        </p>
      </Section>

      <Section
        title="Checked against a second source"
        aside={crossCheck.source}
        className="mt-20 max-w-3xl"
        intro={
          <>
            The reverse direction, which is the stronger result: rather than
            asking whether our agents appear in an external index, we asked
            whether that index&rsquo;s <em className="not-italic text-text">busiest sellers</em>{" "}
            are registered agents.
          </>
        }
      >
        <dl className="grid grid-cols-1 sm:grid-cols-[1fr_auto]">
          {(
            [
              ["top EVM sellers examined", num(crossCheck.sellersExamined)],
              ["…that are a declared agentWallet", num(crossCheck.declaredAgentWallet)],
              ["…that own an agent, on any of the four chains", num(crossCheck.agentOwner)],
              ["x402scan's top 100 by volume", usd(crossCheck.topSellerVolume)],
              ["our corroborated agent addresses", usd(crossCheck.ourVolume)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="border-t border-line py-2 text-sm text-muted sm:pr-6">{label}</dt>
              <dd className="border-line pb-2 text-right font-mono text-sm text-text sm:border-t sm:py-2">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Zero of the 138 is a declared{" "}
          <code className="font-mono text-xs text-text">agentWallet</code>. The
          three that own an agent all sell on Base while owning an agent on a{" "}
          <span className="text-text">different chain</span> — address reuse by
          an operator, not an agent being paid.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          <span className="text-text">What this does not establish:</span> a
          matching address confirms that a settlement occurred and who received
          it — never who initiated it or why. And a non-matching seller is not
          &ldquo;not an agent&rdquo;; it is not a{" "}
          <span className="text-text">registered</span> ERC-8004 identity on the
          four chains we sweep. That is the finding: the registry is not where
          the payment activity is.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {crossCheck.source} publishes no statement of limits of its own, so
          this caveat is ours and is not attributed to them. Its index is{" "}
          <span className="text-text">facilitator-scoped</span> where ours reads
          the chain directly, and it covers base, solana, polygon and optimism —{" "}
          <span className="text-text">not</span> Celo, BNB Chain or Ethereum
          mainnet.{" "}
          <OutboundLink href={crossCheck.sourceUrl} untrusted>
            {crossCheck.sourceUrl.replace(/^https:\/\//, "")}
          </OutboundLink>
          , queried {crossCheck.queriedOn}.
        </p>
      </Section>

      <Section
        title="Over time"
        aside="one observation"
        className="mt-20 max-w-3xl"
        intro={
          <>
            This is the number worth watching, and there is exactly one of it.
            The chart below is deliberately not a trend — a line through a
            single point is a drawing, not a measurement.
          </>
        }
      >
        {/* A single plotted observation on a labelled axis. It exists so the
            second sweep has somewhere to land, and so nobody is tempted to
            read a direction into a series that has none yet. */}
        <figure className="mt-2">
          <svg
            viewBox="0 0 640 180"
            role="img"
            aria-label={`Agents ever paid, ${measuredOn}: ${total.paid} of ${total.agents}. One observation; no trend.`}
            className="w-full"
          >
            <line x1="52" y1="150" x2="620" y2="150" className="stroke-edge" strokeWidth="1" />
            <line x1="52" y1="20" x2="52" y2="150" className="stroke-edge" strokeWidth="1" />
            <circle cx="120" cy="62" r="4" className="fill-live" />
            <text x="134" y="58" className="fill-text font-mono text-[13px]">
              {num(total.paid)} paid
            </text>
            <text x="134" y="76" className="fill-dead font-mono text-[11px]">
              {measuredOn}
            </text>
            <text x="300" y="100" className="fill-dead font-mono text-[12px]">
              the second point lands here after the next sweep
            </text>
          </svg>
          <figcaption className="mt-3 text-xs leading-relaxed text-dead">
            Agents that have ever been paid, across all four chains. Updated per
            sweep; a rate that <em className="not-italic">falls</em> is as
            publishable as one that rises, and this project has no stake in
            which.
          </figcaption>
        </figure>
      </Section>

      <Section title="Provenance" aside="reproducible" className="mt-20 max-w-3xl">
        <dl className="grid grid-cols-1 sm:grid-cols-[6rem_1fr]">
          {runs.map((r) => (
            <div key={r.runId} className="contents">
              <dt className="label border-t border-line py-2 sm:pr-4">{r.chain}</dt>
              <dd className="break-all border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                run {r.runId} · block {num(r.pinnedBlock)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          The payments scan reads token transfer logs and EIP-3009
          authorisations directly, so these figures are not produced by the
          census API and are not recomputed per page load. They are published
          numbers with a date on them. The full working, including the four
          corrections made before publication and the one caught during the
          cross-check, is in the report.
        </p>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
          <Link
            href="/reports/2026-07-census"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            The full report →
          </Link>
          <Link
            href="/methodology"
            className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
          >
            What each check measures →
          </Link>
        </p>
      </Section>
    </>
  );
}
