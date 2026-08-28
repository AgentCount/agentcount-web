/**
 * The Seller Census's rungs, in the words a reader actually needs.
 *
 * The sibling of `lib/checks.ts`, and deliberately a separate module: these
 * are a different instrument's questions over a different population, and a
 * single merged list would invite exactly the confusion this site is trying
 * to remove — "check 3" meaning one thing on one page and another thing on
 * the next. The numbers here are the Seller Census's own `rung` values, as
 * METHODOLOGY §10.3 locks them.
 *
 * ## Two things this list must keep saying
 *
 * **It is not a strict ladder.** The registration census's seven checks are
 * ordered by dependency; these are not. Rung 6 reads a chain and rung 7
 * compares catalogs, and neither needs the rung below it to have passed.
 * Each rung names its own prerequisites.
 *
 * **Two of these have never run**, and the list says so per row rather than
 * in a footnote. Rung 5 is reserved — designed, not in the locked method,
 * and it enters by changelog. Rung 4 spends real money at published rules
 * and waits on a funded wallet, so nothing on this site may imply anything
 * was ever purchased or delivered. `seller_runs.rungs_attempted` records
 * what each sweep actually asked, which is what makes "not attempted"
 * checkable rather than a claim.
 */

export type SellerCheck = {
  /** The rung number, as the census records it. Not a score. */
  number: number;
  /** The census's own word for it, as the data is keyed. */
  internal: string;
  /** The plain question, answerable yes or no. */
  question: string;
  /** One line: what a pass on this rung actually establishes. */
  meaning: string;
  /**
   * Whether this rung has ever been asked of a real seller. `reserved` is
   * rung 5 alone: designed, deliberately outside the locked method.
   */
  state: "swept" | "not yet run" | "reserved";
  /**
   * The thing a reader will over-read this rung to mean. Travels with the
   * rung for the same reason `Check.caveat` does — a figure gets quoted
   * without the method page attached.
   */
  caveat?: string;
};

export const SELLER_CHECKS: readonly SellerCheck[] = [
  {
    number: 1,
    internal: "listed",
    question: "Which catalogs advertise this seller, and since when?",
    meaning:
      "The population is the listed, so this rung is evidence rather than a verdict.",
    state: "swept",
    caveat:
      "Every catalog is partial and nobody publishes the union, so this is the advertised economy, not the whole of it.",
  },
  {
    number: 2,
    internal: "reachable",
    question: "Does the host answer at all?",
    meaning:
      "Any HTTP response counts as a pass, including a 4xx or 5xx: the question is existence, not health.",
    state: "swept",
  },
  {
    number: 3,
    internal: "quotes",
    question: "Asked for the resource, does it name a price it can be paid at?",
    meaning:
      "A spec-valid 402 naming a scheme, network, amount, asset and this seller's own payment address, judged against a pinned x402 spec commit.",
    state: "swept",
    caveat:
      "A 402 here is the seller working, not refusing — it is the protocol stating what something costs.",
  },
  {
    number: 4,
    internal: "delivers",
    question: "Paid for real, does the resource actually arrive?",
    meaning:
      "The only rung that spends money, under rules published before the first purchase: a capped amount, one purchase per seller per sweep, from a wallet named in advance.",
    state: "not yet run",
    caveat:
      "Never attempted. No figure on this site describes anything bought, delivered or undelivered.",
  },
  {
    number: 5,
    internal: "receipted",
    question: "—",
    meaning:
      "Designed against the x402 offers-and-receipts extension, and held out of the locked method until that extension stabilises. It enters by changelog.",
    state: "reserved",
  },
  {
    number: 6,
    internal: "settled",
    question: "Has this payment address ever actually been paid?",
    meaning:
      "On-chain settlement history at a pinned block — first and last settlement, how many, and from how many distinct payers.",
    state: "swept",
    caveat:
      "Scoped to a stated block window on one chain, so a fail means \"nothing in that window\", never \"never paid\". Distinct payers is the load-bearing figure, not the count.",
  },
  {
    number: 7,
    internal: "consistent",
    question: "Does the endpoint quote what the catalog advertised?",
    meaning:
      "Price, description and schema compared field by field against each catalog that lists it; a disagreement between two catalogs is itself evidence.",
    state: "swept",
  },
];
