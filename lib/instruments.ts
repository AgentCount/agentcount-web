/**
 * The instruments this audit layer runs, as data.
 *
 * ## Why this module exists
 *
 * For a year this site had one instrument, and so it never had to say the
 * word: the homepage could open with a population count and a reader would
 * correctly infer that counting registered agents was the whole product.
 * That inference is now wrong. A second instrument measures a different
 * population — who actually SELLS, over x402 — and a reader who arrives at
 * a page full of ERC-8004 figures has no way to learn the other half
 * exists. The fix is not more copy on the homepage; it is a list, in one
 * place, that every surface reads.
 *
 * ## What may appear here
 *
 * A row is added the day an instrument ships, and not one day before —
 * the rule `components/InstrumentRow.tsx` already states, kept here because
 * this is the file where the temptation lands. The Reconciliation page
 * (claimed vs. observed) is designed, wanted, and named in the plan; it is
 * deliberately absent below, because a roadmap entry rendered beside two
 * working instruments reads as a third working instrument.
 *
 * ## Status is about publication, not about code
 *
 * `live` means a reader can see figures and the evidence under them. The
 * Seller Census became `live` on 2026-08-28, when `/api/seller-runs` started
 * serving the first sweep and `/sellers` started showing it — not when the
 * sweep ran, and not when the method was locked. An instrument that has
 * measured something the public cannot read is not yet an instrument the
 * public has.
 *
 * The status here is the baseline claim. Surfaces that fetch the figures
 * downgrade it when the API does not answer, rather than printing `live`
 * over an empty row — see the homepage's instrument list and `/sellers`.
 */

export type Instrument = {
  /**
   * Position in the list, printed as a small ordinal. It orders instruments
   * by the date they shipped; it does not rank them and is not a score.
   */
  index: number;
  /** What it is called, in the words a first-time reader can act on. */
  title: string;
  /** Where the instrument's own pages begin. */
  href: string;
  /**
   * Whether a reader can see published figures for it. See this module's
   * header: this tracks publication, not whether the code runs.
   */
  status: "live" | "in development";
  /**
   * The population it measures, as a noun phrase — the answer to "of what?"
   * Shown as the row's own eyebrow so the two instruments' different
   * populations cannot be read as one.
   */
  population: string;
  /** One paragraph: what it asks, and what a reader gets from it. */
  measures: string;
};

export const INSTRUMENTS: readonly Instrument[] = [
  {
    index: 1,
    title: "The Registration Census",
    href: "/census",
    status: "live",
    population: "agents registered under ERC-8004",
    measures:
      "Takes every agent registered on the chains it sweeps and asks whether anything stands behind the registration: does the document resolve, does it say what the standard requires, does the service it names answer. Registration counts are the figure most often cited as proof the agent economy exists, and this is the instrument that checks them.",
  },
  {
    index: 2,
    title: "The Seller Census",
    href: "/sellers",
    status: "live",
    population: "sellers advertising paid resources over x402",
    measures:
      "Registration says an agent exists; it says nothing about whether anyone is selling. This instrument enumerates the sellers that catalogs advertise as taking payment over x402, and asks whether each one answers, quotes a real price when asked, and has ever been paid on-chain. Every seller that let us ask, answered — but only one in three quotes a price a buyer could actually pay.",
  },
];
