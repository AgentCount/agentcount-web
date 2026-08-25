import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { NavLink } from "@/components/NavLink";
import { NavSearch } from "@/components/NavSearch";
import { PageTransition } from "@/components/PageTransition";
import { OutboundLink } from "@/components/OutboundLink";
import { TallyMark } from "@/components/TallyMark";
import { TextLink } from "@/components/TextLink";
import { BRAND, NEWCOMER_SENTENCE } from "@/lib/brand";
import "./globals.css";

/**
 * Big Shoulders Display / Instrument Sans / JetBrains Mono, in place of IBM
 * Plex — see the design-system comment at the top of `globals.css` for why.
 * Loaded through `next/font`, same as before: no npm dependency is added by
 * this, though it does mean a build fetches the font files once and caches
 * them.
 *
 * The three cuts keep IBM Plex's own semantic split (see `globals.css`):
 * mono for anything the chain or the checker produced, condensed for display
 * numerals and titles, sans for prose. Only the faces changed.
 *
 * JetBrains Mono also loads italic 700, which nothing needed before this
 * change: it is what `app/page.tsx` sets on the hero's "agent economy"
 * emphasis, the one other place the new accent appears.
 */
const shoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-big-shoulders",
  display: "swap",
});

/*
 * A known warning this file cannot silence, documented so nobody spends an
 * afternoon on it twice:
 *
 *     Failed to find font override values for font `Big Shoulders`
 *     Skipping generating a fallback font.
 *
 * Google renamed this family from "Big Shoulders Display" to plain "Big
 * Shoulders". Next's downloadable-font list
 * (`@next/font/dist/google/font-data.json`) carries the new name, which is
 * why the font itself loads and renders correctly. Its fallback-metrics
 * table (`next/dist/server/capsize-font-metrics.json`) still only carries
 * the old ones — `bigShouldersDisplay`, `bigShouldersText`, and the inline
 * and stencil cuts — with no `bigShoulders` entry. `Instrument_Sans` and
 * `JetBrains_Mono` both have theirs, which is why only this one warns.
 *
 * `adjustFontFallback: false` is the documented way to opt out, and it does
 * work in the JS loader — but under Turbopack (the default here since Next
 * 16) `next/font/google` is handled by the native SWC binary, which owns
 * this warning string and ignores that flag. Verified: clean `.next`,
 * `adjustFontFallback: false`, warning unchanged. So the option was removed
 * again rather than left in place claiming a fix it does not deliver.
 *
 * What it actually costs: no `size-adjust`/`ascent-override` descriptors on
 * the fallback face, so the reflow when the real font swaps in is slightly
 * larger than it would otherwise be. Nothing renders unstyled — the
 * `--font-display` chain in `globals.css` falls back to Instrument Sans and
 * then the system sans. The only real fix is vendoring the font files and
 * loading them through `next/font/local`, which computes metrics with
 * fontkit; that is a deliberate trade (font files in the repo) this pass
 * does not make. Revisit when Next refreshes its metrics table.
 */

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  /**
   * The origin every relative URL in this app's metadata resolves against —
   * `og:image` above all.
   *
   * Next does not default this to anything useful. Unset, it guesses: the
   * build host during a build, `http://localhost:3000` in dev, and it says so
   * in a warning nobody reads because the pages render perfectly either way.
   * What it produces is an absolute `og:image` on an origin that is not this
   * site, over plain `http`. Crawlers do not follow that, so the card silently
   * does not exist — which is exactly the failure this project shipped with.
   *
   * Hardcoded to the canonical domain rather than read from the deploy's own
   * URL, and that IS the intent: a preview deploy should advertise the
   * production card. A link shared from a preview is still a link to this
   * project, and pointing its preview at an ephemeral deploy URL means the
   * card dies when the deploy is cleaned up.
   */
  metadataBase: new URL(`https://${BRAND.domain}`),
  // `template` means every page sets only its own name and gets the product
  // name appended — one more thing the rename in `lib/brand.ts` reaches.
  title: { default: BRAND.name, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  openGraph: { siteName: BRAND.name, type: "website" },
  /**
   * The large card, everywhere.
   *
   * Next infers `summary_large_image` on any page that resolves an
   * `opengraph-image`, so this is not what makes the agent cards large. It is
   * here for the pages that have not got one yet: `summary` renders a small
   * square thumbnail beside the text, which for a 1200x630 card means a
   * centre-crop that cuts the wordmark off both sides.
   */
  twitter: { card: "summary_large_image" },
  /**
   * `public/site.webmanifest` — the 512px maskable icon and the theme colour.
   * The rest of the icon set (`icon.svg`, `favicon.ico`, `apple-icon.png`)
   * needs no entry here: those are file conventions in `app/`, and Next emits
   * their `<link>` tags on every route by itself. All of them are drawn from
   * one geometry, `lib/tally.ts`, by `scripts/generate-brand.tsx`.
   */
  manifest: "/site.webmanifest",
};

