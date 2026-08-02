# agentcount-web

The AgentCount frontend: a Next.js App Router site that renders an ERC-8004
conformance census. Every agent gets seven rungs — `registered`,
`resolvable`, `parseable`, `conformant`, `bound`, `live`, `attested`
(renamed from `independent` 2026-07-29) — each `pass` / `fail` / `skipped` /
`error`, plus two rung-specific statuses: `unclaimed` (`bound` only, added
2026-07-29) and `unprobeable` (`live` only, added 2026-08-01), with
structured evidence. **There is no score, grade, tier, or ranking anywhere in this
product.** That is the
whole differentiation from every competitor that compresses an agent to a
single 0–100 number, and this UI must never smuggle one back in — no "N of 7
passed", no per-agent percentage, no sort by how many rungs passed.

This repo reads **only** the Rust JSON API. It holds no database
credentials and derives no verdicts of its own: a rung's status word always
comes from the API, verbatim — this app chooses layout and colour, never
wording.

## Running it

The API must be up first, or every page shows the upstream-unreachable panel.
See the [AgentCount](https://github.com/AgentCount/agentcount) repo's own
README for how to start it — it needs its own `DATABASE_URL`, which is that
repo's concern, not this one's.

```sh
# in the AgentCount repo
cargo run -p api        # http://localhost:8080

# here
cp .env.example .env.local
pnpm install
pnpm dev                # http://localhost:3000
```

## Layout

| Path | What |
|------|------|
| `lib/brand.ts` | **The product name, domain and contact address — in one place.** The 2026-07-30 rename to AgentCount was a one-line change here, which is what it was built for. |
| `lib/api/` | Zod schemas, the fetch client, and one function per endpoint. |
| `lib/paging.ts` | Page-number ↔ offset maths. |
| `lib/status.ts` | Status → colour, glyph, and spelled-out label. The status *word* is never chosen here — only how it is drawn. |
| `app/` | Routes. Every page is a Server Component. The two client files, `app/error.tsx` (required by Next for error boundaries) and `app/preflight/PreflightForm.tsx`, are not pages. |
| `components/` | Presentational pieces only. |
| `scripts/check-api.ts` | Validates every endpoint against a live API. |

## The pages

| Route | What |
|------|------|
| `/` | The homepage: this run's findings, the per-check base rates, and the run's provenance. Every figure comes from the API already computed. |
| `/directory` | Every agent, searchable by name, description or owner prefix, filterable on any combination of check statuses. Filters live in the URL, so a filtered view is linkable. |
| `/agent/[chain]/[id]` | The permalink: every check with its status and its evidence in full, plus the on-chain snapshot and the run's provenance. Rendered on demand with ISR, with a per-agent OG image. |
| `/methodology` | What each check asks, plus the live `spec_commit` and the rung-4 MUST/SHOULD/MAY lists, read from the API rather than duplicated here. |
| `/reports` | The report index. Static — the list is a hand-maintained registry. |
| `/reports/[slug]` | One dated report, prerendered from markdown in `content/reports/`. |
| `/reports/linkage` | The identity-to-payments join, as its own route. |
| `/data` | Every canonical run as a downloadable archive with its sha256. Static, so it works when the API is down. |
| `/preflight` | Paste a registration file and see what the checker says before it is minted. Nothing is stored. |
| `/neutrality` | Who pays for this, and what payment cannot buy. |
| `/subscribed` | Where the subscribe form lands. Not indexed. |
| `/healthz` | Health JSON that distinguishes "this site is broken" from "its backend is broken". |
| `/api/subscribe` | The subscribe form's POST target. It forwards to the census API server-side, so the API's address never reaches the browser. |

A `/coverage` page (every registry deployment counted, with the swept share)
is landing in an open PR.

Retired paths — `/census`, `/stats`, `/working`, `/linkage` — redirect
permanently; the full list lives in `next.config.ts`.

## Accessibility

Rung badges encode status in **three** channels: the rung number, a glyph
(`✓ ✗ ! – ○ ⌀ ·`), and colour. Colour alone excluded red-green colourblind
readers — roughly 8% of men — from the densest information on the site, and
`pass`/`fail` were the two statuses rendered most similarly. Every badge also
carries a `title` and `aria-label` spelling the status out in words, and a
status legend appears on every page that shows a badge or a bar.

A rung with **no row** for a given agent was never reached this run (a
short-circuited pipeline, or a run swept before rung 6 shipped on
2026-08-01). The
UI renders that as "not checked", visibly distinct from `skipped`: "not
checked" and "we couldn't ask" are different claims, and neither is invented
here — the API's own absence of a row is the fact being rendered.

## Contract with the API

`lib/api/schemas.ts` mirrors the serde structs in the Rust `api` crate. That
is duplication of the wire *shape* — deliberate, and different from
duplicating *derivation*: a shape mismatch fails loudly on the first request
and names the field, whereas a duplicated derivation renders a page that
quietly contradicts the API. Evidence is deliberately left as a loose
`Record<string, unknown>`: its keys differ per rung and per status, and this
app renders it generically (key/value), so it never needs to narrow the
type.

Run `pnpm check:api` against a live API after any change to `crates/api`. It
is the only thing that catches a drift between the two repos.

**Fixtures are captured, not hand-written.** Everything in `test/fixtures/`
except `runs.json` is the literal body of a real request. This is not
fastidiousness: the fixtures used to be maintained by hand, and when rung 4
was split by RFC 2119 severity the API stopped sending
`rung4_required_fields` while the fixture kept it — so the schema suite went
on passing while `/methodology` threw a `ContractError` on every real load. A
fixture that is not refreshed from the thing it models tests only itself.
`runs.json` stays hand-written because it carries an in-flight run and a run
with a null `pinned_block`, shapes the live API has no current example of.

**No claim wording lives here.** Every status word rendered is the string
the API sent for that rung. Where a filter or a colour mapping needs to
switch on a status value, it does so against the API's own vocabulary —
never against an invented synonym, and never producing a sentence like "N of
7 passed".
