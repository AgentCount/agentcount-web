import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Read a report's markdown off disk.
 *
 * Server-only, and separated from `lib/reports.ts` so that the registry — which
 * the index page, the cards and the sitemap all read — stays free of Node
 * built-ins and can be imported from anywhere.
 *
 * `next.config.ts` has to name `content/reports/**` in
 * `outputFileTracingIncludes`, or the deployed function ships without the
 * files: Next traces `fs` calls statically, and a path assembled at runtime is
 * invisible to it. The failure is a 500 on a route that works everywhere
 * locally, because locally the whole repo is on disk.
 */
export async function readReportMarkdown(file: string): Promise<string> {
  const path = join(process.cwd(), "content", "reports", `${file}.md`);
  return readFile(path, "utf8");
}

/**
 * Drop the markdown's leading `# ` heading.
 *
 * The page renders the title itself, from the registry, with the dateline and
 * the scope beside it. Leaving the file's own `h1` in place would put two
 * titles on the page — and they would be free to disagree, since one is edited
 * in the core repo and the other here.
 */
export function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^#\s+.*(\r?\n)+/, "");
}
