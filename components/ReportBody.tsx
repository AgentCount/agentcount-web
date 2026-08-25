import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { OutboundLink } from "@/components/OutboundLink";
import { resolveReportLink } from "@/lib/reports";

/**
 * A census report, rendered in the site's own idiom.
 *
 * ## Why every element is mapped by hand
 *
 * The obvious approach is a typography plugin, which would style the markdown
 * as generic prose: serif-ish measure, blue links, zebra tables. This site has
 * a deliberate visual grammar — colour reserved for measurement, mono for
 * anything the chain or the checker produced, hairlines instead of boxes — and
 * a report is the densest thing on it. Dropping in a second, unrelated set of
 * type styles would make the most-cited page the one that looks least like the
 * project.
 *
 * So each element maps to the classes the rest of the app already uses. The
 * mapping is the whole component; there is no logic in it beyond link
 * rewriting.
 *
 * ## Tables are the report
 *
 * Nearly every finding is a table, several are eight columns wide, and this
 * page is read on phones. Each one therefore scrolls inside its own container
 * rather than being allowed to widen the document — a table that pushes the
 * body horizontally makes the prose unreadable to fix a problem the table
 * already had.
 *
 * Numeric columns come through with `align: "right"` from GFM's `---:` syntax,
 * which is why the alignment below is read from the node rather than guessed
 * at per column.
 */
export function ReportBody({
  markdown,
  sourcePath,
}: {
  markdown: string;
  /** The report's path in the core repo, for resolving its relative links. */
  sourcePath: string;
}) {
  return (
    <div className="report">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // The markdown's own `h1` is dropped by the page before this runs —
          // see `app/reports/[slug]/page.tsx`. `h2` is therefore the top level
          // here, and is set as a section rule to match `components/Section`.
          h2: ({ children }) => (
            <h2 className="numeral mt-16 border-t border-edge pt-6 text-[clamp(1.4rem,2.4vw,1.85rem)] text-text">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="numeral mt-10 text-lg text-text">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="label mt-8 text-text">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-medium text-text">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-text">{children}</em>,
          // Every link in a report points into the core repository, because
          // that is where reports are written. `untrusted` is deliberately NOT
          // set: unlike an agent's declared URL, these are ours.
          a: ({ href, children }) => (
            <OutboundLink href={resolveReportLink(href ?? "", sourcePath)}>
              {children}
            </OutboundLink>
          ),
          ul: ({ children }) => (
            <ul className="mt-5 max-w-prose space-y-3 text-[0.9375rem] leading-relaxed text-muted">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-5 max-w-prose list-decimal space-y-3 pl-6 text-[0.9375rem] leading-relaxed text-muted">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            // A hairline marker rather than a bullet glyph, matching the rest
            // of the site's rules-not-shapes treatment. `marker:` would style
            // a real bullet; this uses a border so nested content still aligns.
            <li className="border-l-2 border-edge pl-4">{children}</li>
          ),
          // Blockquotes carry this report's headline claims — the two facts in
          // the summary, the "no published number becomes wrong" note. They are
          // set as pull quotes in full-strength text, not as quieter asides.
          blockquote: ({ children }) => (
            <blockquote className="mt-8 max-w-prose border-l-2 border-muted bg-panel px-6 py-1 text-[1.0625rem] leading-relaxed text-text">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            // react-markdown gives fenced blocks a `language-*` class and
            // inline spans none; only the inline case is styled here, because
            // the block case is wrapped by `pre` below.
            const inline = !className;
            return inline ? (
              <code className="break-all font-mono text-[0.85em] text-text">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="mt-6 max-w-prose overflow-x-auto border-l-2 border-edge bg-panel px-5 py-4 font-mono text-xs leading-relaxed text-muted">
              {children}
            </pre>
          ),
          hr: () => <hr className="mt-14 border-0 border-t border-line" />,
          table: ({ children }) => (
            <div className="mt-7 overflow-x-auto">
              <table className="w-full border-collapse text-left text-[0.8125rem]">
                {children}
              </table>
            </div>
          ),
          // `hover:bg-raised` row scan aid — same pattern as
          // `AgentTable.tsx` and every other data table site-wide, extended
          // here to whatever tables a report's markdown body happens to
          // contain, since react-markdown gives `tr` no styling of its own
          // to inherit. Scoped to `tbody`'s direct rows (`[&>tr]`) rather
          // than overriding `tr` itself, so the header row — which every
          // other table on the site also excludes from the hover — is not
          // included.
          tbody: ({ children }) => (
            <tbody className="[&>tr]:transition-colors [&>tr:hover]:bg-raised">
              {children}
            </tbody>
          ),
          th: ({ children, style }) => (
            <th
              scope="col"
              className="label whitespace-nowrap border-b border-edge px-3 py-2 font-normal"
              style={{ textAlign: style?.textAlign }}
            >
              {children}
            </th>
          ),
          td: ({ children, style }) => (
            <td
              className="border-b border-line px-3 py-2 font-mono text-muted"
              style={{ textAlign: style?.textAlign }}
            >
              {children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
