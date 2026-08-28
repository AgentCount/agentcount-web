import { Section } from "@/components/Section";
import { StatusTag } from "@/components/StatusTag";
import { TextLink } from "@/components/TextLink";
import { latestSellerCensus } from "@/lib/api/endpoints";
import type { SellerRungRate } from "@/lib/api/schemas";
import { BRAND } from "@/lib/brand";
import { INSTRUMENTS } from "@/lib/instruments";
import { SELLER_CHECKS } from "@/lib/seller-checks";

export const metadata = {
  title: "The Seller Census",
  description:
    "The second instrument: who actually sells over x402. Every seller the catalogs advertise, asked whether it answers, quotes a real price, and has ever been paid.",
};

// Live data, so a restarting API must not fail the whole deploy.
export const dynamic = "force-dynamic";

/**
 * Instrument 02's home.
 *
 * ## The rule this page is written around
 *
 * Every rate here has `pass + fail` as its denominator and nothing else,
 * because the API computes it that way (see `routes/sellers.rs`). The
 * statuses left out are not rounding: `refused` is an origin declining us,
 * `error` is ours, `unprobed` is a question this sweep chose not to ask, and
 * `skipped` is a prerequisite that did not pass. None of them is a seller
 * failing at anything, and each is printed beside the rate it was excluded
 * from rather than hidden in a methodology note.
 *
 * The page never divides. It formats what the API already computed — the
 * same discipline `lib/api/aggregate.ts` states for the registration census,
 * and the reason a rate cannot drift between the two surfaces that show it.
 *
 * ## Rung 4
 *
 * It has never run. It spends real money and waits on a funded wallet, so
 * `attempted: false` comes back from the API and this page prints "never
 * attempted" where a percentage would go. Nothing here may imply anything
 * was bought, delivered, or not delivered.
 */
