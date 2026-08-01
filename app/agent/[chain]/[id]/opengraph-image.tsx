import { ImageResponse } from "next/og";
import { getAgent, resolveRun } from "@/lib/api/endpoints";
import { brandFonts, COLOR, Masthead, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

/**
 * The link preview for one agent: the rung strip, the name, and the run date,
 * so a URL dropped in a chat renders as a data card rather than a bare link.
 *
 * `next/og` ships with Next — no new dependency for this.
 *
 * ## Everything here is ASCII, on purpose
 *
 * Satori (what `ImageResponse` renders with) bundles a Latin subset only. Any
 * character outside it triggers a *runtime download* from Google Fonts — which
 * fails, and takes the whole response down with it: the route returns an empty
 * reply, so the link preview breaks rather than degrading.
 *
 * Two things followed from that:
 *
 *   * The status GLYPHS from `lib/status.ts` (`✓ ✗ ○ –`) cannot be used here.
 *     Rather than substitute lookalike ASCII and quietly diverge from the site,
 *     each badge prints the status WORD in full. A preview is seen without the
 *     page's legend beside it, so spelling it out is better anyway.
 *   * Agent names must be sanitised. Emoji in a name are common in this
 *     registry (`🦞 Clawnch 🦞` is a real one) and would otherwise 500 the OG
 *     route for exactly those agents.
 *
 * ## Why the colours are literals
 *
 * Satori resolves no CSS variables and no Tailwind classes, so `lib/status.ts`'s
 * class names cannot be reused. `lib/og.tsx` holds a hand-copy of
 * `app/globals.css`'s `@theme` block, which must be kept in step with it by
 * hand, and which this card shares with the fixed pages' cards — along with
 * the masthead, so the two kinds of card cannot drift into looking like two
 * different products.
 */
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Conformance record: seven rungs, with the status of each";

function statusColor(status: string | undefined): string {
  switch (status) {
    case "pass":
      return COLOR.live;
    case "fail":
      return COLOR.fail;
    case "error":
      return COLOR.warn;
    case "skipped":
      return COLOR.dim;
    case "unclaimed":
      return COLOR.claim;
    default:
      return COLOR.muted;
  }
}

const LADDER_SIZE = 7;

/**
 * Keep only what Satori's bundled Latin subset can draw; anything else would
 * trigger a font download and break the response.
 *
 * Returns `null` when nothing printable survives — a name of pure emoji is not
 * rendered as an empty headline, it falls back to the agent id like any other
 * missing name.
 */
function toRenderableName(name: string | null): string | null {
  if (!name) return null;
  const cleaned = name
    .replace(/[^\p{Script=Latin}\p{Nd}\p{P}\p{Zs}+<>=^`|~$]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return null;
  // Satori has no `text-overflow`; a hard slice keeps a 200-character name from
  // pushing the rung strip off the canvas.
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}...` : cleaned;
}

export default async function Image({
  params,
}: {
  params: Promise<{ chain: string; id: string }>;
}) {
  // `params` is a Promise in Next 16 — reading it synchronously logs a warning
  // and yields undefined, which rendered an OG card titled "Agent #undefined".
  const { chain, id } = await params;

  // A bad id must still produce an image — a broken preview on a shared link is
  // worse than a plain one, so every failure below falls back rather than
  // throwing.
  const agent = /^\d+$/.test(id) ? await getAgent(chain, id).catch(() => null) : null;
  const run = agent ? await resolveRun(agent.run_id).catch(() => null) : null;
  const byRung = new Map((agent?.rungs ?? []).map((r) => [r.rung, r]));
  const name = toRenderableName(agent?.name ?? null) ?? `Agent #${id}`;
  const runDate = run?.finished_at ?? run?.started_at ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLOR.bg,
          color: COLOR.text,
          padding: 64,
          // No `fontFamily` here: only the masthead wordmark asks for the
          // Plex Mono that `brandFonts()` loads (see `lib/og.tsx`); the rest
          // of the card stays in Satori's default sans.
        }}
      >
        <Masthead />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              // Satori has no `text-overflow`; a hard slice keeps a 200-character
              // name from pushing the strip off the canvas.
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
          {/* One interpolation, not three text nodes: Satori throws on any
              element that has multiple children without `display: flex`, and
              `{chain} - id {id}` is three children. */}
          <div style={{ fontSize: 28, color: COLOR.dead, marginTop: 14 }}>
            {`${chain} - id ${id}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {Array.from({ length: LADDER_SIZE }, (_, i) => i + 1).map((n) => {
              const r = byRung.get(n);
              const color = r ? statusColor(r.status) : COLOR.dead;
              return (
                <div
                  key={n}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    width: 132,
                    height: 108,
                    borderRadius: 2,
                    border: `3px ${r ? "solid" : "dashed"} ${color}`,
                    background: COLOR.panel,
                    color,
                  }}
                >
                  <span style={{ fontSize: 40, fontWeight: 700 }}>{n}</span>
                  {/* The word, not a glyph — see the module doc. A preview is
                      read without the site's legend next to it. */}
                  <span style={{ fontSize: 19 }}>{r ? r.status : "not checked"}</span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 28,
              paddingTop: 20,
              borderTop: `1px solid ${COLOR.edge}`,
              fontSize: 24,
              color: COLOR.muted,
            }}
          >
            <span>rungs 1-7 / no score</span>
            <span>{runDate ? runDate.slice(0, 10) : "no completed run"}</span>
          </div>
        </div>
      </div>
    ),
    // The fonts are what let the masthead's wordmark render in the site's
    // mono — the tally + wordmark corner that makes a shared card
    // attributable even when cropped to its top edge.
    { ...size, fonts: await brandFonts() },
  );
}
