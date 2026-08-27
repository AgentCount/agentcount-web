import Link from "next/link";
import { chainDisplayName } from "@/lib/chains";
import { withArrowNudge } from "./ArrowNudge";

/**
 * Which chain's census you are reading, and how to change it.
 *
 * Rendered only when more than one chain has a completed run — a switcher with
 * one option is furniture. It is a row of links, not a dropdown, so the current
 * chain is legible without interacting and every alternative is a real URL.
 *
 * The chain list comes from the runs themselves (`chainsWithRuns`), so a chain
 * appears the moment its first sweep finishes and never appears before that.
 * Offering a configured-but-unswept chain would lead to a page with nothing on
 * it.
 *
 * Each chip reads in `chainDisplayName`'s prose form ("BNB CHAIN", "ETHEREUM
 * MAINNET"), not the bare API slug ("BSC", "MAINNET") — this is a place a
 * reader chooses a chain, not a place that has to match a URL parameter by
 * eye, so it gets the same name the rest of the site's prose already uses.
 * The visible "Chain" label was dropped for the same reason `nav[aria-label]`
 * exists at all: the `aria-label="Chain"` below still says it to a screen
 * reader, and a sighted reader gets there just as fast from the row's shape —
 * a nav of chain names, next to a page about agents on those chains, needs no
 * caption spelling out what it is.
 *
 * The current chain reads in the brand accent with an underline beneath it,
 * replacing what used to be a bordered chip (`border-edge bg-raised`, no
 * accent at all): a box drawn around the active item reads as a control
 * waiting to be pressed, where a rule under it reads as the state you are
 * already in. It is also the same mark the masthead puts under the current
 * page, so "you are here" is said one way on this site rather than two.
 * This is the one other place besides `NavLink.tsx` the accent marks "you
 * are here" rather than a measurement — see the design-system comment in
 * `globals.css` for the full, short list of where it is allowed to appear.
 *
 * Each chip presses in slightly on click (`active:scale-[0.97]`), same as
 * every other tap target on the site — a chain switch is a real navigation,
 * not a cosmetic tab, and deserves the same tactile confirmation a button
 * gets.
 *
 * Past `MAX_VISIBLE` chips, naming every chain is the same paragraph-not-a-nav
 * problem `compressChainList` (`lib/chains.ts`) solves for prose — so this
 * collapses the same way: the first few chips stay real links, and the rest
 * fold into one "+N more →" link to `/coverage`, the page that already names
 * every swept chain in full. The current chain is always kept in the visible
 * set (bumping the last chip into the count instead) — collapsing the chain
 * you are actually reading would hide the one piece of state this component
 * exists to show.
 */
export function ChainSwitcher({
  chains,
  current,
  basePath,
  allLabel,
}: {
  chains: string[];
  current: string;
  /** Where a switch navigates. Kept per-page so switching chain on the
   * directory keeps you on the directory. */
  basePath: string;
  /**
   * Label for an "every chain" option, rendered first and linking to
   * `basePath` with no `?chain=` at all.
   *
   * Only the homepage passes this, because only the homepage has an
   * all-chains view to return to. Its absence of a query parameter is the
   * point: the census IS the default, and the URL says so by saying nothing.
   * Pages without an aggregate omit this and keep behaving as before.
   */
  allLabel?: string;
}) {
  // One real chain plus an "all" option is still a choice worth rendering;
  // one chain and no aggregate is furniture.
  if (chains.length < 2 && !allLabel) return null;

  const chip = (active: boolean) =>
    `border-b-2 pb-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] transition active:scale-[0.97] ${
      active
        ? "border-accent text-accent"
        : "border-transparent text-dead hover:text-muted"
    }`;

  const MAX_VISIBLE = 5;
  let visible = chains.slice(0, MAX_VISIBLE);
  if (current && !visible.includes(current) && chains.includes(current)) {
    visible = [...visible.slice(0, MAX_VISIBLE - 1), current];
  }
  const hiddenCount = chains.length - visible.length;

  return (
    <nav aria-label="Chain" className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
      {allLabel && (
        <Link
          href={basePath}
          aria-current={current === "" ? "page" : undefined}
          className={chip(current === "")}
        >
          {allLabel}
        </Link>
      )}
      {visible.map((chain) => {
        const active = chain === current;
        return (
          <Link
            key={chain}
            href={`${basePath}?chain=${encodeURIComponent(chain)}`}
            aria-current={active ? "page" : undefined}
            className={chip(active)}
          >
            {chainDisplayName(chain).toUpperCase()}
          </Link>
        );
      })}
      {hiddenCount > 0 && (
        <Link
          href="/coverage"
          className="group font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-dead transition-colors hover:text-muted"
        >
          {withArrowNudge(`+ ${hiddenCount} more →`)}
        </Link>
      )}
    </nav>
  );
}
