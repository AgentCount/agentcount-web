import Link from "next/link";
import { OutboundLink } from "./OutboundLink";
import type { TailAgent } from "@/lib/api/schemas";
import { chainDisplayName } from "@/lib/chains";
import { addressUrl, blockUrl, resourceLink } from "@/lib/links";

/**
 * An agent the registry contains and the census has not read yet.
 *
 * ## Why this is a separate page rather than the agent page with gaps
 *
 * The agent page is built to show seven answers and the evidence behind
 * them. Rendering it for an agent that has none would put the census
 * furniture — the check strip, the evidence tables, the run provenance —
 * around seven blanks, and a blank in a row of statuses reads as a failure.
 * The distinction this whole product sells is that "not asked" and "asked
 * and failed" are different claims, so the page that has asked nothing has
 * to look different, not emptier.
 *
 * ## What it may and may not say
 *
 * Everything here comes from two on-chain reads at one block: who owns the
 * token and what URI it points at. That is all the tail collects. It makes
 * no claim about whether the URI resolves, whether the document parses, or
 * whether anyone has attested to the agent — those are the questions a
 * census run asks, and this page's job is to say plainly that nobody has
 * asked them yet.
 */
export function UncheckedAgent({ agent }: { agent: TailAgent }) {
  const ownerHref = addressUrl(agent.chain, agent.owner);
  const blockHref = blockUrl(agent.chain, agent.discovery_block);
  const uriLink = resourceLink(agent.agent_uri);
  const discovered = agent.discovered_at.slice(0, 10);

  return (
    <>
      <header className="border-b border-edge pb-6">
        <p className="label">Registered · not yet checked</p>
        <h1 className="numeral mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">
          Agent #{agent.agent_id.toLocaleString("en-US")} on{" "}
          {chainDisplayName(agent.chain)}
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          This agent exists in the registry — we read its owner and the URI it
          declares directly from the chain. It has{" "}
          <span className="text-text">not been through a census run</span>, so
          none of the seven checks has been asked of it. That is not a
          failure and not a gap in its record: it is a statement about what we
          have done, not about the agent.
        </p>
      </header>

      <section aria-label="What the chain says" className="mt-10 max-w-3xl">
        <dl className="grid grid-cols-1 sm:grid-cols-[10rem_1fr]">
          {(
            [
              ["chain", chainDisplayName(agent.chain)],
              ["agent id", agent.agent_id.toLocaleString("en-US")],
              ["token id", agent.token_id],
              [
                "owner",
                ownerHref ? (
                  <OutboundLink href={ownerHref}>{agent.owner}</OutboundLink>
                ) : (
                  agent.owner
                ),
              ],
              [
                "declared uri",
                uriLink ? (
                  <OutboundLink href={uriLink.href} untrusted>
                    {agent.agent_uri}
                  </OutboundLink>
                ) : (
                  agent.agent_uri || "—"
                ),
              ],
              [
                "seen at block",
                blockHref ? (
                  <OutboundLink href={blockHref}>
                    {agent.discovery_block.toLocaleString("en-US")}
                  </OutboundLink>
                ) : (
                  agent.discovery_block.toLocaleString("en-US")
                ),
              ],
              ["first seen", discovered],
            ] as [string, React.ReactNode][]
          ).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="label border-t border-line py-2 sm:pr-4">{k}</dt>
              <dd className="break-all border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 max-w-prose border-l-2 border-edge pl-5 text-sm leading-relaxed text-muted">
          These two values were read at one block and are not a census
          measurement. Census figures come from a sweep pinned to a block, and
          this agent is not in one yet — so it is counted in no rate, no
          finding and no archive.{" "}
          <Link
            href="/methodology"
            className="text-text underline decoration-line underline-offset-4 transition-colors hover:decoration-edge"
          >
            What the seven checks ask
          </Link>
          .
        </p>
      </section>
    </>
  );
}
