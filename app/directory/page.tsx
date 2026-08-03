import { AgentDirectory, type DirectorySearchParams } from "./AgentDirectory";

export const metadata = { title: "Agents" };
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
      title="Agents"
      intro={
        <>
          Every agent this census has read, with all seven checks shown side
          by side. Search by name, description or owner address, and tick
          check filters to combine conditions — the filter lives in the URL,
          so a filtered view is a link you can send.
        </>
      }
    />
  );
}
