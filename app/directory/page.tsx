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
          checks shown side by side. There is no score here, on purpose — a
          check&rsquo;s status is exactly the word the checker recorded for it,
          never a tally. Tick several check filters to combine conditions, and
          share the URL: the filter is in it.
        </>
      }
    />
  );
}
