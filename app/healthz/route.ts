import { pingApi } from "@/lib/api/endpoints";

export const dynamic = "force-dynamic";

/** Distinguishes "this site is broken" from "its backend is broken". */
export async function GET() {
  const upstream = await pingApi();
  return Response.json(
    { web: "ok", api: upstream ? "ok" : "unreachable" },
    { status: upstream ? 200 : 503 },
  );
}
