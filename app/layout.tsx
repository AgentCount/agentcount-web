import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  // `template` means every page sets only its own name and gets the product
  // name appended — one more thing the rename in `lib/brand.ts` reaches.
  title: { default: BRAND.name, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  openGraph: { siteName: BRAND.name, type: "website" },
};

/**
 * Full-width and dense, in the manner of Etherscan and L2Beat.
 *
 * The old layout put every page in a centred `max-w-5xl` column, which on a
 * wide monitor turned a 60,097-row census into a narrow strip with large dead
 * space either side. Data gets the whole width; prose opts back into a
 * readable measure with `max-w-prose` where it appears.
 */
const NAV = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/working", label: "Working agents" },
  { href: "/census", label: "Census" },
  { href: "/methodology", label: "Methodology" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-bold text-text">
              {BRAND.name}
            </Link>
            <nav aria-label="Main" className="flex flex-wrap gap-4 text-sm text-muted">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-text">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">{children}</main>

        <footer className="mt-16 border-t border-line px-4 pt-4 pb-10 text-sm text-muted sm:px-6">
          <p className="max-w-prose">
            {BRAND.name} — a conformance census, not a score. Every rung on this
            site carries the evidence behind it.
          </p>
          <p className="mt-2 text-dead">
            <a href={`mailto:${BRAND.contactEmail}`} className="hover:text-muted">
              {BRAND.contactEmail}
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
