import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RungLadder } from "@/components/RungLadder";
import { RungStrip } from "@/components/RungStrip";
import { RunProvenance } from "@/components/RunProvenance";
import { Section } from "@/components/Section";
import { OutboundLink } from "@/components/OutboundLink";
import { UncheckedAgent } from "@/components/UncheckedAgent";
import { StatusLegend } from "@/components/StatusLegend";
import {
  getAgent,
  getRates,
  resolveRun,
  statusVocabulary,
} from "@/lib/api/endpoints";
import { isTailAgent, type RungDetail } from "@/lib/api/schemas";
import { pageTitle } from "@/lib/brand";
import { addressUrl, blockUrl, explorerFor, resourceLink, tokenUrl } from "@/lib/links";

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
 * Rendered on demand, with the CACHING DONE AT THE FETCH LAYER rather than at
 * the page layer.
 *
 * This page previously declared `revalidate = 300` alongside an empty
 * `generateStaticParams`, reasoning that 60,097 agents cannot be built at
 * deploy time and that nothing prebuilt plus a revalidating cache gets the
 * same result for free. The reasoning about build time is right. The mechanism
 * was not, and it took the whole route down in production:
 *
 * declaring `generateStaticParams` opts a route into STATIC generation, and a
 * statically generated page may not read request-time input. This one reads
 * `searchParams` for `?run=`. Next therefore throws `DYNAMIC_SERVER_USAGE` on
 * every render, which is a 500 on every agent permalink — the one page worth
 * sharing a link to.
 *
 * It has to be found in production, which is the trap: `next dev` renders
 * every route dynamically, so the page is perfect locally. `next build`
 * SUCCEEDS too, because nothing is prerendered for it to fail on — the error
 * only exists at request time. A green CI and a working dev server were both
 * telling the truth about the things they check.
 *
 * So the page is dynamic, and `next: { revalidate }` in `lib/api/client.ts`
 * keeps the API load bounded instead: concurrent readers of the same agent
 * share one upstream response, which is the property that was actually being
 * protected. A build still needs no API at all.
 *
 * If page-level caching is ever wanted back, `?run=` has to stop being a query
 * parameter first — the two cannot coexist.
 */
export const dynamic = "force-dynamic";

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
  const found = await getAgent(chain, id);
  // A tail agent has never had its document read, so it has neither name nor
  // description — the id fallback is the honest title.
  const agent = found && !isTailAgent(found) ? found : null;
  const name = agent?.name ?? `Agent #${id}`;
  const description = agent?.description
    ? agent.description.slice(0, 200)
    : `ERC-8004 conformance record for agent ${id} on ${chain}: seven checks, evidence attached, no score.`;

  return {
    title: `${name} · ${chain}`,
    description,
    openGraph: { title: `${name} · ${chain}`, description },
  };
}

/**
 * One line of evidence per check, for the badge popovers.
 *
 * Deliberately a SUMMARY, not the evidence table: the popover has room for one
 * fact, and the full record is already on the same page under each check. The
 * key is chosen per check because what matters differs — a fetch is about the
 * URL and its status, a parse about what broke, a conformance check about
 * which field was missing.
 *
 * Values are printed as the API sent them, truncated only for width. Nothing
 * here is computed or reworded.
 */
