import { MiniPanel } from "@/components/MiniPanel";
import { RoleGlossary } from "@/components/RoleGlossary";
import { getMethodology, getRates, listRuns, statusVocabulary } from "@/lib/api/endpoints";
import { isCompletedRun } from "@/lib/api/schemas";
import { BRAND } from "@/lib/brand";
import { formatChainList } from "@/lib/chains";
import { getPublishedRuns, sweptChains } from "@/lib/published-runs";
import { CHECKS } from "@/lib/checks";
import {
  NOT_CHECKED_GLYPH,
  NOT_CHECKED_LABEL,
  statusGlyph,
  statusInkClass,
  statusLabel,
} from "@/lib/status";

/** The closed set this app has styling for — used only when no run is
 * reachable, so the definitions list is never empty and no `StatusWord` link
 * lands on a missing anchor. */
const KNOWN_STATUSES = [
  "pass",
  "fail",
  "error",
  "skipped",
  "unclaimed",
  "unprobeable",
];

export const metadata = { title: "Methodology" };
// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy
// if the API happens to be restarting.
export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const m = await getMethodology();
  const chains = formatChainList(sweptChains(await getPublishedRuns()));

  /**
   * The status words to define, taken from a real run rather than typed here.
   *
   * If no run can be reached the definitions fall back to the words this app
   * has styling for — the page is prose about the method and must render
   * without the API, but a definitions list that silently omitted a status
   * would break every `StatusWord` link pointing at it.
   */
  const vocabulary = await listRuns()
    .then((runs) => runs.find(isCompletedRun))
    .then((run) => (run ? getRates(run.run_id) : null))
    .then((rates) => (rates ? statusVocabulary(rates) : KNOWN_STATUSES))
    .catch(() => KNOWN_STATUSES);

  return (
    <>
      {/* Two-column page-head, the same split `MiniPanel`'s own doc
          describes at its other call sites: intro left, the one figure a
          reader came for right — here, how many checks this page is about
          to define, next to the versions that pin what "checked" meant when
          this run was swept. Single column under `lg`. See `MiniPanel.tsx`. */}
      <header className="border-b border-edge pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-x-12">
        <div>
          <h1 className="headline text-[clamp(1.75rem,3.2vw,2.5rem)] text-text">What we measure</h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
            What each of the seven checks asks, in the same vocabulary the
            API, the checker and this page&rsquo;s own changelog use — so a
            claim never has two definitions to drift apart.
          </p>
        </div>
        <MiniPanel
          className="mt-6 lg:mt-0"
          label="Checks this census runs"
          count={CHECKS.length}
          foot={
            <>
              <span>checker {m.checker_version}</span>
              <span>schema v{m.schema_version}</span>
            </>
          }
        />
      </header>

      {/* Why the census exists, at the anchor the homepage links to. The
          homepage carries three sentences of this; the rest lives here,
          because a reader who followed "why this exists" has asked for the
          long version. */}
      <section id="why" className="mt-8 max-w-prose scroll-mt-8">
        <h2 className="label">Why this exists</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Hundreds of thousands of AI agents are registered on public
          blockchains under ERC-8004, and those registration counts get cited
          as evidence that an autonomous agent economy exists. Nobody was
          checking what stands behind the counts.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          {BRAND.name} reads every registered agent on the chains it sweeps at
          a pinned block and asks seven checkable questions: does the
          registration point at a document, does the document work, does the
          document say which agent it belongs to, does anyone attest to the
          agent. Every answer is published with the evidence to recompute it,
          and none of them is combined into a score.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          What the checks show so far: three-quarters of registration
          documents declare no way to reach an agent, and most reputation is
          written by a few automated clients. The registry is real. What it is
          being taken as proof of is not, and counting is the honest way to say
          so.
        </p>
      </section>

      {/* The summary block. Five bullets, before the long-form detail, for the
          reader who arrived from a shared agent link and wants to know what
          they are looking at without reading two thousand words first. Every
          claim here is restated in full below — this adds no new fact, it just
          arrives sooner. */}
      <section
        aria-label="In short"
        className="mt-8 max-w-prose border-l-2 border-edge pl-6"
      >
        <h2 className="label">In short</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Every agent registered under ERC-8004 on the chains this census
            sweeps ({chains}) gets the{" "}
            <strong>same seven checks</strong>, and every answer carries the
            evidence collected to reach it.
          </li>
          <li>
            <strong>Check 6 is not implemented.</strong> It reads as not
            checked for every agent, never as a failure — the question is not
            being asked of anyone yet.
          </li>
          <li>
            Checks measure <strong>conformance to a spec</strong>, not safety,
            intent or quality. Passing everything is not an endorsement, and
            failing is not proof of bad intent.
          </li>
        </ul>
      </section>

      {/* Who is who. Placed before the checks because every check's wording
          depends on which of these six parties it is talking about, and the
          identity-role audit found a published claim that turned on exactly
          that distinction. */}
      {/* What the retired /neutrality page said, compressed to the four
          commitments that are actually falsifiable. It sits here because a
          reader wondering who paid for a finding is already reading the
          method behind it. */}
      <section id="independence" className="mt-12 max-w-prose scroll-mt-8">
        <h2 className="label">Independence</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            <span className="text-text">Nobody in the census pays us.</span>{" "}
            No payment is accepted from any agent operator, platform, registry or
            chain that appears in these results. Every agent here was checked
            without its owner&rsquo;s knowledge, at a block pinned in advance.
          </li>
          <li>
            <span className="text-text">There is nothing to buy.</span> No
            badge, no certification, no placement, no listing. The directory is
            ordered by agent id and the census by population.
          </li>
          <li>
            <span className="text-text">No payment changes a finding.</span> A
            finding is corrected when it is wrong, and for no other reason.
            Every correction this project has made to itself is published in
            the methodology changelog.
          </li>
          <li>
            <span className="text-text">
              We run no launchpad and mint nothing.
            </span>{" "}
            If a probe identity is ever registered, it is flagged as ours in
            the dataset and excluded from every published rate.
          </li>
        </ul>
      </section>

      <section aria-label="Who is who" className="mt-14 max-w-4xl">
        <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-text">
          Who is who
        </h2>
        <div className="mt-4">
          <RoleGlossary />
        </div>
      </section>

      <p className="mt-6 max-w-prose leading-relaxed text-muted">
        {BRAND.name} is a conformance census, not a rating agency. Every agent
        registered under ERC-8004 on the chains this census sweeps (
        {chains}) gets the same seven yes/no/skip/error
        questions, called checks, and every answer carries the evidence the
        checker collected to reach it. There is deliberately no score, grade,
        tier, or ranking anywhere in this product. Reaching your own conclusion
        from the seven answers is the point.
      </p>

      <section className="mt-14 max-w-4xl">
        <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-text">The seven checks</h2>
        {/* One place names the machine vocabulary, and it is this table.
            The page used to teach `rung` and `check` in parallel throughout,
            which is two words for one thing on every paragraph. */}
        <p className="mt-3 max-w-prose text-muted">
          Each check has a short machine name. The API, the evidence keys and
          the downloaded archives call these{" "}
          <code className="font-mono text-sm text-text">rung</code> 1&ndash;7
          and use the names in the second column, so anyone re-deriving a
          figure from an archive meets those words rather than these.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <caption className="sr-only">
              How each check is named on this page and elsewhere on the site
            </caption>
            <thead>
              <tr>
                <th scope="col" className="label border-b border-line pb-2 pr-4">
                  check
                </th>
                <th scope="col" className="label border-b border-line pb-2 pr-4">
                  machine name
                </th>
                <th scope="col" className="label border-b border-line pb-2 pr-4">
                  shown as
                </th>
                <th scope="col" className="label border-b border-line pb-2">
                  what a pass establishes
                </th>
              </tr>
            </thead>
            <tbody>
              {/* `hover:bg-raised` row scan aid — same pattern as
                  `AgentTable.tsx` and the tables on `/data` and `/coverage`:
                  a four-column reference table benefits from "this is the
                  row under your cursor" as much as any other. */}
              {CHECKS.map((c) => (
                <tr key={c.number} className="transition-colors hover:bg-raised">
                  <td className="border-b border-line py-2 pr-4 font-mono text-xs text-muted">
                    {c.number}
                  </td>
                  <td className="border-b border-line py-2 pr-4 font-mono text-xs text-text">
                    {c.internal}
                  </td>
                  <td className="border-b border-line py-2 pr-4 text-sm text-text">
                    {c.question}
                  </td>
                  <td className="border-b border-line py-2 text-sm text-muted">
                    {c.meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-4">
          <div className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted">1 · registered</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">
              The agent id exists in the on-chain Identity Registry with an
              <code className="mx-1 font-mono text-text">agentURI</code>
              recorded against it.
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted">2 · resolvable</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">
              That URI can be fetched and returns a body — a strict 2xx over
              HTTP, or a successfully decoded <code className="font-mono text-text">data:</code> URI.
              An HTTP 402 does not count as resolving.
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted">3 · parseable</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">The fetched body parses as JSON.</dd>
          </div>
          <div className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted">4 · conformant</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">
              The parsed document contains every field the spec pinned below
              requires — see the exact list underneath.
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted">5 · bound</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">
              The document&rsquo;s own registration entry names the same agent
              id, registry, and chain that the on-chain lookup used to find
              it — the card and the registry entry agree about who this is.
              Since a registration entry is only recommended, not required
              (check 4), a document can pass conformance while making no
              binding claim at all — that case is neither a pass nor a fail;
              it renders as <em>unclaimed</em>. See &ldquo;What a status
              means&rdquo; below.
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted">6 · live</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">
              Whether the endpoints the card declares in{" "}
              <code className="font-mono text-text">services[]</code>{" "}
              actually respond. Not yet implemented — every agent currently shows no
              row for this check, rendered on this site as &ldquo;not
              checked&rdquo;, never as a guessed status.
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-x-8 border-t border-line py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-mono text-xs uppercase tracking-[0.1em] text-muted">7 · attested</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-muted sm:mt-0">
              Whether this agent has received at least one Reputation
              Registry feedback entry, from any client address at all.
              Runs for every agent that passes check 1 — it does not depend on
              whether the document itself ever resolved, parsed, conformed,
              or bound.{" "}
              <strong>
                This check does not, and cannot, check whether the feedback
                came from the agent&rsquo;s own owner or an approved operator
              </strong>
              . The pinned spec (line 217) bans both:{" "}
              <em>
                &ldquo;The feedback submitter MUST NOT be the agent owner or an
                approved operator for agentId.&rdquo;
              </em>{" "}
              That is a contract-level invariant — such feedback cannot be
              submitted in the first place — so there is nothing here for this
              check to detect. Verified against the deployed contract on
              2026-08-01, not assumed from the spec: the Reputation
              Registry&rsquo;s verified source (
              <code className="font-mono text-xs">giveFeedback</code> at{" "}
              <code className="font-mono text-xs">0x8004baa1…9b63</code>,
              Blockscout-verified on Base) reverts for the owner, any
              approved-for-all operator, and the per-token approved address,
              and an <code className="font-mono text-xs">eth_call</code>{" "}
              simulation from the owner of a live agent reverts with
              &ldquo;Self-feedback not allowed&rdquo;. One honest limit: the
              registry is an upgradeable proxy, so the invariant is as
              permanent as its current implementation — and it binds
              addresses, not people; an owner submitting from a second wallet
              is not detectable by anyone. Note the scope of what we read: the census reads{" "}
              <code className="font-mono text-text">ownerOf</code> only, and
              never ERC-721 approvals, so it could not identify an approved
              operator even if the ban did not exist. It answers only
              &ldquo;did anyone at all vouch for this agent&rdquo;, not
              &ldquo;was it independent&rdquo; — renamed from{" "}
              <code className="font-mono text-text">independent</code> on
              2026-07-29 for exactly that reason.
            </dd>
          </div>
        </dl>
      </section>

      {/* Check 4's three severity buckets. This section read
          `m.rung4_required_fields` until 2026-07-29 — a field the API stopped
          sending when check 4 was split by RFC 2119 severity — so every load of
          this page threw a ContractError and showed the error panel instead.
          Every list below is read from the API, never restated here. */}
      <section className="mt-14 max-w-4xl">
        <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-text">
          Check 4&rsquo;s fields, by severity
        </h2>
        <p className="mt-2 max-w-prose text-muted">
          The spec invokes RFC 2119, so MUST, SHOULD and MAY are three
          different promises and check 4 keeps them apart. Pinned against spec
          commit{" "}
          <code className="break-all font-mono text-xs text-text">{m.spec_commit}</code>
          , checker version {m.checker_version} (schema {m.schema_version}).
          ERC-8004 is a <span className="text-text">Draft</span>: the standard
          can still change, which is why every result pins the exact spec text
          it was judged against and the pin is re-checked for drift rather
          than assumed current.
        </p>

        <h3 className="mt-7 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          MUST — the only fields whose absence fails the check
        </h3>
        <p className="mt-1 max-w-prose text-sm text-muted">
          {m.rung4_must_requirements.length === 1 ? "One requirement" : `${m.rung4_must_requirements.length} requirements`}
          {m.rung4_must_requirements.every((r) => r.conditional) &&
            ", and conditional — a document carrying no registrations array has nothing it must do"}
          .
        </p>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="label border-b border-edge px-3 py-2 font-normal">
                Field
              </th>
              <th scope="col" className="label border-b border-edge px-3 py-2 font-normal">
                Condition
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Same `hover:bg-raised` row scan aid as the check-naming table
                above and the other reference tables site-wide. */}
            {m.rung4_must_fields.map((f) => (
              <tr key={f.field} className="transition-colors hover:bg-raised">
                <td className="border-b border-line px-3 py-2 font-mono text-xs text-text">
                  {f.field}
                </td>
                <td className="border-b border-line px-3 py-2 text-sm text-muted">
                  {f.condition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-8 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          SHOULD — recorded as a gap, never a failure
        </h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {m.rung4_should_fields.map((f) => (
            <li
              key={f}
              className="border border-line px-2 py-0.5 font-mono text-[0.6875rem] text-muted"
            >
              {f}
            </li>
          ))}
        </ul>

        <h3 className="mt-8 font-mono text-xs uppercase tracking-[0.12em] text-muted">MAY — purely informational</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {m.rung4_may_fields.map((f) => (
            <li
              key={f}
              className="border border-line px-2 py-0.5 font-mono text-[0.6875rem] text-muted"
            >
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 max-w-4xl">
        <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-text">What a status means</h2>
        <p className="mt-2 text-muted">
          Each check answers with one of a small fixed vocabulary, always in
          the checker&rsquo;s own words: <em>pass</em>, <em>fail</em>,{" "}
          <em>skipped</em> (a check this one depends on didn&rsquo;t pass, so
          this question could not be meaningfully asked — for example, an
          agent that fails check 2 cannot meaningfully be asked check 3;
          dependencies run within a check&rsquo;s own track, not across every
          check number in order — check 7 depends only on check 1, so a check-2
          failure never skips it), or{" "}
          <em>error</em> (the check itself could not complete — a timeout, a
          malformed response — which is a different claim from a clean
          fail). A check with no row at all was never reached this run, which
          this site renders as &ldquo;not checked&rdquo; — distinct from
          <em> skipped</em>, since &ldquo;not checked&rdquo; and &ldquo;we
          couldn&rsquo;t ask&rdquo; are different claims.
        </p>
        <p className="mt-2 text-muted">
          <strong>Check 5 alone</strong> can also answer <em>unclaimed</em>,
          added 2026-07-29: the document made no binding claim (no
          registration entry, or an empty one) for this check to check. That
          is neither a pass (nothing was verified) nor a fail (a
          merely-recommended field, not a broken one) — it is its own,
          honest word for &ldquo;there was nothing here to check&rdquo;. Any
          status word this site does not recognise renders with neutral
          styling and the verbatim text the API sent, never guessed at as one
          of the words above.
        </p>

        {/* The link targets.

            Every status word printed in prose anywhere on this site links
            here (see `components/StatusWord.tsx`). The list is built from the
            run's own vocabulary rather than a literal, so a status the
            checker starts producing tomorrow gets a definition and a working
            anchor the day it first appears — both ends of the link come from
            the API. */}
        <dl className="mt-6 border-t border-line">
          {vocabulary.map((s) => (
            <div key={s} id={`status-${s}`} className="border-b border-line py-3 scroll-mt-24">
              <dt className="flex items-baseline gap-2">
                <span aria-hidden="true" className={`font-mono text-xs ${statusInkClass(s)}`}>
                  {statusGlyph(s)}
                </span>
                <span className="font-mono text-sm text-text">{s}</span>
              </dt>
              <dd className="mt-1 text-sm text-muted">{statusLabel(s)}</dd>
            </div>
          ))}
          <div id="status-not-checked" className="border-b border-line py-3 scroll-mt-24">
            <dt className="flex items-baseline gap-2">
              <span aria-hidden="true" className="font-mono text-xs text-dead">
                {NOT_CHECKED_GLYPH}
              </span>
              <span className="font-mono text-sm text-text">not checked</span>
            </dt>
            <dd className="mt-1 text-sm text-muted">{NOT_CHECKED_LABEL}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-14 max-w-4xl">
        <h2 className="font-mono text-sm uppercase tracking-[0.12em] text-text">What this does not tell you</h2>
        <p className="mt-2 text-muted">
          A pass on every check is not a safety guarantee, and a fail is not
          proof of bad intent — the checks measure conformance to a spec, not
          intent or quality. Absence of an implemented check 6 today does not
          mean an agent&rsquo;s endpoints work; it means that question is not
          yet being asked of anyone. Every claim here is scoped to exactly
          what the evidence attached to it shows.
        </p>
      </section>
    </>
  );
}
