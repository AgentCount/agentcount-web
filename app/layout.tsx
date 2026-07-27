import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ledgerscope",
  description:
    "Independently verified facts about every agent registered under ERC-8004.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="flex items-center gap-6 border-b border-line px-6 py-4">
          <Link href="/" className="text-lg font-bold text-text">
            Ledgerscope
          </Link>
          <nav className="flex gap-4 text-muted">
            <Link href="/" className="hover:text-text">
              Explorer
            </Link>
            <Link href="/stats" className="hover:text-text">
              Stats
            </Link>
            <Link href="/methodology" className="hover:text-text">
              Methodology
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        <footer className="mx-auto mt-12 max-w-5xl border-t border-line px-6 pt-4 pb-8 text-sm text-muted">
          <p>
            Ledgerscope — measurements, not judgments. Every claim on this site
            carries the evidence behind it.
          </p>
        </footer>
      </body>
    </html>
  );
}
