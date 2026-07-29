"use client";

import { BRAND } from "@/lib/brand";

/**
 * The only client component in this app — Next requires it for error
 * boundaries. It used to branch on `error.message` to tell "the API is
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
export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="rounded-xl bg-panel p-8">
      <h1 className="text-xl font-bold">This page could not be loaded</h1>
      <p className="mt-2 max-w-2xl text-muted">
        The site did not get an answer it could use from the {BRAND.name} API —
        either the API is down, or it answered in a shape this site does not
        recognise. The server log says which.
      </p>
      {error.digest && (
        <p className="mt-4 text-sm text-dead">Reference: {error.digest}</p>
      )}
    </div>
  );
}
