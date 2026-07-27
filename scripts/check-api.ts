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

// The Rust side clamps `limit` to 500, so that is the widest single page.
const LIST_SAMPLE = 500;
// How many 500-wide pages to scan looking for a flagged agent before giving
// up. The newest-registered agents are reliably unflagged (flags need a
// probe window to accumulate first), so a single page is not enough — but
// scanning is bounded so this script stays fast against a large database.
const MAX_FLAG_SEARCH_PAGES = 10;

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

  // A wider sample to find a flagged agent — the newest agent (what a
  // limit-3 list returns) reliably has flag_count: 0, so a small sample
  // would never exercise `flagSchema` against the live API at all.
  const sample = await listAgents({ limit: LIST_SAMPLE });
  const first = sample.items[0];
  if (!first) {
    console.log("SKIPPED — no agents indexed, nothing to check a detail against");
  } else {
    const detail = await getAgent(first.chain, String(first.agent_id));
    if (!detail) throw new Error("the agent just listed was not found");
    console.log(
      `✓ /api/agents/${first.chain}/${first.agent_id} — ${detail.facts.length} facts`,
    );

    // Page through the directory looking for a flagged agent — the first
    // page (newest registrations) is reliably clean, so a single list call
    // would never exercise `flagSchema` against a real flag.
    let flagged = sample.items.find((a) => a.flag_count > 0);
    for (
      let offset = LIST_SAMPLE;
      !flagged && offset < sample.page.total && offset < LIST_SAMPLE * MAX_FLAG_SEARCH_PAGES;
      offset += LIST_SAMPLE
    ) {
      const nextPage = await listAgents({ limit: LIST_SAMPLE, offset });
      flagged = nextPage.items.find((a) => a.flag_count > 0);
    }
    if (!flagged) {
      console.log(
        "SKIPPED — no flagged agent in the sample, flagSchema was not exercised against a real flag",
      );
    } else {
      const flaggedDetail = await getAgent(flagged.chain, String(flagged.agent_id));
      if (!flaggedDetail) throw new Error("the flagged agent just listed was not found");
      if (flaggedDetail.flags.length === 0) {
        throw new Error(
          `${flagged.chain}/${flagged.agent_id} had flag_count > 0 but no flags in its detail`,
        );
      }
      const label = flaggedDetail.flags[0].display.label;
      if (!label) {
        throw new Error("a flag's display.label was empty");
      }
      console.log(
        `✓ /api/agents/${flagged.chain}/${flagged.agent_id} — ${flaggedDetail.flags.length} flags, first label "${label}"`,
      );
    }
  }

  if ((await getAgent("base", "999999999")) !== null) {
    throw new Error("a missing agent did not produce a 404");
  }
  console.log("✓ a missing agent is null, not an error");

  const alive = await listAgents({ limit: 3, sort: "alive" });
  console.log(`✓ /api/agents?sort=alive — ${alive.items.length} of ${alive.page.total}`);

  const chains = await listChains();
  console.log(`✓ /api/chains — ${chains.length}`);

  if (chains.length === 0) {
    console.log("SKIPPED — no chains indexed, chain filter not exercised");
  } else {
    const chain = chains[0].chain;
    const byChain = await listAgents({ limit: 3, chain });
    console.log(
      `✓ /api/agents?chain=${chain} — ${byChain.items.length} of ${byChain.page.total}`,
    );
  }

  console.log(`✓ /api/stats — ${(await getStats()).total_agents} agents`);
  console.log(`✓ /api/methodology — ${(await getMethodology()).liveness_window_days}d window`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
