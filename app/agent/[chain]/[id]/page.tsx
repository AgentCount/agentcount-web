import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RungLadder } from "@/components/RungLadder";
import { RungStrip } from "@/components/RungStrip";
import { RunProvenance } from "@/components/RunProvenance";
import { StatusLegend } from "@/components/StatusLegend";
import {
  getAgent,
  getRates,
  resolveRun,
  statusVocabulary,
} from "@/lib/api/endpoints";
import { pageTitle } from "@/lib/brand";

// The largest value axum's `Path<(String, i64)>` extractor will accept; a digit
// run beyond this cannot be an agent id, so it is a bad URL, not an upstream
// problem. `BigInt` is required for the comparison — `Number` loses precision
// at this magnitude and would let some out-of-range ids through.
const I64_MAX = BigInt("9223372036854775807");

/** A malformed id (non-digits, or out of `i64` range) can never resolve — treat
 * it as a 404 up front instead of sending it to the API, which would reject it
 * with a 400 that `getAgent` does not know how to turn into `null`, and the
 * reader would see "the API may be down" for a simple bad URL. */
function isValidAgentId(id: string): boolean {
  if (!/^\d+$/.test(id)) return false;
  try {
    return BigInt(id) <= I64_MAX;
  } catch {
    return false;
  }
}

type Params = { chain: string; id: string };

/**
 * ISR, not static generation and not `force-dynamic`.
 *
 * 60,097 agents cannot be built at deploy time — that is a 60,097-request
 * stampede against the API for pages nobody may ever open. An empty
 * `generateStaticParams` with `dynamicParams` left on means nothing is
 * prebuilt, every page renders on first request, and the result is cached and
 * revalidated. A build then needs no API at all, which is the same property
 * every other page here protects.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { chain, id } = await params;
  if (!isValidAgentId(id)) return { title: pageTitle("Agent not found") };

  // A real fetch, not a title derived from the route: the one page worth
  // sharing a link to should say the agent's actual name in the tab, the
  // search result, and the link preview. `null` for a document that never
  // resolved falls back to the id, exactly as the directory does.
  const agent = await getAgent(chain, id);
  const name = agent?.name ?? `Agent #${id}`;
  const description = agent?.description
    ? agent.description.slice(0, 200)
    : `ERC-8004 conformance record for agent ${id} on ${chain}: seven rungs, evidence attached, no score.`;

  return {
    title: `${name} · ${chain}`,
    description,
    openGraph: { title: `${name} · ${chain}`, description },
  };
}

export default async function AgentDetail({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ run?: string }>;
}) {
  const { chain, id } = await params;
  const { run: runParam } = await searchParams;
  if (!isValidAgentId(id)) notFound();

  const agent = await getAgent(chain, id, runParam);
  if (!agent) notFound();

  const [run, rates] = await Promise.all([
    resolveRun(agent.run_id),
    getRates(agent.run_id),
  ]);
  const { snapshot, archive } = agent;

  return (
    <>
      <div className="max-w-5xl">
        {/* Identity is the document's own name, falling back to the id — never
            the URI, which is frequently a multi-kilobyte base64 blob or an
            empty string and makes an unreadable headline. */}
        <h1 className="text-2xl font-bold">
          {agent.name ?? <span className="text-muted">Agent #{agent.agent_id}</span>}
        </h1>
        <p className="mt-1 font-mono text-sm text-muted">
          {agent.chain} · id {agent.agent_id} · owner {snapshot.owner}
        </p>
        {agent.description && (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
            {agent.description}
          </p>
        )}

        <div className="mt-4">
          <RungStrip rungs={agent.rungs} size="md" />
        </div>
        <div className="mt-4">
          <StatusLegend statuses={statusVocabulary(rates)} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label="The seven rungs">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            The seven rungs, with their evidence
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
            Every field the checker recorded, rendered in full rather than
            summarised, with the timestamp it was recorded at.
          </p>
          <div className="mt-3">
            <RungLadder rungs={agent.rungs} />
          </div>
        </section>

        <div className="space-y-8">
          <section aria-label="On-chain snapshot">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              On-chain snapshot
            </h2>
            <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 rounded-lg border border-line bg-panel/60 px-4 py-3 text-sm">
              <dt className="text-muted">token id</dt>
              <dd className="font-mono text-xs">{snapshot.token_id}</dd>
              <dt className="text-muted">owner</dt>
              <dd className="break-all font-mono text-xs">{snapshot.owner}</dd>
              <dt className="text-muted">block</dt>
              <dd className="font-mono text-xs tabular-nums">
                {snapshot.block_number.toLocaleString("en-US")}
              </dd>
              <dt className="text-muted">observed at</dt>
              <dd className="font-mono text-xs">{snapshot.observed_at}</dd>
            </dl>
            <p className="mt-3 text-sm text-muted">tokenURI</p>
            <div className="mt-1 max-h-40 overflow-auto break-all rounded-lg border border-line bg-panel/60 px-3 py-2 font-mono text-xs text-muted">
              {snapshot.agent_uri || <span className="italic">(empty)</span>}
            </div>
          </section>

          <section aria-label="HTTP archive">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              What the fetch saw
            </h2>
            {archive === null ? (
              <p className="mt-3 rounded-lg border border-line bg-panel/60 px-4 py-3 text-sm text-muted">
                No archive row exists for this agent in this run.
              </p>
            ) : (
              <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 rounded-lg border border-line bg-panel/60 px-4 py-3 text-sm">
                <dt className="text-muted">scheme</dt>
                <dd className="font-mono text-xs">{archive.scheme}</dd>
                <dt className="text-muted">request URL</dt>
                <dd className="break-all font-mono text-xs">
                  {archive.request_url ?? "—"}
                </dd>
                <dt className="text-muted">final URL</dt>
                <dd className="break-all font-mono text-xs">
                  {archive.final_url ?? "—"}
                </dd>
                <dt className="text-muted">HTTP status</dt>
                <dd className="font-mono text-xs">{archive.http_status ?? "—"}</dd>
                <dt className="text-muted">content type</dt>
                <dd className="break-all font-mono text-xs">
                  {archive.content_type ?? "—"}
                </dd>
                <dt className="text-muted">size</dt>
                <dd className="font-mono text-xs tabular-nums">
                  {archive.body_bytes !== null
                    ? `${archive.body_bytes.toLocaleString("en-US")} bytes`
                    : "—"}
                  {archive.truncated ? " (truncated)" : ""}
                </dd>
                <dt className="text-muted">sha256</dt>
                <dd className="break-all font-mono text-xs">
                  {archive.body_sha256 ?? "—"}
                </dd>
                <dt className="text-muted">elapsed</dt>
                <dd className="font-mono text-xs tabular-nums">
                  {archive.elapsed_ms !== null
                    ? `${archive.elapsed_ms.toLocaleString("en-US")} ms`
                    : "—"}
                </dd>
                {archive.error && (
                  <>
                    <dt className="text-muted">error</dt>
                    <dd className="break-all font-mono text-xs">{archive.error}</dd>
                  </>
                )}
              </dl>
            )}
          </section>

          <section aria-label="Run provenance">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              This run
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Every status above is scoped to this sweep, at this block. Rerun
              it and you should get these answers back.
            </p>
            <div className="mt-3 rounded-lg border border-line bg-panel/60 px-4 py-3">
              <RunProvenance run={run} />
            </div>
            <p className="mt-3 text-sm">
              <Link href="/methodology" className="text-accent hover:underline">
                What each rung measures →
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
