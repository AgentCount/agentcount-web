import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FactList } from "@/components/FactList";
import { FlagList } from "@/components/FlagList";
import { StatusDot } from "@/components/StatusDot";
import { getAgent } from "@/lib/api/endpoints";

// The largest value axum's `Path<(String, i64)>` extractor will accept; a
// digit run beyond this cannot be an agent id, so it is a bad URL, not an
// upstream problem. `BigInt` is required for the comparison — `Number` loses
// precision at this magnitude and would let some out-of-range ids through.
const I64_MAX = BigInt("9223372036854775807");

/** A malformed id (non-digits, or out of `i64` range) can never resolve —
 * treat it as a 404 up front instead of sending it to the API, which would
 * reject it with a 400 that `getAgent` does not know how to turn into `null`,
 * and the reader would see "the API may be down" for a simple bad URL. */
function isValidAgentId(id: string): boolean {
  if (!/^\d+$/.test(id)) return false;
  try {
    return BigInt(id) <= I64_MAX;
  } catch {
    return false;
  }
}

type Params = { chain: string; id: string };

// Derived from the route params only, never a re-fetch: the one page worth
// sharing a link to should have a real title.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { chain, id } = await params;
  return { title: `Agent #${id} on ${chain} — Ledgerscope` };
}

export default async function AgentDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { chain, id } = await params;
  if (!isValidAgentId(id)) notFound();

  const agent = await getAgent(chain, id);
  if (!agent) notFound();

  const { summary } = agent;
  return (
    <>
      <h1 className="text-2xl font-bold">
        Agent #{summary.agent_id} on {summary.chain}
      </h1>
      <div className="mt-3 max-h-32 overflow-auto break-all rounded-lg bg-panel p-3 text-sm text-muted">
        <p>{summary.address}</p>
        <p className="mt-1">{summary.domain}</p>
      </div>
      <p className="mt-3">
        <StatusDot agent={summary} />
      </p>

      <FactList facts={agent.facts} />
      <FlagList flags={agent.flags} />
    </>
  );
}
