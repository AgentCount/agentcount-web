import { TextLink } from "@/components/TextLink";
import { getMethodology, getRates, resolveRun, statusVocabulary } from "@/lib/api/endpoints";
import { PreflightForm } from "./PreflightForm";

export const metadata = {
  title: "Check a document before you mint",
  description:
    "Paste an ERC-8004 registration file and see what the conformance checker says about it — before it goes on-chain.",
};
export const dynamic = "force-dynamic";

/**
 * The pre-flight checker.
 *
 * The census measures agents after the fact. This is the one page that helps
 * before it: the same checker, pointed at a draft. Its value is in the census's
 * own findings — 48 agents from 48 unrelated owners all failed rung 4 the same
 * way because one hosting service's template omitted `agentRegistry`, and
 * every one of them would have been caught here.
 */
export default async function PreflightPage() {
  const run = await resolveRun();
  const [rates, methodology] = await Promise.all([
    getRates(run.run_id),
    getMethodology(),
  ]);

  const mustCount = methodology.rung4_must_requirements.length;

  return (
    <>
      <header className="border-b border-edge pb-6">
        <h1 className="headline max-w-[22ch] text-[clamp(1.75rem,3.4vw,2.75rem)] text-text">
          Check a registration file before you mint it
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          The same checker that judged every agent in the census, run against a
          document you paste. Nothing is stored and no run is written — this
          answers a question, it does not add you to anything.
        </p>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-xs text-dead">
          <span>
            spec <span className="text-muted">{methodology.spec_commit.slice(0, 12)}</span>
          </span>
          <span className="text-line">|</span>
          <span>
            checker <span className="text-muted">{methodology.checker_version}</span>
          </span>
          <span className="text-line">|</span>
          <span>
            {mustCount === 1
              ? "1 MUST requirement, conditional"
              : `${mustCount} MUST requirements`}
          </span>
        </p>
      </header>

      <PreflightForm statuses={statusVocabulary(rates)} />

      <section className="mt-16 max-w-prose border-l-2 border-edge pl-6">
        <h2 className="label">Why this exists</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          In the reference run, 48 agents belonging to 48 unrelated owners all
          failed check 4 (Follows the spec?) identically — one hosting service&rsquo;s template
          omitted <code className="font-mono text-text">agentRegistry</code>,
          and nobody found out until after minting. Separately, 10,101
          documents from 6,460 owners share one exact set of missing
          recommended fields, which reads as a widely-copied template rather
          than thousands of independent choices.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Passing here is not a guarantee about your agent — it is a statement
          about your document, at this spec pin, today.{" "}
          <TextLink href="/methodology" tone="inherit">
            What each check measures →
          </TextLink>
        </p>
      </section>
    </>
  );
}
