import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import Link from "next/link";
import { NavSearch } from "@/components/NavSearch";
import { OutboundLink } from "@/components/OutboundLink";
import { TallyMark } from "@/components/TallyMark";
import { BRAND, newcomerSentence } from "@/lib/brand";
import { formatChainList } from "@/lib/chains";
import { getPublishedRuns, sweptChains } from "@/lib/published-runs";
import "./globals.css";

/**
 * IBM Plex, in three cuts. Loaded through `next/font`, which is part of Next —
 * no npm dependency is added by this, though it does mean a build fetches the
 * font files once and caches them.
 *
 * The three cuts are used semantically, not decoratively (see `globals.css`):
 * mono for anything the chain or the checker produced, condensed for display
 * numerals and titles, sans for prose.
 */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plex-condensed",
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
 * Five sections, in the order a first-time visitor needs them.
 *
 * Nine items was a table of contents for people who already knew the site.
 * Every one of them was a real page, which is exactly why the list stopped
 * working: nine equal-weight labels rank nothing, so the reader has to read
 * all nine to find the one door they wanted, and the two jobs that actually
 * bring people here — "is this agent real?" and "check my agent" — were
 * neither of them a nav item.
 *
 * Directory leads because looking an agent up is the most common errand and
 * the search box beside it is the same job. Findings is the census's argument,
 * Reports the long-form version, Method how a rung is decided, Data the
 * archives that make the recomputability claim checkable rather than merely
 * stated.
 *
 * The four that left are not gone: Working is a preset filter inside
 * Directory, Census a section of Findings, Linkage a report, Pre-flight the
 * action button to the right of this list. Each keeps its old URL.
 */
const NAV = [
  { href: "/directory", label: "Directory" },
  { href: "/", label: "Findings" },
  { href: "/reports", label: "Reports" },
  { href: "/methodology", label: "Method" },
  { href: "/data", label: "Data" },
];

/**
 * The one thing a visitor can DO here, so it is the one thing shaped like a
 * control rather than a link.
 *
 * Bordered and bone — never filled, never coloured. `globals.css` reserves
 * saturation for rung statuses, and a green or blue button would both break
 * that rule and quietly demote the six status colours from "the only meaning
 * on the page" to "one of several things that are coloured". A box with a
 * hairline is enough to read as a control in a page that has no other boxes.
 *
 * Labelled for the errand, not the page title: "Pre-flight" names a feature
 * someone must already understand. "Check your agent" was tried and read as
 * "look up my minted agent" — the directory's job — when what the page checks
 * is a document before minting. The label now says when and what, in the
 * page's own words.
 */
const ACTION = { href: "/preflight", label: "Check before you mint" };

/**
 * The pages that say what this project is rather than what it measured.
 *
 * Footer rather than nav: nobody arrives looking for them, and both exist to
 * be found at the moment a reader starts wondering — which is usually after
 * they have read a finding that names someone.
 */
