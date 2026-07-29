import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RungLadder } from "@/components/RungLadder";
import { RungStrip } from "@/components/RungStrip";
import { RunProvenance } from "@/components/RunProvenance";
import { Section } from "@/components/Section";
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
      {/* Identity is the document's own name, falling back to the id — never
          the URI, which is frequently a multi-kilobyte base64 blob or an empty
          string and makes an unreadable headline. */}
      <header className="border-b border-edge pb-6">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="min-w-0">
            <span className="label">Agent</span>
            <h1 className="numeral mt-2 max-w-[20ch] break-words text-[clamp(2rem,4vw,3rem)] text-text">
              {agent.name ?? (
                <span className="font-mono text-dead">Agent #{agent.agent_id}</span>
              )}
            </h1>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-xs text-dead">
              <span className="text-muted">{agent.chain}</span>
              <span className="text-line">|</span>
              <span>
                id <span className="text-muted">{agent.agent_id}</span>
              </span>
              <span className="text-line">|</span>
              <span className="break-all">
                owner <span className="text-muted">{snapshot.owner}</span>
              </span>
            </p>
          </div>

          {/* The strip is the headline here — the one thing someone following
              a shared link came to read. */}
          <div>
            <span className="label">Rungs 1–7</span>
            <div className="mt-2">
              <RungStrip rungs={agent.rungs} size="md" />
            </div>
          </div>
        </div>

        {agent.description && (
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted">
            {agent.description}
          </p>
        )}

        <div className="mt-6 max-w-5xl">
          <StatusLegend statuses={statusVocabulary(rates)} />
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-x-14 gap-y-16 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Section
          title="The seven rungs, with their evidence"
          aside={`${agent.rungs.length} recorded`}
          intro={
            <>
              Every field the checker recorded, rendered in full rather than
              summarised, with the timestamp it was recorded at.
            </>
          }
        >
          <RungLadder rungs={agent.rungs} />
        </Section>

        <div className="space-y-16">
          <Section title="On-chain snapshot" aside={agent.chain}>
            <dl className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr]">
              <dt className="label border-t border-line py-2 sm:pr-4">token id</dt>
              <dd className="border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {snapshot.token_id}
              </dd>
              <dt className="label border-t border-line py-2 sm:pr-4">owner</dt>
              <dd className="break-all border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {snapshot.owner}
              </dd>
              <dt className="label border-t border-line py-2 sm:pr-4">block</dt>
              <dd className="border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {snapshot.block_number.toLocaleString("en-US")}
              </dd>
              <dt className="label border-t border-line py-2 sm:pr-4">observed</dt>
              <dd className="border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {snapshot.observed_at}
              </dd>
            </dl>
            <div className="mt-4 border-t border-line pt-3">
              <span className="label">tokenURI</span>
              <div className="mt-2 max-h-40 overflow-auto break-all border-l-2 border-edge bg-panel px-3 py-2 font-mono text-xs text-muted">
                {snapshot.agent_uri || <span className="text-dead">(empty)</span>}
              </div>
            </div>
          </Section>

          <Section
            title="What the fetch saw"
            aside={archive?.scheme ?? "no archive"}
          >
            {archive === null ? (
              <p className="border-l-2 border-edge pl-4 text-sm text-muted">
                No archive row exists for this agent in this run.
              </p>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr]">
                {(
                  [
                    ["scheme", archive.scheme],
                    ["request url", archive.request_url ?? "—"],
                    ["final url", archive.final_url ?? "—"],
                    ["http status", archive.http_status?.toString() ?? "—"],
                    ["content type", archive.content_type ?? "—"],
                    [
                      "size",
                      archive.body_bytes !== null
                        ? `${archive.body_bytes.toLocaleString("en-US")} bytes${
                            archive.truncated ? " (truncated)" : ""
                          }`
                        : "—",
                    ],
                    ["sha256", archive.body_sha256 ?? "—"],
                    [
                      "elapsed",
                      archive.elapsed_ms !== null
                        ? `${archive.elapsed_ms.toLocaleString("en-US")} ms`
                        : "—",
                    ],
                    ...(archive.error ? [["error", archive.error] as const] : []),
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="label border-t border-line py-2 sm:pr-4">{label}</dt>
                    <dd className="break-all border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          <Section
            title="This run"
            aside="reproducible"
            intro={
              <>
                Every status above is scoped to this sweep, at this block.
                Rerun it and you should get these answers back.
              </>
            }
          >
            <RunProvenance run={run} />
            <p className="mt-6">
              <Link
                href="/methodology"
                className="font-mono text-xs uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
              >
                What each rung measures →
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