/**
 * Four places, ordered from the instrument outward.
 *
 * "Findings" leads because it is the product's one live instrument — the
 * homepage is the overview OF it, so the wordmark and the first nav item are
 * different doors. A future instrument earns a nav item the day it ships,
 * and the label will be the instrument's name, not "new".
 *
 * "Agents" is the list of agents. It was called "Directory", which names the
 * shape of the page rather than what is in it. The URL stays `/directory`:
 * labels are for readers, URLs are identifiers other people have linked to.
 *
 * "Data" is the archives — promoted from the footer because downloading a
 * run is the product's whole reproducibility claim made concrete, not a
 * reference detail.
 *
 * Coverage, the pre-flight checker and Method live in the footer: they are
 * what you consult while checking a claim, not what you arrive for. The
 * census hero still links /coverage where the scope claim is made.
 */
const NAV = [
  // Labelled "Findings", not "Census": the label must work for a reader —
  // including one whose first language is not English — before they know any
  // of this product's vocabulary. The URL stays `/census` because URLs are
  // identifiers other people have linked to.
  { href: "/census", label: "Findings" },
  { href: "/directory", label: "Agents" },
  { href: "/reports", label: "Reports" },
  { href: "/data", label: "Data" },
];

/**
 * Reference, in the footer: what you consult while checking a figure, rather
 * than what you came to read.
 */
const TOOLS = [
  { href: "/methodology", label: "Method" },
  { href: "/coverage", label: "Coverage" },
  { href: "/preflight", label: "Check a file" },
];


/**
 * The two public repositories, linked from the footer.
 *
 * Deliberately not in `lib/brand.ts`: that module's own comment records that
 * repository names are source-control identifiers rather than product
 * branding, and kept outside it. They sit here beside `NAV` for the same
 * reason `NAV` does — layout chrome, defined where it is rendered.
 *
 * Why the footer at all, rather than a line on the methodology page: this
 * census asks a reader to re-check every claim against a second source, and
 * the code that produced the claims is part of what there is to check. A
 * conformance register that cannot itself be inspected is asking for the
 * trust it declines to extend. Both repos are public and Apache-2.0.
 *
 * Ordered core-first: the Rust crates decide every rung on the site, the
 * front end only renders what the API already settled.
 */
const SOURCE = [
  {
    href: "https://github.com/AgentCount/agentcount",
    label: "Core (Rust)",
    title: "Indexer, probe and checker — the code behind every check",
  },
  {
    href: "https://github.com/AgentCount/agentcount-web",
    label: "This site",
    title: "The Next.js front end you are reading",
  },
];

/**
 * Apache-2.0, pinned to the file on the default branch rather than to a
 * `/blob/HEAD/` or bare-repo URL, so the link keeps resolving to the licence
 * text itself. It points at the web repo because that is the code serving the
 * page a reader is on; the core repo carries the same licence.
 */
const LICENSE = {
  href: "https://github.com/AgentCount/agentcount-web/blob/main/LICENSE",
  label: "Apache-2.0",
};

