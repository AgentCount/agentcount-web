import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "Who pays for this",
  description:
    "AgentCount accepts no payment from any entity it audits, sells no badges, certification or placement, and no payment can include, exclude, delay or alter a finding.",
};

/**
 * The neutrality statement.
 *
 * ## Why it is a page and not a footer line
 *
 * Every registry that rates anyone eventually gets asked who pays for it, and
 * the ones that answer late answer defensively. This project measures
 * platforms that could plausibly want a better number, publishes findings that
 * name them, and asks readers to trust that the findings were not for sale.
 * That is a claim, and a claim of this kind should be written down before
 * anyone has a reason to doubt it, at a URL that can be quoted back later.
 *
 * ## What it is careful not to say
 *
 * It does not promise there will never be revenue — a promise nobody should
 * make about a project's whole future, and one that would be quietly broken
 * rather than publicly revised. It states what any revenue may and may not
 * buy, which is the part that protects a reader.
 *
 * The prose is deliberately plain. A statement about integrity written in
 * legal register reads as something drafted to be defensible rather than
 * something meant.
 */
export default function NeutralityPage() {
  return (
    <>
      <header className="border-b border-edge pb-6">
        <h1 className="numeral max-w-[20ch] text-[clamp(1.75rem,3.4vw,2.75rem)] text-text">
          Who pays for this
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          {BRAND.name} publishes findings that name platforms and count what
          they did. Anyone reading those findings is entitled to know whether
          the people they name paid for them. This page is the answer, written
          before anyone had a reason to ask.
        </p>
      </header>

      <div className="mt-12 max-w-prose space-y-8 text-[0.9375rem] leading-relaxed text-muted">
        <section>
          <h2 className="label text-text">Nobody we audit pays us</h2>
          <p className="mt-3">
            We accept no payment, in any form, from any entity that appears in
            the census. Not from agent operators, not from the platforms that
            mint them in batches, not from registries, not from the chains
            themselves, not from anyone acting for them. Every agent on this
            site was checked without their knowledge or consent, at a block
            pinned in advance, using the same seven questions asked of everyone
            else.
          </p>
        </section>

        <section>
          <h2 className="label text-text">There is nothing to buy</h2>
          <p className="mt-3">
            We sell no badges, no certification, no verified status, no
            placement, no priority, and no listing. There is no paid tier of
            this register and no way to appear higher in it. The directory is
            ordered by agent id, the census by population, and neither has a
            slot that money can reach.
          </p>
          <p className="mt-4">
            This matters more than it might sound. A conformance register that
            sells a badge has made its findings into a product its subjects buy,
            and every number it publishes afterwards is marketing for that
            product. We would rather have no revenue than that one.
          </p>
        </section>

        <section>
          <h2 className="label text-text">No payment can change a finding</h2>
          <p className="mt-3">
            No payment from anyone, for anything, can cause a finding to be
            included, excluded, delayed, softened or reworded. That applies to
            money we have already accepted and to money we might be offered
            later. A finding is corrected when it is wrong, and for no other
            reason — and every correction this project has made to itself is
            published, including the ones nobody else would have caught.
          </p>
        </section>

        <section>
          <h2 className="label text-text">If there are ever sponsors</h2>
          <p className="mt-3">
            There are none today. If there ever are, they will be named on this
            page, and the rule above will still hold: a sponsor buys no
            influence over what is measured, what is published, or when. A
            sponsor who is also in the census is disclosed as both, in the
            report that names them. Nothing about the checks changes because
            somebody funded the electricity.
          </p>
        </section>

        <section>
          <h2 className="label text-text">
            We run no launchpad, and we mint nothing
          </h2>
          <p className="mt-3">
            We do not operate an agent platform, a launchpad, a minting service,
            an attestation service or a hosting service. We are not in the
            business we are counting. If we ever register an agent of our own —
            a probe identity, most likely — it will be flagged as ours in the
            dataset and excluded from any rate we publish, and this page will
            say so before the first sweep that contains it.
          </p>
        </section>

        <section>
          <h2 className="label text-text">What we are not</h2>
          <p className="mt-3">
            {BRAND.name} is a conformance census, not a rating agency. We do not
            score, rank, or aggregate agents into a judgment. Seven checks, each
            a separate question, each carrying the evidence that answered it. A
            reader who disagrees with a check can see exactly what it was given
            and reach their own conclusion, which is the only kind of
            independence that survives being checked.
          </p>
        </section>
      </div>

      <p className="mt-14 flex max-w-prose flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.1em]">
        <Link
          href="/methodology"
          className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
        >
          What each check measures →
        </Link>
        <Link
          href="/reports"
          className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
        >
          The reports →
        </Link>
        <a
          href={`mailto:${BRAND.contactEmail}`}
          className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
        >
          {BRAND.contactEmail} →
        </a>
      </p>
    </>
  );
}
