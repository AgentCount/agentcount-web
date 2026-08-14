import type { Metadata } from "next";
import { CensusView } from "./CensusView";

// A build must not depend on the API being reachable: this page fetches live
// data, so statically prerendering it at build time fails the whole deploy if
// the API happens to be restarting.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Findings",
  description:
    "Every ERC-8004 agent on the swept chains, asked seven yes/no questions — evidence attached, no score.",
};

/**
 * Instrument 01's own address. The view itself lives in `CensusView` because
 * it also renders on `/` for legacy census deep links — see its module doc
 * for why those cannot redirect here.
 */
export default async function Census({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; chain?: string }>;
}) {
  return <CensusView sp={await searchParams} />;
}
