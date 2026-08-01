import { NextResponse } from "next/server";

/**
 * The form's POST target, and a deliberate extra hop.
 *
 * The browser posts here, on this origin; this handler calls the census API
 * server-side. It would be simpler to point the form straight at the API, and
 * that is exactly what must not happen: `.env.example` says
 * `AGENTCOUNT_API_URL` is server-side only because the browser must not learn
 * the backend's address, and a `<form action>` is the most public place a URL
 * can be. One indirection keeps that promise.
 *
 * It also means the API's write endpoint is not reachable from a page anyone
 * can host, which a `fetch` from someone else's site would otherwise be.
 *
 * ## Why a route handler and not a server action
 *
 * A server action needs JavaScript. This is a plain HTML form, and it works
 * with scripting off — which seems the least a page can offer an audience
 * whose whole reason for being here is checking things. The response is a 303
 * to a real page, so the back button behaves and a refresh does not resubmit.
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const source = String(form.get("source") ?? "");
  const website = String(form.get("website") ?? "");

  const url = process.env.AGENTCOUNT_API_URL;
  if (!url) {
    // Misconfiguration, not the submitter's problem — say so honestly rather
    // than showing them a success page for a request that went nowhere.
    return redirectTo(request, "/subscribed?state=error");
  }

  let status: number;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/subscribe`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        // Forwarded so the API's rate limiter keys on the person, not on this
        // server — without it every submission would appear to come from one
        // address and the limiter would throttle the whole site after five.
        // The API reads the RIGHTMOST entry, so appending is correct.
        ...forwardedFor(request),
      },
      body: new URLSearchParams({ email, source, website }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    status = res.status;
  } catch {
    return redirectTo(request, "/subscribed?state=error");
  }

  if (status === 400) return redirectTo(request, "/subscribed?state=invalid");
  if (status === 429) return redirectTo(request, "/subscribed?state=throttled");
  if (status >= 500) return redirectTo(request, "/subscribed?state=error");
  return redirectTo(request, "/subscribed");
}

/** Preserve the caller's address for the API's rate limiter. */
function forwardedFor(request: Request): Record<string, string> {
  const existing = request.headers.get("x-forwarded-for");
  return existing ? { "x-forwarded-for": existing } : {};
}

/**
 * 303, not 302: it turns the POST into a GET, so the confirmation page can be
 * refreshed and bookmarked without resubmitting the form.
 */
function redirectTo(request: Request, path: string): Response {
  return NextResponse.redirect(new URL(path, request.url), 303);
}