const ABOUT = [
  { href: "/neutrality", label: "Who pays for this" },
  // What the census does and does not cover, with the probe that keeps the
  // answer honest. In the footer for the same reason the others are: it is
  // the page a reader wants at the moment they start asking about scope.
  { href: "/coverage", label: "What this covers" },
  // Linkage is a report now, not a section — it is the long-form join between
  // the identity layer and the payments layer, which is what the reports index
  // is for. Census and Working needed no footer entry once they became a
  // homepage section and a directory preset respectively: both are reachable
  // from the pages that absorbed them.
  { href: "/reports/linkage", label: "Identity and payments" },
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
    title: "Indexer, probe and checker — the code behind every rung",
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
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The footer names the swept chains, so it reads the same canonical list
  // the headline does — the live one from the core repo, not the committed
  // fallback. See `getPublishedRuns`.
  const chains = formatChainList(sweptChains(await getPublishedRuns()));
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${plexCondensed.variable}`}
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
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-3.5 sm:px-7">
            <div className="flex items-baseline gap-4">
              <Link
                href="/"
                className="font-display text-2xl font-semibold uppercase tracking-[0.16em] text-text"
              >
                {/* Inline and on the wordmark's own line, not a badge beside
                    it. Green via the real `text-live` token — the mark is
                    drawn in `currentColor`, so this is the one saturated
                    colour rule (`globals.css`) being borrowed, not broken:
                    it is the status palette's own green, claiming nothing.

                    Every size below is in `em`, so the lockup is one object
                    that rescales with the wordmark — change `text-2xl` and
                    the mark, its spacing and its optical centring all follow.

                    The numbers, since none of them is arbitrary. The strokes
                    occupy 37 of the mark's 48 viewBox units (0.771), and
                    Plex Sans Condensed has a cap height of 0.698em, so a 1em
                    box draws the mark at 0.771em — 1.10x cap height, which
                    is the small overhang that stops a mark reading as
                    smaller than the type it sits beside.

                    `align-[-0.15em]`: `inline-block` puts the box's BOTTOM on
                    the baseline, and the strokes sit 0.115em up from that
                    edge, which floats the whole mark above the caps. Dropping
                    the box 0.15em centres the strokes on the caps' own centre
                    (0.349em), leaving a symmetric ~0.036em overhang top and
                    bottom.

                    `mr-[0.4em]`: the visible mark is 0.896em wide, so half of
                    it is 0.448em — less the 0.052em of empty box the viewBox
                    already carries on its right edge. */}
                <TallyMark
                  strokeWidth={6}
                  className="mr-[0.4em] inline-block h-[1em] w-[1em] align-[-0.15em] text-live"
                />
                {BRAND.name}
              </Link>
              {/* Positioning, not method. The technical self-description
                  moved to the footer and the meta description — see
                  `BRAND.greeting`. */}
              <span className="hidden label sm:inline">{BRAND.greeting}</span>
            </div>
            {/* Search closes row one, full-width on its own line on a phone:
                "is this agent real?" is the errand most people arrive with,
                so it shares the identity row rather than competing with the
                nav. */}
            <div className="w-full sm:ml-auto sm:w-auto">
              <NavSearch />
            </div>
          </div>

          {/* Row two: places, then the one action. */}
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-line px-5 py-2.5 sm:px-7">
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
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="label transition-colors hover:text-text"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </details>

            {/* The one control on the site. Bordered bone, never filled: see
                `ACTION`. */}
            <Link
              href={ACTION.href}
              className="border border-edge px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-text transition-colors hover:bg-raised"
            >
              {ACTION.label}
            </Link>
          </div>
        </header>

        <main className="px-5 py-8 sm:px-7">{children}</main>

        <footer className="mt-24 border-t border-edge px-5 py-8 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-6">
            <div className="max-w-prose">
              {/* The five-second line, for a reader who arrived knowing
                  nothing. First thing in the footer because the footer is
                  where someone who did not understand the rest of the page
                  goes looking — and it is written to be the one sentence
                  that makes the rest legible, not a summary of it. */}
              <p className="text-sm text-text">
                {newcomerSentence(chains)}
              </p>
              <p className="mt-3 text-sm text-muted">
                <span className="text-text">{BRAND.name}</span> is a conformance
                census, not a rating agency. Every check on this site carries the
                evidence behind it, and nothing here is compressed into a score.
              </p>
              {/* The canonical domain, set as text rather than as a link: a
                  reader on the canonical domain gains nothing from a link to
                  where they already are.

                  It earns its place because this page is not only served from
                  there. It is also reachable on the Netlify deploy URL, and —
                  being a public register whose whole promise is that claims can
                  be re-checked — it is the kind of page that gets mirrored,
                  archived and scraped. A reader holding a copy should be able
                  to tell where the authoritative one lives. Mono, because it is
                  an identifier rather than prose. */}
              {/* The technical self-description, displaced from the masthead
                  by `BRAND.greeting`. It sits with the domain because both
                  are identifiers rather than prose: what this is, and where
                  the authoritative copy lives. */}
              <p className="mt-3 font-mono text-xs text-muted">
                {BRAND.selfDescription} · {BRAND.domain}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="label">About</span>
              {ABOUT.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
                >
                  {item.label}
                </Link>
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
              <a
                href={`mailto:${BRAND.contactEmail}`}
                className="font-mono text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text hover:decoration-edge"
              >
                {BRAND.contactEmail}
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
