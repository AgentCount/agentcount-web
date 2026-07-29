import { permanentRedirect } from "next/navigation";

/**
 * `/stats` was the page's address while the nav called it "Stats" and the
 * heading called it "The census". The name is now "Census" everywhere, so this
 * route exists only to keep every link that was ever shared working.
 *
 * A 308 rather than a rewrite: the page genuinely moved, and saying so lets a
 * search engine and a reader's history follow it instead of indexing the same
 * content at two addresses.
 */
export default function StatsRedirect() {
  permanentRedirect("/census");
}
