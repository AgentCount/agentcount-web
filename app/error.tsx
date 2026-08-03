"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";

/**
 * The one client component this app did not choose — Next requires it for
 * error boundaries. It used to branch on `error.message` to tell "the API is
 * unreachable" apart from "the API answered in a shape we do not
 * understand" (see lib/api/client.ts, which still distinguishes
 * UpstreamError from ContractError for exactly that reason). Do not
 * reintroduce that branch: in a production build, Next redacts the message
 * and name of any error thrown during Server Components rendering before it
 * reaches the client — this component only ever sees a generic placeholder.
 * A test against that placeholder is always false in a real deployment, so
 * the branch would silently and confidently report "API is unreachable" for
 * every failure, including genuine schema drift, which is the one case this
 * page most needs to not misreport. The two failure modes are still told
 * apart — just server-side, in the log line this component cannot see.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-prose border-l-2 border-fail/40 pl-6">
      <h1 className="numeral text-3xl text-text">This page could not be loaded</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The site did not get an answer it could use from the {BRAND.name} API —
        either the API is down, or it answered in a shape this site does not
        recognise. The server log says which.
      </p>
      {/* A dead end with no door was the review's note on this panel. `reset`
          re-renders the failed segment, which is the right first move for a
          transient API hiccup; the home link is for when it is not. */}
      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={reset}
          className="border border-edge px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-text transition-colors hover:bg-raised"
        >
          Try again
        </button>
        <Link
          href="/"
          className="self-center font-mono text-xs uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text"
        >
          ← Back to the census
        </Link>
      </p>
      {error.digest && (
        <p className="mt-5 font-mono text-xs text-dead">Reference: {error.digest}</p>
      )}
    </div>
  );
}
