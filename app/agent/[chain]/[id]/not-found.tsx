import { TextLink } from "@/components/TextLink";

export default function NotFound() {
  return (
    <div className="max-w-prose border-l-2 border-edge pl-6">
      <h1 className="numeral text-3xl text-text">No such agent</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Nothing is registered under that chain and id — or it has not been
        indexed yet.
      </p>
      <TextLink href="/directory" className="mt-5 inline-block font-mono text-xs uppercase tracking-[0.1em]">
        ← Search the directory
      </TextLink>
    </div>
  );
}
