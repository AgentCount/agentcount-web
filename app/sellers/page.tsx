import { Section } from "@/components/Section";
import { StatusTag } from "@/components/StatusTag";
import { TextLink } from "@/components/TextLink";
import { BRAND } from "@/lib/brand";
import { INSTRUMENTS } from "@/lib/instruments";
import { SELLER_CHECKS } from "@/lib/seller-checks";

export const metadata = {
  title: "The Seller Census",
  description:
    "The second instrument: who actually sells over x402. What it asks, what it refuses to measure, and why no figures are published here yet.",
};

/**
 * Instrument 02's home, before it has any figures.
 *
 * The page exists ahead of the numbers on purpose. The homepage now names
 * two instruments, and a named instrument that links nowhere is worse than
 * one not named at all — a reader who clicks "Seller Census" and lands on a
 * 404 learns that this site talks about things it does not have. What the
 * page can honestly carry today is the method: what a seller IS here, what
 * gets asked, and the two rungs that have never run.
 *
 * What it must not carry is a single figure from the completed first sweep.
 * Those rows are in production and the numbers are good, but nothing serves
 * them yet: no API route reads the seller tables, so any count printed here
 * would be a number typed by hand into a page whose whole argument is that
 * published figures come from an archived run you can recompute. It waits
 * for the endpoint.
 */
export default function Sellers() {
  const instrument = INSTRUMENTS.find((i) => i.index === 2);
  if (instrument === undefined) {
    throw new Error("instrument 02 is missing from lib/instruments.ts");
  }

  return (
    <>
      <header className="pt-8 pb-8">
        <p className="label">instrument 02 · {instrument.population}</p>
        <h1 className="mt-3 max-w-[20ch] headline text-[clamp(1.9rem,3.2vw,2.8rem)] text-text">
          Who actually <em className="italic text-accent">sells?</em>
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusTag status={instrument.status} />
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-dead">
            method locked · first sweep run · figures not published
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
      <Section
        title="Why there are no numbers here"
        aside="yet"
        className="mt-14"
        heading="display"
      >
        <div className="grid max-w-5xl gap-x-10 gap-y-4 text-[0.96875rem] leading-relaxed text-muted md:grid-cols-2">
          <p>
            The method is locked, and the first full sweep has run and is
            stored. What does not exist yet is the part that would let you
            check the figures: no public endpoint serves the seller tables,
            so there is nothing here to recompute a number from.
          </p>
          <p>
            {BRAND.name} does not print a figure whose evidence a reader
            cannot pull. The counts publish when the archive and the endpoint
            behind them do — the same order every figure on this site went
            through, and the reason the{" "}
            <TextLink href="/methodology" tone="bright">
              method
            </TextLink>{" "}
            was published before the first seller was enumerated.
          </p>
        </div>
      </Section>
    </>
  );
}
