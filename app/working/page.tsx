import Link from "next/link";
import { AgentDirectory, type DirectorySearchParams } from "../directory/AgentDirectory";

export const metadata = { title: "Agents that passed every check" };
// A build must not depend on the API being reachable.
export const dynamic = "force-dynamic";

/**
 * The agents that pass every rung this run actually ran.
 *
 * ## This is a filter, not a score
 *
 * Nothing here counts how many rungs an agent passed or ranks anyone. It asks
 * one yes/no question — "did every rung this run reported come back `pass` for
 * this agent?" — and lists the agents for which the answer is yes. No number is
 * attached to any agent on this page, and no "6 of 6" appears anywhere.
 *
 * ## Which rungs count
 *
 * The rung list comes from the run's own rates, never a literal. Rung 6
 * (`live`) is not implemented and produces no rows at all, so it is not in the
 * run's rates and cannot be required here — requiring it would return zero
 * agents forever and imply the question is being asked of anyone. When rung 6
 * ships, it joins this filter automatically, and this page will get stricter on
 * its own.
 */
export default async function WorkingPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  return (
    <AgentDirectory
      searchParams={await searchParams}
      basePath="/working"
      title="Agents that passed every check we run"
      lockedFacets={(validRungs) =>
        validRungs.map((rung) => ({ rung, status: "pass" }))
      }
      intro={
        <>
          Every rung this run actually asked came back <em>pass</em> for these
          agents: the document resolved, parsed, met the spec&rsquo;s one
          conditional requirement, named the agent it belongs to, and the agent
          carries on-chain feedback. Rung 6 (<em>live</em>) is not implemented
          yet, so it is not among the checks below and nobody is being credited
          for it.
        </>
      }
      footer={
        <>
          &ldquo;Passed every check&rdquo; is not a safety guarantee, and it is
          not a recommendation. The rungs measure conformance to a spec, not
          intent, quality, or whether the agent does anything useful.{" "}
          <Link href="/methodology" className="text-accent hover:underline">
            What each rung actually measures →
          </Link>
        </>
      }
    />
  );
}
