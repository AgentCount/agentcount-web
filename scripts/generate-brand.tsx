/**
 * Generate every checked-in brand asset from `lib/tally.ts`.
 *
 *   npm run brand
 *
 * ## Why a script at all
 *
 * The favicons, touch icons and social exports are binary files in the repo,
 * and binary files rot: someone edits the mark, the SVGs update, and the PNGs
 * silently keep the old shape. This script is the single producer of all of
 * them — change the geometry in `lib/tally.ts` (or a colour in `lib/og.tsx`),
 * re-run it, and every asset is regenerated from source. No image editor is
 * ever involved, so there is nothing to reproduce by hand.
 *
 * ## Why it renders through `next/og`
 *
 * The PNGs need a rasteriser and the banner needs type. `ImageResponse` ships
 * with Next (Satori + resvg), already knows how to draw the site's IBM Plex
 * Mono via `brandFonts()`, and is exactly what renders the live OG cards — so
 * the exported banner and a shared link card are produced by the same
 * pipeline and cannot drift apart. It also means zero new dependencies.
 *
 * ## What it writes
 *
 *   app/icon.svg                    SVG favicon (Next file convention),
 *                                    theme-aware — see `tallyFaviconSvg`
 *   app/favicon.ico                 16 + 32, PNG-encoded ICO
 *   app/apple-icon.png              180x180 touch icon
 *   public/icon-512.png             maskable icon for site.webmanifest
 *   public/brand/logo.svg           the mark, transparent
 *   public/brand/logo-wordmark.svg  mark + wordmark, transparent
 *   public/brand/avatar-400.png     profile avatar, circle-crop safe
 *   public/brand/banner-1500x500.png  X/Twitter profile banner
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brandFonts, COLOR, MixedStrip, OG_TAGLINE } from "../lib/og";
import {
  TALLY_BARS,
  TALLY_CUT_WIDTH,
  TALLY_DIAGONAL,
  TALLY_STROKE_WIDTH,
  tallyDataUri,
  tallyFaviconSvg,
  tallySvg,
} from "../lib/tally";

const ROOT = process.cwd();

async function png(element: React.ReactElement, width: number, height: number) {
  const response = new ImageResponse(element, {
    width,
    height,
    fonts: await brandFonts(),
  });
  return Buffer.from(await response.arrayBuffer());
}

/**
 * The mark on a solid tile, as the icon PNGs want it. `padding` is in the
 * mark's own 48-unit space, so the proportions are pixel-size independent:
 * the same call at 16 and at 512 crops identically.
 */
function tile(size: number, padding: number) {
  return png(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tallyDataUri({ background: COLOR.bg, padding })}
      width={size}
      height={size}
      alt=""
    />,
    size,
    size,
  );
}

/**
 * Pack PNGs into an ICO container. The format is a 6-byte header, one 16-byte
 * directory entry per image, then the image blobs — and since Vista the blobs
 * are allowed to be whole PNG files, which every current browser reads. Doing
 * these 22 bytes of bookkeeping by hand is what keeps `sharp`/`png-to-ico`
 * out of the dependency tree.
 */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries: Buffer[] = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width; 0 means 256
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

/**
 * Mark + wordmark on transparent. The text is a real `<text>` element with a
 * mono stack rather than outlined paths — outlining needs font tooling this
 * repo deliberately does not carry, and every serious embedding context
 * (README, docs site) has a monospace to fall back to. Bone-on-transparent
 * means this file is for dark surfaces; that is the brand's only surface.
 *
 * The mark half matches `lib/tally.ts`'s `tallySvg` exactly, by hand: bars in
 * `COLOR.text` (bone — not `COLOR.live`; see that module's doc for why the
 * brand mark stopped drawing in the status palette) with the diagonal's own
 * stroke masked out of them, the diagonal itself drawn on top in
 * `COLOR.accent`. This file is a plain
 * string, not one more consumer of `tallySvg` — its mark sits inside a
 * 340×64 wordmark canvas rather than tallySvg's own square one, offset by
 * `shift` to sit on the baseline the text wants — so the geometry is
 * reproduced at the offset rather than composed from the square export.
 *
 * `font-family` names JetBrains Mono first, matching the swap in
 * `app/layout.tsx`/`app/globals.css`, with the same fallback stack as
 * before. This is a static SVG a browser renders with whatever monospace it
 * actually has installed — it does not go through `next/og`/Satori like the
 * OG cards and `Banner()` below do, so unlike those it needs no font file
 * bundled to pick up the new name; system JetBrains Mono is used where
 * present, and the stack falls back exactly as it always has where it isn't.
 */
