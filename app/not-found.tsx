import { TextLink } from "@/components/TextLink";

// This sits at the app root, so it answers every unmatched route — not just
// a missing agent. Agent-specific copy lives at
// app/agent/[chain]/[id]/not-found.tsx instead.
export default function NotFound() {
  return (
    <div className="max-w-prose border-l-2 border-edge pl-6">
      <h1 className="headline text-3xl text-text">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        There is nothing at that address.
      </p>
      <TextLink href="/" tone="bright" className="mt-5 inline-block font-mono text-xs uppercase tracking-[0.1em]">
        ← Back to the census
      </TextLink>
    </div>
  );
}
