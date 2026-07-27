import { notFound } from "next/navigation";
import { FactList } from "@/components/FactList";
import { FlagList } from "@/components/FlagList";
import { StatusDot } from "@/components/StatusDot";
import { getAgent } from "@/lib/api/endpoints";

export default async function AgentDetail({
  params,
}: {
  params: Promise<{ chain: string; id: string }>;
}) {
  const { chain, id } = await params;
  const agent = await getAgent(chain, id);
  if (!agent) notFound();

  const { summary } = agent;
  return (
    <>
      <h1 className="break-all text-2xl font-bold">{summary.domain}</h1>
      <p className="mt-1 break-all text-muted">
        Agent #{summary.agent_id} on {summary.chain} · {summary.address}
      </p>
      <p className="mt-1">
        <StatusDot agent={summary} />
      </p>

      <FactList facts={agent.facts} />
      <FlagList flags={agent.flags} />
    </>
  );
}
