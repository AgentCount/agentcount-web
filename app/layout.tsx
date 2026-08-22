import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { NavSearch } from "@/components/NavSearch";
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

            {/* Row two carries places only. The one control the site had
                here — the pre-flight checker — moved to the footer's Tools
                list: see `TOOLS`. */}
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
              <p className="text-sm text-text">{NEWCOMER_SENTENCE}</p>
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
