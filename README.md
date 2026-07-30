# agentcount-web

The AgentCount frontend: a Next.js App Router site that renders an ERC-8004
conformance census. Every agent gets seven rungs — `registered`,
`resolvable`, `parseable`, `conformant`, `bound`, `live`, `attested`
(renamed from `independent` 2026-07-29) — each `pass` / `fail` / `skipped` /
`error`, and — `bound` only, added 2026-07-29 — `unclaimed`, with structured
evidence. **There is no score, grade, tier, or ranking anywhere in this
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
| `app/` | Routes. Every page is a Server Component (the one exception, `app/error.tsx`, is required by Next for error boundaries). |
| `components/` | Presentational pieces only. |
| `scripts/check-api.ts` | Validates every endpoint against a live API. |

## The pages

- **`/`** — the homepage: what this run found, as four numbers, each with the
  population behind it. Every figure comes from
  `GET /api/runs/{id}/findings` or `/api/methodology` — none is typed here,
  and none is derived here either (the API returns the percentage already
  computed, so this app formats rather than divides).
- **`/directory`** — every agent, searchable by name, description or owner
  prefix, and filterable on any combination of rung statuses. Identity is the
  document's own `name`, falling back to `Agent #{id}` only when there is
  none — never the URI, which is frequently a multi-kilobyte base64 blob or an
  empty string. Filters live in the URL, so a filtered view is linkable.
- **`/working`** — the agents for which every rung this run actually ran came
  back `pass`. The same component as the directory with its facets fixed.
  Which rungs count is read from the run's own rates, so rung 6 is not
  required of anyone and joins automatically when it ships.
- **`/agent/[chain]/[id]`** — the permalink. The ladder vertically, one rung
  per section, each with its status and its evidence rendered in full (not
  summarised), plus the archive summary, the on-chain snapshot, and the run's
  full provenance. Rendered on demand with ISR — 60k pages cannot be built at
  deploy time — with a per-agent OG image so a shared link previews as a data
  card.
- **`/census`** — population base rates per rung, then the run's provenance
  (pinned block, `checker_commit`, `spec_commit`). Was `/stats`; that path
  now 308s here.
- **`/methodology`** — a five-bullet summary, then the long-form detail, plus
  the live `spec_commit` and rung-4 MUST/SHOULD/MAY lists, all read from the
  API rather than duplicated here.

## Accessibility

Rung badges encode status in **three** channels: the rung number, a glyph
(`✓ ✗ ! – ○ ·`), and colour. Colour alone excluded red-green colourblind
readers — roughly 8% of men — from the densest information on the site, and
`pass`/`fail` were the two statuses rendered most similarly. Every badge also
carries a `title` and `aria-label` spelling the status out in words, and a
status legend appears on every page that shows a badge or a bar.

A rung with **no row** for a given agent was never reached this run (a
short-circuited pipeline, or — currently — rung 6, not yet implemented). The
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
