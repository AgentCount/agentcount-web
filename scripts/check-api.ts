/**
 * The contract test between this repo and the Rust API. Run it after any
 * change to `crates/api`: it fetches every endpoint from a LIVE API and
 * validates each response through the schema this app will use.
 */
import {
  getAgent,
  getMethodology,
  getStats,
  listAgents,
  listChains,
  pingApi,
} from "../lib/api/endpoints";

async function main() {
  if (!(await pingApi())) {
    console.error("API unreachable — start it with `cargo run -p api`");
    process.exit(1);
  }

  const page = await listAgents({ limit: 3 });
  console.log(`✓ /api/agents — ${page.items.length} of ${page.page.total}`);

  const empty = await listAgents({ limit: 1, offset: 10_000_000 });
  if (empty.page.total !== page.page.total) {
    throw new Error(
      `total changed on an out-of-range page: ${page.page.total} → ${empty.page.total}`,
    );
  }
  console.log(`✓ /api/agents?offset=huge — total holds at ${empty.page.total}`);

  const first = page.items[0];
  const detail = await getAgent(first.chain, String(first.agent_id));
  if (!detail) throw new Error("the agent just listed was not found");
  console.log(`✓ /api/agents/${first.chain}/${first.agent_id} — ${detail.facts.length} facts`);

  if ((await getAgent("base", "999999999")) !== null) {
    throw new Error("a missing agent did not produce a 404");
  }
  console.log("✓ a missing agent is null, not an error");

  console.log(`✓ /api/chains — ${(await listChains()).length}`);
  console.log(`✓ /api/stats — ${(await getStats()).total_agents} agents`);
  console.log(`✓ /api/methodology — ${(await getMethodology()).liveness_window_days}d window`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
