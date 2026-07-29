import Link from "next/link";

// This sits at the app root, so it answers every unmatched route — not just
// a missing agent. Agent-specific copy lives at
// app/agent/[chain]/[id]/not-found.tsx instead.
export default function NotFound() {
  return (
    <div className="rounded-xl bg-panel p-8">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">
        There is nothing at that address.
      </p>
      <Link href="/" className="mt-4 inline-block text-accent hover:underline">
        ← Back to the census
      </Link>
    </div>
  );
}