export default async function Sellers() {
  const instrument = INSTRUMENTS.find((i) => i.index === 2);
  if (instrument === undefined) {
    throw new Error("instrument 02 is missing from lib/instruments.ts");
  }

  // `null` when the deployed API predates the seller endpoints, which is a
  // real state during the window between the two repos' deploys. The page
  // renders its method either way and simply omits the figures.
  const census = await latestSellerCensus();
  const byRung = new Map<number, SellerRungRate>(
    (census?.rates.rungs ?? []).map((r) => [r.rung, r]),
  );
  const sweptOn = census?.run.finished_at?.slice(0, 10);
  const num = (n: number) => n.toLocaleString("en-US");

  return (
    <>
      <header className="pt-8 pb-8">
        <p className="label">instrument 02 · {instrument.population}</p>
        <h1 className="mt-3 max-w-[20ch] headline text-[clamp(1.9rem,3.2vw,2.8rem)] text-text">
          Who actually <em className="italic text-accent">sells?</em>
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusTag status={census === null ? "in development" : "live"} />
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-dead">
            {census === null ? (
              <>method locked · figures not published</>
            ) : (
              <>
                {num(census.rates.seller_count)} sellers ·{" "}
                {num(census.rates.host_count)} hosts
                {sweptOn && <> · swept {sweptOn}</>}
              </>
            )}
          </span>
        </div>
        <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-muted">
          A registration says an agent exists. It says nothing about whether
          anybody is selling anything, or whether a single payment has ever
          been made.{" "}
          <strong className="font-semibold text-text">
            This instrument asks the sellers directly.
          </strong>{" "}
          x402 is the protocol an endpoint uses to answer &ldquo;this costs
          money, here is where to pay&rdquo;; the census enumerates the
          endpoints that advertise it and checks what happens when you ask.
        </p>
      </header>

      <hr className="full-bleed-rule mt-4" />
      <Section
        title="What counts as a seller"
        aside="the unit"
        className="mt-14"
        heading="display"
      >
        <div className="grid max-w-5xl gap-x-10 gap-y-4 text-[0.96875rem] leading-relaxed text-muted md:grid-cols-2">
          <p>
            One seller is one{" "}
            <strong className="font-semibold text-text">
              payment address behind one host
            </strong>
            . The same address behind two hosts is two sellers; one host
            quoting two addresses is two sellers. A seller that rotates its
            address becomes a new seller, deliberately — the rotation is
            information, and blending it away would hide it.
          </p>
          <p>
            Sellers are enumerated from named catalogs, because every catalog
            is partial and nobody publishes the union. Which catalogs are read
            is part of the method: adding or removing one changes the
            population and is a changelog event, never a quiet edit. So this
            measures the <em>advertised</em> economy, and says so.
          </p>
        </div>
      </Section>

      <hr className="full-bleed-rule mt-20" />
      <Section
        title="What gets asked"
        aside="not a strict ladder"
        className="mt-14"
        heading="display"
        intro={
          <>
            Seven rungs, each naming its own prerequisites rather than
            depending on the one below — unlike the registration census&rsquo;s{" "}
            <TextLink href="/methodology" tone="bright">
              seven checks
            </TextLink>
            . Two of them have never been asked of a real seller, and say so
            here rather than in a footnote.
          </>
        }
      >
        <div className="mt-8 grid grid-cols-1 gap-px bg-edge sm:grid-cols-2 xl:grid-cols-4">
          {SELLER_CHECKS.map((check) => (
            <div key={check.number} className="flex flex-col bg-bg p-5">
              <span className="label">
                {String(check.number).padStart(2, "0")}
              </span>
              <h3 className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-xl font-bold text-text">
                {check.internal.charAt(0).toUpperCase() + check.internal.slice(1)}
                {/* `StatusTag` carries the site's two-word vocabulary for
                    "is this live"; a rung has three states, and the third —
                    reserved — is not a development stage. So the state is
                    printed as its own word rather than forced through a
                    component that would have to lie about one of them. */}
                <span
                  className={`font-mono text-[0.6875rem] uppercase leading-none tracking-[0.14em] ${
                    check.state === "swept" ? "text-accent" : "text-dead"
                  }`}
                >
                  {check.state}
                </span>
              </h3>
              {check.question !== "—" && (
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-text">
                  {check.question}
                </p>
              )}
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {check.meaning}
              </p>
              {check.caveat !== undefined && (
                <p className="mt-3 text-[0.875rem] leading-relaxed text-dead">
                  {check.caveat}
                </p>
              )}
              {/* The measured result, when there is one.
                  `attempted === false` prints words, never a percentage: a
                  rung nobody asked has counts of zero, and "0%" here would
                  say every seller failed to deliver what it was paid for.
                  The excluded statuses are printed beside the rate they were
                  kept out of — a reader who sees "33.7%" is owed the 141
                  sellers the question never reached. */}
              {(() => {
                const measured = byRung.get(check.number);
                if (measured === undefined) return null;
                if (measured.attempted === false) {
                  return (
                    <p className="mt-4 border-t border-line pt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
                      never attempted — no rate
                    </p>
                  );
                }
                const excluded = measured.counts.filter(
                  (c) => c.status !== "pass" && c.status !== "fail",
                );
                return (
                  <div className="mt-4 border-t border-line pt-3">
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-dead">
                      {num(measured.passed)} of {num(measured.judged)} judged
                    </p>
                    <p className="headline mt-1 text-2xl text-text">
                      {measured.percent === null
                        ? "—"
                        : `${measured.percent.toFixed(1)}%`}
                    </p>
                    {excluded.length > 0 && (
                      <p className="mt-2 font-mono text-[0.6875rem] leading-relaxed text-dead">
                        excluded:{" "}
                        {excluded
                          .map((c) => `${num(c.count)} ${c.status}`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                );
              })()}
              <p className="mt-auto border-t border-line pt-2 font-mono text-[0.6875rem] text-dead">
                internal: {check.internal}
              </p>
            </div>
          ))}
          <div aria-hidden className="hidden bg-bg sm:block" />
        </div>
      </Section>

      <hr className="full-bleed-rule mt-20" />
      <Section
        title="What this will not measure"
        aside="stated in advance"
        className="mt-14"
        heading="display"
      >
        <div className="grid max-w-5xl gap-x-10 gap-y-4 text-[0.96875rem] leading-relaxed text-muted md:grid-cols-2">
          <p>
            Not measured, on purpose: revenue, dollar volume, uptime, latency,
            and the quality of anything delivered. No score, no rank, no badge.{" "}
            <strong className="font-semibold text-text">
              Nothing publishable is purchasable.
            </strong>
          </p>
          <p>
            Politeness is part of the method rather than a setting:{" "}
            <code className="font-mono text-[0.875rem] text-text">robots.txt</code>{" "}
            binds every request this instrument makes, including the payment
            handshake, with no carve-out for &ldquo;the protocol&rsquo;s
            designed use&rdquo;. A host that disallows us is recorded as
            having refused, and that is never counted as a failure of the
            seller.
          </p>
        </div>
      </Section>

      <hr className="full-bleed-rule mt-20" />
      {census === null ? (
        <Section
          title="Why there are no numbers here"
          aside="yet"
          className="mt-14"
          heading="display"
        >
          <div className="grid max-w-5xl gap-x-10 gap-y-4 text-[0.96875rem] leading-relaxed text-muted md:grid-cols-2">
            <p>
              The method is locked, and the first full sweep has run and is
              stored. What is not answering right now is the endpoint that
              serves it, so there is nothing here to recompute a number from.
            </p>
            <p>
              {BRAND.name} does not print a figure whose evidence a reader
              cannot pull — the same order every figure on this site went
              through, and the reason the{" "}
              <TextLink href="/methodology" tone="bright">
                method
              </TextLink>{" "}
              was published before the first seller was enumerated.
            </p>
          </div>
        </Section>
      ) : (
        <Section
          title="Provenance"
          aside="reproducible"
          className="mt-14"
          heading="display"
          intro={
            <>
              Every figure above comes from one sweep, named here in full. A
              result you cannot recompute is an opinion.
            </>
          }
        >
          <dl className="mt-6 max-w-3xl border-t border-line font-mono text-[0.8125rem]">
            {[
              ["run", census.run.run_id],
              ["catalogs read", census.run.catalogs.join(", ")],
              [
                "rungs attempted",
                census.run.rungs_attempted === null
                  ? "unrecorded"
                  : census.run.rungs_attempted.join(", "),
              ],
              ["settlement scanned on", census.run.network],
              ["checker", census.run.seller_checker_version],
              ["commit", census.run.checker_commit],
              ["started", census.run.started_at],
              ["finished", census.run.finished_at ?? "—"],
              [
                "advertised resources",
                `${num(census.rates.resource_count)} distinct URLs (${num(
                  census.rates.seller_resource_pairs,
                )} seller-resource pairs)`,
              ],
            ].map(([term, value]) => (
              <div
                key={term}
                className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-line py-2.5"
              >
                <dt className="text-muted">{term}</dt>
                <dd className="break-all text-text">{value}</dd>
              </div>
            ))}
          </dl>
          {/* Rung 4 is named here too, not only on its card. The provenance
              block is what a sceptical reader reads, and "rungs attempted"
              above is the checkable form of the claim that nothing on this
              page describes a purchase. */}
          <p className="mt-6 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
            Rung 4 is absent from the attempted list, and that is the whole
            claim: no purchase has ever been made, so no figure here describes
            anything bought or delivered.
          </p>
        </Section>
      )}
    </>
  );
}