function wordmarkSvg(): string {
  const shift = 8;
  const [dx1, dy1, dx2, dy2] = TALLY_DIAGONAL;
  const bars = TALLY_BARS.map(
    ([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1 + shift}" x2="${x2}" y2="${y2 + shift}"/>`,
  ).join("");
  const maskId = "wordmark-tally-cut";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="64" viewBox="0 0 340 64" fill="none">` +
    `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="340" height="64">` +
    `<rect x="0" y="0" width="340" height="64" fill="#fff"/>` +
    `<line x1="${dx1}" y1="${dy1 + shift}" x2="${dx2}" y2="${dy2 + shift}" stroke="#000" stroke-width="${TALLY_CUT_WIDTH}" stroke-linecap="round"/>` +
    `</mask>` +
    `<g stroke="${COLOR.text}" stroke-width="${TALLY_STROKE_WIDTH}" stroke-linecap="round" mask="url(#${maskId})">${bars}</g>` +
    `<line x1="${dx1}" y1="${dy1 + shift}" x2="${dx2}" y2="${dy2 + shift}" stroke="${COLOR.accent}" stroke-width="${TALLY_STROKE_WIDTH}" stroke-linecap="round"/>` +
    `<text x="70" y="43" fill="${COLOR.text}" font-family="'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace" ` +
    `font-size="32" font-weight="600" letter-spacing="4">AGENTCOUNT</text></svg>`
  );
}

/**
 * The X/Twitter profile banner: lockup + tagline left, the mixed strip right.
 * Some clients crop the edges, so everything sits inside a centred 1350x420
 * safe zone — the 100px side padding and centred column guarantee it.
 */
function Banner() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: COLOR.bg,
        padding: "0 100px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tallyDataUri()} width={140} height={140} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 58,
              fontWeight: 700,
              letterSpacing: 8,
              color: COLOR.text,
            }}
          >
            AGENTCOUNT
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.4,
              marginTop: 14,
              color: COLOR.muted,
              maxWidth: 560,
            }}
          >
            {OG_TAGLINE}
          </div>
        </div>
      </div>
      <MixedStrip cell={56} />
    </div>
  );
}

async function main() {
  await mkdir(join(ROOT, "public/brand"), { recursive: true });

  const out: [string, Buffer | string][] = [
    // The favicon set. Padding 3 at tab sizes: air costs legibility there.
    // `app/icon.svg` is theme-aware (see `tallyFaviconSvg`'s doc); the ICO
    // and PNG tiles below cannot be — a rasterised image cannot switch on
    // `prefers-color-scheme` — so they stay the fixed dark-surface mark
    // every browser that does not read the SVG favicon falls back to.
    ["app/icon.svg", tallyFaviconSvg({ padding: 3 })],
    [
      "app/favicon.ico",
      ico([
        { size: 16, data: await tile(16, 3) },
        { size: 32, data: await tile(32, 3) },
      ]),
    ],
    ["app/apple-icon.png", await tile(180, 6)],
    // Maskable: platforms crop to a circle of 40% of the edge. Padding 14
    // keeps the strokes' bounding circle at ~191px of the permitted 205.
    ["public/icon-512.png", await tile(512, 14)],

    // The social exports.
    ["public/brand/logo.svg", tallySvg()],
    ["public/brand/logo-wordmark.svg", wordmarkSvg()],
    // Same inset as the maskable icon, for the same reason: X's avatar
    // circle-crops, and the strokes must clear the circle with room over.
    ["public/brand/avatar-400.png", await tile(400, 14)],
    ["public/brand/banner-1500x500.png", await png(<Banner />, 1500, 500)],
  ];

  for (const [path, data] of out) {
    await writeFile(join(ROOT, path), data);
    const bytes = typeof data === "string" ? Buffer.byteLength(data) : data.length;
    console.log(`${path}  (${bytes} bytes)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
