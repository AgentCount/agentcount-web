import { AgentDirectory, type DirectorySearchParams } from "./AgentDirectory";

export const metadata = { title: "Directory" };
// A build must not depend on the API being reachable.
export const dynamic = "force-dynamic";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  return (
    <AgentDirectory
      searchParams={await searchParams}
      basePath="/directory"
      title="Directory"
      intro={
        <>
          Every agent registered under ERC-8004, with all seven conformance
          rungs shown side by side. There is no score here, on purpose — a
          rung&rsquo;s status is exactly the word the checker recorded for it,
          never a tally. Tick several rung filters to ask a question no other
          tool in the ecosystem can answer, and share the URL: the filter is in
          it.
        </>
      }
    />
  );
}
