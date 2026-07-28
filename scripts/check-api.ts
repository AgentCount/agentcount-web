/**
 * The contract test between this repo and the Rust API. Run it after any
 * change to `crates/api`: it fetches every endpoint from a LIVE API and
 * validates each response through the schema this app will use.
 */
import { getAgent, getMethodology, getRates, listAgents, listRuns, pingApi } from "../lib/api/endpoints";

async function main() {
  if (!(await pingApi())) {
    console.error("API unreachable — start it with `cargo run -p api`");
    process.exit(1);
  }

  const runs = await listRuns();
  console.log(`✓ /api/runs — ${runs.length} runs`);
  const completed = runs.find((r) => r.finished_at !== null);
  if (!completed) {
    console.log("SKIPPED — no completed run yet, nothing else to check against");
    return;
  }
  console.log(`  latest completed: ${completed.run_id} (${completed.agent_count} agents)`);

  const rates = await getRates(completed.run_id);
  if (rates.rungs.length === 0) {
    throw new Error("rates returned zero rungs for a completed run");
  }
  console.log(`✓ /api/runs/${completed.run_id}/rates — ${rates.rungs.length} rungs`);

  const page = await listAgents({ run: completed.run_id, limit: 3 });
  console.log(`✓ /api/agents — ${page.items.length} of ${page.page.total}`);

  const empty = await listAgents({ run: completed.run_id, limit: 1, offset: 10_000_000 });
  if (empty.page.total !== page.page.total) {
    throw new Error(
      `total changed on an out-of-range page: ${page.page.total} → ${empty.page.total}`,
    );
  }
  console.log(`✓ /api/agents?offset=huge — total holds at ${empty.page.total}`);

  const first = page.items[0];
  if (!first) {
    console.log("SKIPPED — no agents indexed, nothing to check a detail against");
  } else {
    const detail = await getAgent(first.chain, String(first.agent_id), completed.run_id);
    if (!detail) throw new Error("the agent just listed was not found");
    console.log(
      `✓ /api/agents/${first.chain}/${first.agent_id} — ${detail.rungs.length} rungs, ` +
        `evidence keys on rung 1: ${Object.keys(detail.rungs[0]?.evidence ?? {}).length}`,
    );
  }

  // Find an agent whose pipeline short-circuited (fewer than 7 rungs in the
  // list view) to exercise the "not every rung has a row" path against a
  // real response, not just a fixture.
  const wide = await listAgents({ run: completed.run_id, limit: 200 });
  const shortCircuited = wide.items.find((a) => a.rungs.length < 7);
  if (shortCircuited) {
    const d = await getAgent(shortCircuited.chain, String(shortCircuited.agent_id), completed.run_id);
    console.log(
      `✓ short-circuited agent ${shortCircuited.chain}/${shortCircuited.agent_id} — ` +
        `${d?.rungs.length} of 7 rungs have a row`,
    );
  } else {
    console.log("SKIPPED — no short-circuited agent in the sample");
  }

  if ((await getAgent("base", "999999999", completed.run_id)) !== null) {
    throw new Error("a missing agent did not produce a 404");
  }
  console.log("✓ a missing agent is null, not an error");

  const byRung = await listAgents({ run: completed.run_id, rung: 4, status: "fail", limit: 1 });
  console.log(`✓ /api/agents?rung=4&status=fail — ${byRung.page.total} matches`);

  const m = await getMethodology();
  console.log(`✓ /api/methodology — spec ${m.spec_commit.slice(0, 8)}, ${m.rung4_required_fields.length} required fields`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
