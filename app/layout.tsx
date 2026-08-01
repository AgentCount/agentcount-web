import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import Link from "next/link";
import { OutboundLink } from "@/components/OutboundLink";
import { BRAND } from "@/lib/brand";
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
  // `template` means every page sets only its own name and gets the product
  // name appended — one more thing the rename in `lib/brand.ts` reaches.
  title: { default: BRAND.name, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  openGraph: { siteName: BRAND.name, type: "website" },
};

const NAV = [
  { href: "/", label: "Findings" },
  { href: "/directory", label: "Directory" },
  { href: "/working", label: "Working" },
  { href: "/preflight", label: "Pre-flight" },
  { href: "/census", label: "Census" },
  { href: "/methodology", label: "Method" },
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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${plexCondensed.variable}`}
    >
      <body className="min-h-screen">
        {/* The masthead is a register header, not a nav bar: the wordmark and
            what it measures sit on one hairline, and the sections are set as
            micro-labels rather than buttons. */}
        <header className="border-b border-edge">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 px-5 py-4 sm:px-7">
            <div className="flex items-baseline gap-4">
              <Link
                href="/"
                className="font-display text-2xl font-semibold uppercase tracking-[0.16em] text-text"
              >
                {BRAND.name}
              </Link>
              <span className="hidden label sm:inline">
                ERC-8004 conformance census
              </span>
            </div>
            <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 gap-y-2">
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
          </div>
        </header>

        <main className="px-5 py-8 sm:px-7">{children}</main>

        <footer className="mt-24 border-t border-edge px-5 py-8 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-6">
            <div className="max-w-prose">
              <p className="text-sm text-muted">
                <span className="text-text">{BRAND.name}</span> is a conformance
                census, not a rating agency. Every rung on this site carries the
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
              <p className="mt-3 font-mono text-xs text-muted">{BRAND.domain}</p>
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
