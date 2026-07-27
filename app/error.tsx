"use client";

/**
 * The only client component in this app — Next requires it for error
 * boundaries. It renders no data; it only names which of the two failure modes
 * happened, because "the backend is down" and "the backend changed shape" need
 * different people to fix them.
 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  const isContract = error.message.includes("shape this app does not understand");

  return (
    <div className="rounded-xl bg-panel p-8">
      <h1 className="text-xl font-bold">
        {isContract ? "This page and the API disagree" : "The API is unreachable"}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        {isContract
          ? "The API answered, but in a shape this site does not recognise — usually a schema here that has fallen behind the Rust crate. The details are in the server log."
          : "Nothing could be loaded from the Ledgerscope API. If you are running locally, start it with `cargo run -p api`."}
      </p>
      {error.digest && (
        <p className="mt-4 text-sm text-dead">Reference: {error.digest}</p>
      )}
    </div>
  );
}