/**
 * Full-width and dense, in the manner of Etherscan and L2Beat.
 *
 * The old layout put every page in a centred `max-w-5xl` column, which on a
 * wide monitor turned a 60,097-row census into a narrow strip with large dead
 * space either side. Data gets the whole width; prose opts back into a
 * readable measure with `max-w-prose` where it appears.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${jetbrainsMono.variable} ${shoulders.variable}`}
    >
      <body className="min-h-screen">
        {/* The masthead is a register header, not a nav bar — and it is two
            deliberate rows, not one negotiated one. The old single row held
            seven items of five kinds, and between ~640px and ~1100px the
            flex-wrap chose what broke; the header had a different shape at
            every width, which is what "items appended over time" looks like
            at runtime.

            Row one is identity and the one input: wordmark, greeting, search.
            Row two is places and the one action: the five sections, the CTA.
            The hairline between them does the composing, and the header has
            the same shape at every width from `sm` up.

            Below `sm` each row still stacks: identity, then search
            full-width, then the sections behind a `<details>` disclosure,
            then the CTA. That disclosure is why the header fits a 360px
            phone without a hamburger's worth of JavaScript. */}
        <header className="border-b border-edge">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[var(--page-gutter)] py-[22px]">
            <div className="flex items-baseline gap-4">
              <Link
                href="/"
                className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-text"
              >
                {/* Inline and on the wordmark's own line, not a badge beside
                    it. Bone via `text-text` — not `text-live`, which is
                    where the real site had this before this design
                    proposal: the bars drew in the status palette's own
                    green. That reads as this one favicon/wordmark quietly
                    claiming a "pass" that is not its to claim, and it is
                    the reason the mark carries a second colour at all now
                    — the diagonal is where this proposal's accent goes,
                    the bars are just the site's own ink, `currentColor`
                    resolving to whatever text colour surrounds them.

                    Every size below is in `em`, so the lockup is one object
                    that rescales with the wordmark — change `text-lg` and
                    the mark, its spacing and its optical centring all follow.

                    The numbers, since none of them is arbitrary. The strokes
                    occupy 37 of the mark's 48 viewBox units (0.771), and the
                    cap height here is 0.698em, so a 1em box would draw the
                    mark at 0.771em — 1.10x cap height, the small overhang
                    that stops a mark reading as smaller than the type it
                    sits beside.

                    The box is 1.6em, not 1em: at 1em the mark and the
                    wordmark were the same height, and a pair that matches
                    reads as ten letters with a glyph in front rather than
                    as a mark WITH a name — the lockup needs one of the two
                    to lead, and it has to be the mark. 1.6 lands it at
                    28.8px against this masthead's 18px type, far enough
                    ahead to read as the leading element without the mark
                    outgrowing the `py-[22px]` row it sits in.

                    Both derived numbers below scale with that 1.6, because
                    both are properties of the mark; the cap height they are
                    measured against does not, because it is a property of
                    the type. So neither is 1.6x its old value.

                    `align-[-0.45em]`: `inline-block` puts the box's BOTTOM on
                    the baseline. The strokes sit 0.115em up from that edge
                    per em of box, and are 0.771em tall per em of box, so
                    their visual centre is at 0.5005em per em — 0.801em for a
                    1.6em box. Dropping the box by 0.801 - 0.349 = 0.452em
                    puts that centre on the caps' own centre (0.349em). The
                    same arithmetic returns 0.15em at 1em, which is what this
                    line used to read.

                    `mr-[0.63em]`: the visible mark is 0.896em wide per em of
                    box, so half of it — the gap that makes the pair read as
                    one object — is 0.448em per em. Less the 0.052em per em
                    of empty box the viewBox already carries on its right
                    edge, that is 0.396em per em, or 0.634em at 1.6. */}
                <TallyMark
                  strokeWidth={6}
                  className="mr-[0.63em] inline-block h-[1.6em] w-[1.6em] align-[-0.45em] text-text"
                />
                {BRAND.name}
              </Link>
            </div>
            {/* Search closes row one, full-width on its own line on a phone:
                "is this agent real?" is the errand most people arrive with,
                so it shares the identity row rather than competing with the
                nav. */}
            <div className="w-full sm:ml-auto sm:w-auto">
              <NavSearch />
            </div>
          </div>

          {/* Row two: places, then the one action. The hairline above it
              stays on this outer, unbounded element so it still runs the
              full width of the viewport; the max-width cap goes on the
              inner row only — same split as the `<footer>` below, for the
              same reason (see that element's own comment). */}
          <div className="border-t border-line">
            <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[var(--page-gutter)] py-0">
              {/* `<details>` is the whole mobile menu: open/closed is a browser
                  behaviour, so five sections collapse on a phone with no state,
                  no hydration and no bundle. From `sm` up the marker is hidden
                  and the list is laid out inline, so the disclosure exists only
                  where it is needed.

                  `open` is set unconditionally because at `sm` and up the CSS
                  shows the list regardless — a closed `<details>` that CSS keeps
                  visible would be a lie to a screen reader. On a phone the
                  reader closes it; it reopens on navigation, which is the
                  correct default for a five-item register. */}
              <details
                open
                className="w-full [&_summary]:sm:hidden sm:w-auto"
              >
                <summary className="label cursor-pointer list-none py-1 marker:content-none">
                  Sections
                </summary>
                <nav
                  aria-label="Main"
                  className="mt-2 flex flex-wrap items-center gap-x-7 gap-y-2 sm:mt-0"
                >
                  {/* Active-page indicator: `NavLink` sets
                      `aria-current="page"` on a match, and `globals.css`
                      colours that state — see both files' own comments.
                      The state is carried by the ARIA attribute rather than
                      by a class, so the accent a sighted reader sees and
                      the position a screen reader announces come from one
                      fact and cannot drift apart. */}
                  {NAV.map((item) => (
                    <NavLink key={item.href} href={item.href} className="label">
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </details>

              {/* Row two carries places only. The one control the site had
                  here — the pre-flight checker — moved to the footer's Tools
                  list: see `TOOLS`. */}
            </div>
          </div>
        </header>

        {/* 1800px: wide enough for the data tables, and still a real bound.
            This site deliberately dropped a centred `max-w-5xl` (1024px)
            column — see this file's own header comment — because a
            60,097-row census read as "a narrow strip with large dead space
            either side" at that width. 1800px keeps that headroom for the
            wide tables (`AgentTable`, the runs table on `/data`) while still
            giving a real margin back on anything wider — an ultrawide or a
            big desktop monitor — which is the gap this cap closes. Prose
            sections keep their own narrower `max-w-prose`/`max-w-[Nch]`
            regardless; this is the outer bound, not the reading width. */}
        <main className="mx-auto max-w-[1800px] px-[var(--page-gutter)] py-8">
          {/* `PageTransition` — a click in the nav below now lands with
              the same fade-in-up the preflight/spot-check results use,
              rather than the new page snapping into place. See that
              component's own doc for why it's scoped to pathname
              changes only, not every filter or page of pagination. */}
          <PageTransition>{children}</PageTransition>
        </main>

        <footer className="mt-24 border-t border-edge px-[var(--page-gutter)] py-8">
          {/* The `border-t` above stays on `<footer>` itself, so it spans the
              full viewport regardless of the cap below — same split as row
              two of the header. */}
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-start justify-between gap-x-12 gap-y-6">
            <div className="max-w-prose">
              {/* The five-second line, for a reader who arrived knowing
                  nothing. First thing in the footer because the footer is
                  where someone who did not understand the rest of the page
                  goes looking — and it is written to be the one sentence
                  that makes the rest legible, not a summary of it.

                  `text-muted`, not `text-text`: every other paragraph of
                  prose on the site reads at `text-muted` (the hero's own
                  opening paragraph included), reserving full `text-text`
                  for headings, data and the odd emphasised word. Its
                  position already makes this line the first thing read
                  here — it does not also need the site's brightest ink to
                  earn that, and a footer is where the page is winding
                  down, not raising its voice. */}
              <p className="text-sm text-muted">{NEWCOMER_SENTENCE}</p>
              {/* The canonical domain, set as text rather than as a link: a
                  reader on the canonical domain gains nothing from a link to
                  where they already are. It earns its place because this page
                  is also reachable on the deploy URL, and — being a public
                  register whose whole promise is that claims can be
                  re-checked — it gets mirrored, archived and scraped. A
                  reader holding a copy should be able to tell where the
                  authoritative one lives. Mono, because it is an identifier
                  rather than prose. The self-description would restate the
                  sentence directly above it, so the domain stands alone. */}
              <p className="mt-3 font-mono text-xs text-muted">{BRAND.domain}</p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="label">Reference</span>
              {TOOLS.map((item) => (
                <TextLink
                  key={item.href}
                  href={item.href}
                  className="text-sm"
                >
                  {item.label}
                </TextLink>
              ))}
            </div>

            {/* Source before Contact: a reader who wants to check something
                should meet the code before they meet the inbox. */}
            <div className="flex flex-col items-start gap-2">
              <span className="label">Source</span>
              {SOURCE.map((repo) => (
                <OutboundLink
                  key={repo.href}
                  href={repo.href}
                  title={repo.title}
                  className="text-sm text-muted"
                >
                  {repo.label}
                </OutboundLink>
              ))}
              <OutboundLink
                href={LICENSE.href}
                title="Licence terms for this site and the census code"
                className="mt-1 text-sm text-muted"
              >
                {LICENSE.label}
              </OutboundLink>
            </div>

            <div className="flex flex-col gap-2">
              <span className="label">Contact</span>
              <TextLink
                href={`mailto:${BRAND.contactEmail}`}
                className="font-mono text-sm"
              >
                {BRAND.contactEmail}
              </TextLink>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
