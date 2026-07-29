import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl bg-panel p-8">
      <h1 className="text-xl font-bold">No such agent</h1>
      <p className="mt-2 text-muted">
        Nothing is registered under that chain and id — or it has not been
        indexed yet.
      </p>
      <Link href="/directory" className="mt-4 inline-block text-accent hover:underline">
        ← Search the directory
      </Link>
    </div>
  );
}
