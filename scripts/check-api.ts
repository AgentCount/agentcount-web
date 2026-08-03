/**
 * The contract test between this repo and the Rust API. Run it after any
 * change to `crates/api`: it fetches every endpoint from a LIVE API and
 * validates each response through the schema this app will use.
 */
import { isTailAgent } from "@/lib/api/schemas";
import {
  getAgent,
  getFindings,
  getMethodology,
  getRates,
  listAgents,
  listRuns,
  pingApi,
  rungVocabulary,
  serialiseFacets,
} from "../lib/api/endpoints";

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
    if (isTailAgent(detail)) {
      throw new Error("a run-scoped lookup returned a tail agent — the API is mixing the two");
    }
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
    const rungCount = d && !isTailAgent(d) ? d.rungs.length : 0;
    console.log(
      `✓ short-circuited agent ${shortCircuited.chain}/${shortCircuited.agent_id} — ` +
        `${rungCount} of 7 rungs have a row`,
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

  // The rung/status vocabulary a facet may use comes from the run's own rates,
  // so this exercises exactly the values the directory's filter can produce.
  const rungs = rungVocabulary(rates);
  const facets = rungs.map((rung) => ({ rung, status: "pass" }));
  const working = await listAgents({ run: completed.run_id, facets, limit: 1 });
  if (working.page.total > page.page.total) {
    throw new Error(
      `facet filter widened the result set: ${working.page.total} > ${page.page.total}`,
    );
  }
  console.log(
    `✓ /api/agents?facet=${serialiseFacets(facets)} — ${working.page.total} agents pass every implemented rung`,
  );

  // A facet the API must reject. `listAgents` cannot send this (the vocabulary
  // is drawn from rates), so it is built by hand to prove the API validates
  // rather than silently matching nothing.
  const bad = await fetch(
    `${process.env.AGENTCOUNT_API_URL?.replace(/\/$/, "")}/api/agents?facet=2:banana`,
  );
  if (bad.status !== 400) {
    throw new Error(`an invalid facet status returned ${bad.status}, expected 400`);
  }
  console.log("✓ /api/agents?facet=2:banana — 400, not a silent empty page");

  const named = await listAgents({ run: completed.run_id, limit: 50 });
  const withName = named.items.filter((a) => a.name !== null).length;
  if (withName === 0) {
    throw new Error("no agent in a 50-row page carried a name — is migration 0012 applied?");
  }
  console.log(`✓ /api/agents — ${withName} of ${named.items.length} rows carry a name`);

  const search = await listAgents({ run: completed.run_id, q: "agent", limit: 1 });
  console.log(`✓ /api/agents?q=agent — ${search.page.total} matches`);

  const f = await getFindings(completed.run_id);
  if (f.findings.length === 0) throw new Error("findings returned nothing");
  for (const x of f.findings) {
    if (x.denominator > 0 && x.percent === null) {
      throw new Error(`finding '${x.key}' has a denominator but no percent`);
    }
  }
  console.log(
    `✓ /api/runs/${completed.run_id}/findings — ${f.findings
      .map((x) => `${x.key} ${x.percent === null ? "—" : `${x.percent.toFixed(1)}%`}`)
      .join(", ")}`,
  );

  const m = await getMethodology();
  console.log(
    `✓ /api/methodology — spec ${m.spec_commit.slice(0, 8)}, ` +
      `${m.rung4_must_requirements.length} MUST requirement(s), ` +
      `${m.rung4_must_fields.length} MUST field(s), ` +
      `${m.rung4_should_fields.length} SHOULD, ${m.rung4_may_fields.length} MAY`,
  );
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
