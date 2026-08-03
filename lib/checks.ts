/**
 * The seven checks, in the words a reader actually needs.
 *
 * ## Why this module exists
 *
 * The census calls them RUNGS. That word is doing real work in the data model
 * — the ladder is ordered, each step depends on the one below, and a failure
 * short-circuits everything above it — and the schema, the API, the evidence
 * keys and the Rust crates all keep it. Nothing here renames any of that.
 *
 * But "rung 4: conformant" is a sentence about our internals. A reader who has
 * not read the methodology cannot tell what was asked, and the single densest
 * thing on this site was written in a vocabulary only its authors held. So
 * every user-facing surface renders from this module instead: the number stays
 * (it is the ordering, and it is what the strip shows), and beside it goes a
 * plain question anyone can answer yes or no to.
 *
 * ## One source, every surface
 *
 * Cards, directory, agent pages, OG images, tooltips and the pre-flight
 * checker all read from here. The API's own `name` is still carried through
 * as [`internal`] — it is what the evidence and the archives are keyed by, and
 * `/methodology` prints both vocabularies side by side so the mapping is never
 * something a reader has to infer.
 *
 * ## The number is not a score
 *
 * Seven checks, seven separate questions. They are never summed, averaged, or
 * turned into "5 of 7" — see `components/RungStrip.tsx`. The numbering is an
 * order of dependency, not a scale.
 */

export type Check = {
  /** Position on the ladder. Also the API's `rung`. */
  number: number;
  /**
   * The checker's own word for it, as the API sends it. Read from the API at
   * runtime wherever a status is rendered — this copy exists so a check can be
   * described before any run is loaded (the methodology table, the pre-flight
   * form) and so the two vocabularies can be shown together.
   */
  internal: string;
  /** The plain-English question, always a yes/no. Title case, ends in "?". */
  question: string;
  /** One line, no jargon: what a pass on this check actually establishes. */
  meaning: string;
  /**
   * The one thing a reader will over-read this check to mean, in a clause.
   *
   * It travels with the RATE, not with the method page. A population figure
   * gets screenshotted, quoted and pasted without its methodology, so a
   * caveat that lives only on /methodology is a caveat that is never read
   * next to the number it qualifies. Only checks whose name promises more
   * than they measure carry one.
   */
  caveat?: string;
};

/**
 * Ordered by number. `live` (6) is included even though no run reports it:
 * a reader looking at a strip with a gap at position 6 needs to know what is
 * missing, and "not checked" without a subject is worse than useless.
 */
export const CHECKS: readonly Check[] = [
  {
    number: 1,
    internal: "registered",
    question: "Registered?",
    meaning: "The agent exists in the on-chain registry, with an owner and a document URL.",
  },
  {
    number: 2,
    internal: "resolvable",
    question: "Reachable?",
    caveat:
      "Counts documents stored on-chain, which resolve by construction — this is not a server-uptime rate.",
    meaning: "The document URL it declared actually answers when fetched.",
  },
  {
    number: 3,
    internal: "parseable",
    question: "Readable?",
    meaning: "What came back is valid JSON that a machine can read.",
  },
  {
    number: 4,
    internal: "conformant",
    question: "Follows the spec?",
    meaning: "The document meets what ERC-8004 requires of it.",
  },
  {
    number: 5,
    internal: "bound",
    question: "Claims its identity?",
    meaning: "The document names the on-chain agent it belongs to, rather than leaving it unsaid.",
  },
  {
    number: 6,
    internal: "live",
    question: "Answers?",
    meaning: "A declared endpoint responds to a probe. Not implemented yet, so nobody passes or fails it.",
    caveat:
      "Something answered — not that it works, speaks any protocol, or is the agent.",
  },
  {
    number: 7,
    internal: "attested",
    question: "Has feedback?",
    caveat: "Someone left feedback — not that they were independent of the agent.",
    meaning: "At least one on-chain feedback entry names this agent.",
  },
];

const BY_NUMBER = new Map(CHECKS.map((c) => [c.number, c]));

/** The check at a position, or `undefined` for a number the ladder lacks. */
export function checkFor(number: number): Check | undefined {
  return BY_NUMBER.get(number);
}

/**
 * The question for a position — or a truthful fallback.
 *
 * A rung this app has no entry for still renders, using the API's own name if
 * one was supplied. Inventing a question for a check we do not recognise would
 * be describing a measurement we cannot describe.
 */
export function questionFor(number: number, apiName?: string): string {
  return checkFor(number)?.question ?? apiName ?? `Check ${number}`;
}

/**
 * How a check is named on first mention in prose: `check 4 (Follows the spec?)`.
 *
 * Used where a sentence needs to be unambiguous about which check it means
 * without sending the reader to the methodology page.
 */
export function checkLabel(number: number, apiName?: string): string {
  return `check ${number} (${questionFor(number, apiName)})`;
}

/**
 * Rewrite `rung N` into this site's vocabulary, inside a string the API wrote.
 *
 * ## This app's standing rule is to print the API's words untouched
 *
 * That rule exists because a phrase this app invents can drift from the thing
 * it describes. It is suspended here for one narrow pattern, and the reason is
 * the findings cards: the API labels a denominator "documents that parsed and
 * reached rung 4", and that sentence is the single most-read piece of text on
 * the site. A reader meeting it has to already know what rung 4 asked — which
 * is precisely the lookup this vocabulary pass exists to remove.
 *
 * So the substitution is deliberately mechanical and total: `rung N` becomes
 * `check N (Question?)` wherever N is a check this app has a label for, and
 * anything else in the string — including a rung number it does not recognise
 * — passes through exactly as sent. Nothing is reworded, reordered or
 * summarised; only the name of the check changes, to the name the rest of the
 * site uses for the same check.
 *
 * The alternative was asking the API to rename a field whose vocabulary the
 * archives and evidence keys are written in. That trade was refused on
 * purpose: the data model keeps `rung`, and only the presentation layer
 * speaks in checks.
 */
export function humaniseRungs(text: string): string {
  return text.replace(/\brung (\d+)\b/gi, (whole, digits: string) => {
    const check = checkFor(Number(digits));
    return check ? `check ${check.number} (${check.question})` : whole;
  });
}

/** `ariaLabel` for one badge: everything the badge encodes, spelled out. */
export function checkAriaLabel(
  number: number,
  statusLabel: string,
  apiName?: string,
): string {
  return `Check ${number}, ${questionFor(number, apiName)} — ${statusLabel}`;
}
