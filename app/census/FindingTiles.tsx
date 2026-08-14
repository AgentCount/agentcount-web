import { FindingTile, NoteTile } from "@/components/FindingTile";
import { StatusWord } from "@/components/StatusWord";
import { TextLink } from "@/components/TextLink";
import type { Finding } from "@/lib/api/schemas";
import { LINKAGE } from "@/lib/linkage";

/**
 * The census's four headline tiles, as one shared component because they
 * render at two addresses: on `/census` (over the whole population or one
 * chain, per the switcher) and on the homepage as the census digest. A card
 * or a homepage restating these sentences in its own words is how a preview
 * and a page end up disagreeing — the copy lives once, here.
 */

/**
 * Pull one finding by key, or throw naming the key.
 *
 * Rendering "—" for a finding the API stopped sending would be worse than
 * failing: the missing number IS the page, and a page that quietly loses
 * its headline is the kind of breakage nobody notices for a week.
 */
export function pickFinding(findings: Finding[], key: string): Finding {
  const f = findings.find((x) => x.key === key);
  if (!f) {
    throw new Error(
      `the findings endpoint returned no '${key}' — the census tiles cannot render without it`,
    );
  }
  return f;
}

/** The five findings the four tiles are built from. */
export type CensusFindings = {
  unreachable: Finding;
  unclaimed: Finding;
  attested: Finding;
  attestedResolvable: Finding;
  unattestedResolvable: Finding;
};

const pct = (f: Finding) => (f.percent === null ? "—" : `${f.percent.toFixed(1)}%`);

export function FindingTiles({
  f,
  baseCaveat,
}: {
  f: CensusFindings;
  /**
   * Whether the Base attestation investigation applies to the population on
   * show: true when Base is in it. The sampled read covered ONE chain at ONE
   * pinned block, so on a view that excludes Base the clause is omitted
   * rather than reworded into a claim nobody checked.
   */
  baseCaveat: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-4">
      <FindingTile index={1} finding={f.unreachable}>
        of valid registration documents declare no way to reach the agent — no{" "}
        <code className="font-mono text-text">services</code> entry at all, or
        one with nothing in it.
      </FindingTile>

      {/* Leads with the plain fact; the vocabulary (conformant, check 5,
          unclaimed) follows it instead of gatekeeping it. */}
      <FindingTile index={2} finding={f.unclaimed}>
        of registration files never say which on-chain agent they belong to —
        the spec only recommends the field that would bind them. Check 5
        (Claims its identity?) records those as{" "}
        <StatusWord status="unclaimed" />: neither a pass nor a fail.
      </FindingTile>

      {/* The Base caveat rides the tile it qualifies, as one clause. The
          full paragraph — 300-agent sample, 42–53% interval, why it is
          not printed as a count — lives in the report the sentence links
          to; the tile only has to stop a reader taking the feedback
          number at face value. */}
      <FindingTile index={3} finding={f.attested}>
        have at least one on-chain feedback entry.{" "}
        <span className="text-text">
          Agents with feedback are less likely to have a document that
          resolves than agents with none
        </span>{" "}
        — {pct(f.attestedResolvable)} against {pct(f.unattestedResolvable)}.
        {baseCaveat && (
          <>
            {" "}
            A sampled read traces most of Base&rsquo;s feedback to a handful
            of client addresses.
          </>
        )}
      </FindingTile>

      {/* The fourth question the other three lead up to, and the only one
          that no run answers.

          The first three tiles read from the findings endpoint at render
          time. This one cannot: payment is read from token transfer logs
          and EIP-3009 authorisations, which the census database does not
          hold and no rung produces, so there is no run id a figure here
          would recompute from. It carries the question and the population
          rather than a number, and it takes a number the day the payments
          pipeline writes one into a pinned run. */}
      <NoteTile
        index={4}
        lead="not yet measured"
        source={`${LINKAGE.census.agents.toLocaleString("en-US")} agents · outside the seven checks`}
      >
        Whether money reaches a registered agent is read from token transfer
        logs rather than from the registry, so it is not one of the seven
        checks and no sweep reports it.{" "}
        <TextLink href="/reports/linkage" tone="bright">
          What the join asks, and what it is read against.
        </TextLink>
      </NoteTile>
    </div>
  );
}
