import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RungLadder } from "@/components/RungLadder";
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
  return { title: `Agent #${id} · ${chain} — Ledgerscope` };
}

export const dynamic = "force-dynamic";

export default async function AgentDetail({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ run?: string }>;
}) {
  const { chain, id } = await params;
  const { run } = await searchParams;
  if (!isValidAgentId(id)) notFound();

  const agent = await getAgent(chain, id, run);
  if (!agent) notFound();

  const { snapshot } = agent;

  return (
    <>
      {/* Identity is agent id · chain · owner — never the URI, which is
          frequently a multi-kilobyte base64 blob or an empty string and
          makes an unreadable headline. */}
      <h1 className="text-2xl font-bold">
        Agent #{agent.agent_id} · {agent.chain} · {snapshot.owner.slice(0, 10)}…
      </h1>

      <section className="mt-4 rounded-xl bg-panel p-5">
        <h2 className="text-lg font-semibold">Snapshot</h2>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted">token id</dt>
          <dd>{snapshot.token_id}</dd>
          <dt className="text-muted">owner</dt>
          <dd className="break-all">{snapshot.owner}</dd>
          <dt className="text-muted">block</dt>
          <dd>{snapshot.block_number.toLocaleString("en-US")}</dd>
          <dt className="text-muted">observed</dt>
          <dd>{snapshot.observed_at}</dd>
        </dl>
        <p className="mt-3 text-sm text-muted">agent URI</p>
        <div className="mt-1 max-h-32 overflow-auto break-all rounded-lg bg-bg p-3 text-sm text-muted">
          {snapshot.agent_uri || <span className="italic">(empty)</span>}
        </div>
      </section>

      <RungLadder rungs={agent.rungs} />

      <section className="mt-6 rounded-xl bg-panel p-5">
        <h2 className="text-lg font-semibold">Archive</h2>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted">scheme</dt>
          <dd>{agent.archive.scheme}</dd>
          <dt className="text-muted">final URL</dt>
          <dd className="break-all">{agent.archive.final_url ?? "—"}</dd>
          <dt className="text-muted">HTTP status</dt>
          <dd>{agent.archive.http_status ?? "—"}</dd>
          <dt className="text-muted">content type</dt>
          <dd>{agent.archive.content_type ?? "—"}</dd>
          <dt className="text-muted">size</dt>
          <dd>
            {agent.archive.body_bytes !== null
              ? `${agent.archive.body_bytes.toLocaleString("en-US")} bytes`
              : "—"}
            {agent.archive.truncated ? " (truncated)" : ""}
          </dd>
          <dt className="text-muted">sha256</dt>
          <dd className="break-all">{agent.archive.body_sha256 ?? "—"}</dd>
          <dt className="text-muted">elapsed</dt>
          <dd>{agent.archive.elapsed_ms.toLocaleString("en-US")} ms</dd>
          {agent.archive.error && (
            <>
              <dt className="text-muted">error</dt>
              <dd className="break-all">{agent.archive.error}</dd>
            </>
          )}
        </dl>
      </section>

      <p className="mt-6 text-sm text-dead">run {agent.run_id.slice(0, 8)}…</p>
    </>
  );
}
