import Link from "next/link";
import { OutboundLink } from "@/components/OutboundLink";
import { Section } from "@/components/Section";
import { LINKAGE } from "@/lib/linkage";

export const metadata = {
  title: "Linkage",
  description:
    "Where the census identity layer meets the payments layer, across 369,130 registered agents on four chains. Payments to registered agents are rare; the 2026-07-30 figures for how rare are superseded, and a pinned recomputation is in progress.",
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
 * ## Why the page no longer leads with that number
 *
 * The figures it led with — 358 paid, 34 through x402, 0.017% of x402's
 * top-100 volume — come from one log study that ran on 2026-07-30 and cannot
 * be recomputed from any published archive. On 2026-08-06 the maintainer
 * withdrew all of them as headline claims pending a rebuilt, pinned pipeline
 * (AgentCount/agentcount#35). They are still on the page, in the body, each
 * carrying its date and the note that it is superseded, because a published
 * number that quietly disappears teaches a reader less than one published
 * beside its retraction. The headline is now the claim the evidence still
 * supports, which is a qualitative one.
 */
export default function LinkagePage() {
  const { census, payments } = LINKAGE;
  const { chains, total, crossCheck, runs } = payments;

  /** Printed under every superseded figure, verbatim, as many times as there
   * are figures. Repetition is the point: a reader who takes one number away
   * from this page must take its date with it. */
  const supersededNote = (
    <>
      Measured {payments.measuredOn} by a one-off log study, on a
      declared-wallet basis. Superseded; a pinned recomputation is in progress
      (
      <OutboundLink href={payments.issueUrl}>{payments.issue}</OutboundLink>).
    </>
  );

  return (
    <>
      <header className="border-b border-edge pb-6">
        <h1 className="numeral max-w-[22ch] text-[clamp(1.75rem,3.4vw,2.75rem)] text-text">
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
          <span className="text-line">|</span>
          <span>
            payments figures{" "}
            <span className="text-muted">under revision</span>
          </span>
        </div>
      </header>

      {/* The headline is what the evidence still supports. The figures it used
          to be are below, dated. */}
      <section aria-label="Headline linkage" className="mt-12 max-w-3xl">
        <p className="numeral max-w-[26ch] text-[clamp(1.5rem,3vw,2.25rem)] leading-tight text-text">
          Payments to registered agents are rare.
        </p>
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted">
          Every measurement AgentCount has made of this join has found that
          only a small minority of the {num(census.agents)} registered agents
          on these four chains has ever received a payment at the wallet its
          own registration document declares. How small is under revision, and
          this page will not state a figure it cannot stand behind.
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          The figures published on {payments.measuredOn} came from a log study
          that ran once. It is pinned to no run, held in no census database,
          and recomputable from no published archive. It had already been
          corrected once in public: the agents recorded as paid on Base went
          from 313 to 190 when an attribution error was found. On{" "}
          {payments.supersededOn} the maintainer withdrew all of its figures as
          headline claims until a rebuilt pipeline reproduces them under a
          pinned run (
          <OutboundLink href={payments.issueUrl}>{payments.issue}</OutboundLink>
          ).
        </p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          The figures themselves are kept below rather than deleted, each with
          the date it was measured and what it counted. Deleting them would
          leave every citation of them pointing at nothing.
        </p>
      </section>

      <Section
        title="The figures under revision"
        aside={`measured ${payments.measuredOn}`}
        className="mt-20 max-w-3xl"
        intro={
          <>
            These three are what this page led with until{" "}
            {payments.supersededOn}. They are reproduced here as a dated
            artifact. None of them should be quoted as a current measurement of
            the agent economy, and none of them is quoted that way anywhere
            else on this site.
          </>
        }
      >
        <dl className="mt-2">
          <div className="border-t border-line py-5">
            <dt className="numeral text-[clamp(1.5rem,2.6vw,2rem)] text-muted">
              {num(total.paid)}
            </dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
              agents of the {num(total.agents)} registered at the four blocks
              this study pinned had ever been paid: an external stablecoin
              transfer arriving after the agent was minted, at the wallet its
              own document declared.
              <span className="mt-2 block font-mono text-[0.6875rem] leading-relaxed text-dead">
                {supersededNote}
              </span>
            </dd>
          </div>
          <div className="border-t border-line py-5">
            <dt className="numeral text-[clamp(1.5rem,2.6vw,2rem)] text-muted">
              {num(total.x402)}
            </dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
              agents had ever received a settlement through{" "}
              <OutboundLink href="https://www.x402.org">x402</OutboundLink>,{" "}
              {chains.find((c) => c.chain === "base")?.x402} of them on Base.
              x402 is the payment protocol the ERC-8004 spec itself
              name-checks.
              <span className="mt-2 block font-mono text-[0.6875rem] leading-relaxed text-dead">
                {supersededNote}
              </span>
            </dd>
          </div>
          <div className="border-t border-line py-5">
            <dt className="numeral text-[clamp(1.5rem,2.6vw,2rem)] text-muted">
              {crossCheck.agentLinkedShare}%
            </dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
              of {crossCheck.source}&rsquo;s top-100 seller volume was
              agent-linked, tested against an index built by someone else, by a
              different method, that has no concept of ERC-8004.
              <span className="mt-2 block font-mono text-[0.6875rem] leading-relaxed text-dead">
                {supersededNote}
              </span>
            </dd>
          </div>
        </dl>

        {/* Why x402 is the protocol-level signal, and how the sources were
            verified — stated where payments data first appears on the site,
            because this project demands exactly this passage of everyone it
            measures. */}
        <p className="mt-8 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          <span className="text-text">Why x402, and how these figures were
          checked.</span>{" "}
          &ldquo;Paid&rdquo; counted plain stablecoin transfers — that was the
          primary measure. On top of it, a payment was flagged{" "}
          <span className="text-text">x402-style</span> when its transaction
          also carried an EIP-3009 authorization from the same token, which is
          how <OutboundLink href="https://www.x402.org">x402</OutboundLink>{" "}
          settles on EVM chains. x402 is measured at the protocol level
          because it is the one payment protocol the ERC-8004 spec
          name-checks (a registration document may declare{" "}
          <code className="font-mono text-xs">x402Support</code>) and the one
          with an independent index to verify against; other rails — AP2,
          Solana&rsquo;s — exist and are out of scope. The authorization
          signal is broader than x402 itself, so the {num(total.x402)} was
          checked against{" "}
          <OutboundLink href={crossCheck.sourceUrl} untrusted>
            {crossCheck.source}
          </OutboundLink>{" "}
          below: of the {crossCheck.baseAddresses} receiving addresses it can
          see, {crossCheck.corroborated} corroborate,{" "}
          {crossCheck.exactMatches} to the exact settlement count. That
          cross-check tested the {num(total.x402)} and did not test the
          pipeline that produced it, which is what {payments.issue} rebuilds.
        </p>
      </Section>

      <Section
        title="Per chain"
        aside={`as swept ${payments.measuredOn}`}
        className="mt-20"
        intro={
          <>
            The study&rsquo;s own table, on the study&rsquo;s own populations:
            the agent counts below are what each chain held at the block it was
            pinned to on {payments.measuredOn}, not what it holds now. Two
            stablecoins per chain and nothing else, so every value is a floor
            rather than a total. Symbols and decimals were read from each
            contract rather than assumed — BNB Chain&rsquo;s USDC and USDT are
            18 decimals, not 6. Every rate in this table is superseded on the
            same terms as the three figures above.
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
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {num(c.paid)}
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
                    {((c.paid / c.agents) * 100).toFixed(3)}%
                  </td>
                  <td className="border-b border-line px-3 py-2 text-right font-mono text-muted">
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
                <td className="border-b border-edge px-3 py-2 font-mono text-muted">{total.chain}</td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-muted">
                  {num(total.agents)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-muted">
                  {num(total.paid)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-muted">
                  {((total.paid / total.agents) * 100).toFixed(3)}%
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-muted">
                  {num(total.x402)}
                </td>
                <td className="border-b border-edge px-3 py-2 text-right font-mono text-muted">
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
          This is the one conclusion here that a rebuilt payments pipeline
          would have to reverse rather than merely re-scale.
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
            are registered agents. Queried {crossCheck.queriedOn}, and
            superseded on the same terms as everything else on this page.
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
              <dd className="border-line pb-2 text-right font-mono text-sm text-muted sm:border-t sm:py-2">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          <span className="text-text">The forward direction first:</span> our{" "}
          {num(total.x402)} x402-settled agents resolve to{" "}
          {num(crossCheck.baseAddresses)} receiving addresses on chains{" "}
          {crossCheck.source} indexes. {num(crossCheck.corroborated)} of the{" "}
          {num(crossCheck.baseAddresses)} corroborate —{" "}
          {num(crossCheck.exactMatches)} to the exact settlement count. Both
          divergences trace to their index being facilitator-scoped. The
          hypothesis that would have overturned our number — double counting
          on our side — was tested first: every flagged transfer sits in its
          own transaction. No correction was forced.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Zero of the {num(crossCheck.sellersExamined)} is a declared{" "}
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
          four chains we sweep. That is the finding that survives the
          retraction: the registry is not where the payment activity is.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {crossCheck.source} published no statement of limits of its own as
          of {crossCheck.queriedOn}, so this caveat is ours and is not
          attributed to them. Its index is{" "}
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
        aside="no series yet"
        className="mt-20 max-w-3xl"
        intro={
          <>
            This is the number worth watching, and the one observation of it
            has been withdrawn. The axis below is kept so the first figure the
            rebuilt pipeline produces has somewhere to land.
          </>
        }
      >
        {/* A labelled, empty axis. It held one plotted point until the study
            behind it was superseded; plotting a withdrawn figure as the
            origin of a series would launder it back into a measurement. */}
        <figure className="mt-2">
          <svg
            viewBox="0 0 640 180"
            role="img"
            aria-label="Agents ever paid: no publishable observation. The 2026-07-30 figure is superseded and a pinned recomputation is in progress."
            className="w-full"
          >
            <line x1="52" y1="150" x2="620" y2="150" className="stroke-edge" strokeWidth="1" />
            <line x1="52" y1="20" x2="52" y2="150" className="stroke-edge" strokeWidth="1" />
            <text x="72" y="62" className="fill-dead font-mono text-[13px]">
              {payments.measuredOn}: superseded, not plotted
            </text>
            <text x="72" y="86" className="fill-dead font-mono text-[12px]">
              the first pinned observation lands here
            </text>
          </svg>
          <figcaption className="mt-3 text-xs leading-relaxed text-dead">
            Agents that have ever been paid, across all four chains. A rate
            that <em className="not-italic">falls</em> is as publishable as one
            that rises, and this project has no stake in which.
          </figcaption>
        </figure>
      </Section>

      <Section title="Provenance" aside="what it was scoped to" className="mt-20 max-w-3xl">
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
          The four runs above are pinned and published, and every conformance
          figure on this site recomputes from them. The payments scan is the
          part that does not: it read token transfer logs and EIP-3009
          authorisations outside the census database, once, and left no archive
          a reader could re-run. That gap is why the figures on this page are
          superseded rather than merely old, and closing it is what{" "}
          <OutboundLink href={payments.issueUrl}>{payments.issue}</OutboundLink>{" "}
          tracks.
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
