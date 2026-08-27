import { UNTRUSTED_REL } from "@/lib/links";
import { withArrowNudge } from "./ArrowNudge";

/**
 * Every link that leaves this site goes through here, so the `rel` rules are
 * applied in one place rather than remembered at each call site.
 *
 * `untrusted` marks a link to agent-supplied content — a `tokenURI`, a
 * `final_url`, anything a third party put on-chain. Those get
 * `nofollow ugc` on top of `noopener noreferrer`: this census indexes 60,097
 * unvetted documents and must not pass ranking signal to any of them. Links we
 * chose ourselves (block explorers) get `noopener noreferrer` only.
 *
 * Styled as a dotted underline rather than a colour, because colour on this
 * site means a rung status and nothing else.
 *
 * A trailing " →" in the label nudges on hover, via `withArrowNudge`
 * (`ArrowNudge.tsx`) — the same shared device as `TextLink`/`CtaLink`.
 */
export function OutboundLink({
  href,
  untrusted = false,
  title,
  className = "",
  children,
}: {
  href: string;
  untrusted?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel={untrusted ? UNTRUSTED_REL : "noopener noreferrer"}
      className={`group underline decoration-dotted decoration-edge underline-offset-[3px] transition-colors hover:text-text hover:decoration-muted ${className}`}
    >
      {withArrowNudge(children)}
    </a>
  );
}