function makeKeyEvidence(rungs: RungDetail[]) {
  const byRung = new Map(rungs.map((r) => [r.rung, r]));
  // Ordered by how much each key tells a reader who is hovering.
  const PREFERRED = [
    "reason",
    "http_status",
    "fields_missing",
    "final_url",
    "request_url",
    "registry",
    "feedback_count",
  ];
  return (n: number): string | null => {
    const evidence = byRung.get(n)?.evidence;
    if (!evidence) return null;
    for (const key of PREFERRED) {
      const value = evidence[key];
      if (value === undefined || value === null) continue;
      const text = Array.isArray(value) ? value.join(", ") : String(value);
      if (text.length === 0 || text === "[]") continue;
      const short = text.length > 90 ? `${text.slice(0, 90)}...` : text;
      return `${key}: ${short}`;
    }
    return null;
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

  const found = await getAgent(chain, id, runParam);
  if (!found) notFound();

  // Registered, but no census run has swept it yet. This page cannot show
  // seven answers because none have been asked, and showing the census
  // furniture with blanks in it would read as seven failures. It gets its
  // own panel instead.
  if (isTailAgent(found)) {
    return <UncheckedAgent agent={found} />;
  }
  const agent = found;

  const [run, rates] = await Promise.all([
    resolveRun(agent.run_id),
    getRates(agent.run_id),
  ]);
  const { snapshot, archive } = agent;

  // Outbound targets. Every one of these is `null` when the chain has no
  // explorer configured or the value is not what it claims to be, and the
  // field then renders as plain text — see `lib/links.ts`.
  const explorer = explorerFor(agent.chain);
  const ownerHref = addressUrl(agent.chain, snapshot.owner);
  const blockHref = blockUrl(agent.chain, snapshot.block_number);
  // The registry is on rung 1's evidence, which is where the chain records it.
  const registry = agent.rungs.find((r) => r.rung === 1)?.evidence?.registry;
  const keyEvidence = makeKeyEvidence(agent.rungs);
  const tokenHref =
    typeof registry === "string"
      ? tokenUrl(agent.chain, registry, snapshot.token_id)
      : null;
  const uriLink = resourceLink(snapshot.agent_uri);

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
                owner{" "}
                {ownerHref ? (
                  <OutboundLink href={ownerHref} className="text-muted" title={`View on ${explorer?.name}`}>
                    {snapshot.owner}
                  </OutboundLink>
                ) : (
                  <span className="text-muted">{snapshot.owner}</span>
                )}
              </span>
            </p>
          </div>

          {/* The strip is the headline here — the one thing someone following
              a shared link came to read. */}
          <div>
            <span className="label">Checks 1–7</span>
            <div className="mt-2">
              <RungStrip
                rungs={agent.rungs}
                size="md"
                // The agent page is the one place a badge can show WHY, so its
                // popover carries the check's most telling evidence line —
                // the fetched URL, the HTTP status, the missing field.
                evidenceFor={keyEvidence}
              />
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
          title="The seven checks, with their evidence"
          aside={`${agent.rungs.length} recorded`}
          intro={
            <>
              Every field the checker recorded, rendered in full rather than
              summarised, with the timestamp it was recorded at.
            </>
          }
        >
          <RungLadder rungs={agent.rungs} chain={agent.chain} />
        </Section>

        <div className="space-y-16">
          <Section title="On-chain snapshot" aside={agent.chain}>
            <dl className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr]">
              <dt className="label border-t border-line py-2 sm:pr-4">token id</dt>
              <dd className="border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {tokenHref ? (
                  <OutboundLink href={tokenHref} title={`View the token on ${explorer?.name}`}>
                    {snapshot.token_id}
                  </OutboundLink>
                ) : (
                  snapshot.token_id
                )}
              </dd>
              <dt className="label border-t border-line py-2 sm:pr-4">owner</dt>
              <dd className="break-all border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {ownerHref ? (
                  <OutboundLink href={ownerHref} title={`View on ${explorer?.name}`}>
                    {snapshot.owner}
                  </OutboundLink>
                ) : (
                  snapshot.owner
                )}
              </dd>
              <dt className="label border-t border-line py-2 sm:pr-4">block</dt>
              <dd className="border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {blockHref ? (
                  <OutboundLink href={blockHref} title={`View block on ${explorer?.name}`}>
                    {snapshot.block_number.toLocaleString("en-US")}
                  </OutboundLink>
                ) : (
                  snapshot.block_number.toLocaleString("en-US")
                )}
              </dd>
              <dt className="label border-t border-line py-2 sm:pr-4">observed</dt>
              <dd className="border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                {snapshot.observed_at}
              </dd>
            </dl>
            <div className="mt-4 border-t border-line pt-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="label">tokenURI</span>
                {/* A `data:` URI is the document, inline — there is nowhere to
                    open, and `lib/links.ts` refuses to make an href of it. */}
                {uriLink && (
                  <OutboundLink
                    href={uriLink.href}
                    untrusted
                    className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-dead"
                  >
                    open{uriLink.via ? ` via ${uriLink.via}` : ""} →
                  </OutboundLink>
                )}
              </div>
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
                ).map(([label, value]) => {
                  // Only the two URL rows are linkable, and only when the
                  // scheme passes the allowlist — these came from a document a
                  // stranger registered, so they are `untrusted`.
                  const link =
                    label === "request url" || label === "final url"
                      ? resourceLink(value)
                      : null;
                  return (
                    <div key={label} className="contents">
                      <dt className="label border-t border-line py-2 sm:pr-4">{label}</dt>
                      <dd className="break-all border-line pb-2 font-mono text-xs text-muted sm:border-t sm:py-2">
                        {link ? (
                          <OutboundLink href={link.href} untrusted>
                            {value}
                          </OutboundLink>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  );
                })}
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
                What each check measures →
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
