import type { AgentSummary } from "@/lib/api/schemas";

/**
 * The dot and its word. Both come from the API's `display` — this component
 * chooses only the colour, which is styling rather than a claim.
 */
export function StatusDot({ agent }: { agent: AgentSummary }) {
  return (
    <span title={agent.display.statement} className="whitespace-nowrap">
      <span className={agent.endpoint_alive ? "text-live" : "text-dead"}>●</span>{" "}
      {agent.display.status}
    </span>
  );
}
