# ledgerscope-web

The Ledgerscope frontend: a Next.js App Router site that renders an ERC-8004
conformance census. Every agent gets seven rungs — `registered`,
`resolvable`, `parseable`, `conformant`, `bound`, `live`, `independent` —
each `pass` / `fail` / `skipped` / `error`, with structured evidence. **There
is no score, grade, tier, or ranking anywhere in this product.** That is the
whole differentiation from every competitor that compresses an agent to a
single 0–100 number, and this UI must never smuggle one back in — no "N of 7
passed", no per-agent percentage, no sort by how many rungs passed.

This repo reads **only** the Rust JSON API. It holds no database
credentials and derives no verdicts of its own: a rung's status word always
comes from the API, verbatim — this app chooses layout and colour, never
wording.

## Running it

The API must be up first, or every page shows the upstream-unreachable panel.
See the Ledgerscope repo's own README for how to start it — it needs its own
`DATABASE_URL`, which is that repo's concern, not this one's.

```sh
# in the Ledgerscope repo
cargo run -p api        # http://localhost:8080

# here
cp .env.example .env.local
pnpm install
pnpm dev                # http://localhost:3000
```

## Layout

| Path | What |
|------|------|
| `lib/api/` | Zod schemas, the fetch client, and one function per endpoint. |
| `lib/paging.ts` | Page-number ↔ offset maths. |
| `lib/status.ts` | Status → colour class mapping. The status *word* is never chosen here — only its colour. |
| `app/` | Routes. Every page is a Server Component (the one exception, `app/error.tsx`, is required by Next for error boundaries). |
| `components/` | Presentational pieces only. |
| `scripts/check-api.ts` | Validates every endpoint against a live API. |

## The pages

- **`/`** — the directory. Identity is `Agent #{id} · {chain} · {owner}`,
  never the URI (which is frequently a multi-kilobyte base64 blob or an
  empty string). Each row shows all seven rung statuses as small chips, and
  the list can be filtered by rung + status.
- **`/agent/[chain]/[id]`** — the ladder vertically, one rung per section,
  each with its status and its evidence rendered in full (not summarised),
  plus the archive summary and the agent's on-chain snapshot.
- **`/stats`** — leads with population base rates per rung, then the run's
  provenance (pinned block, `checker_commit`, `spec_commit`).
- **`/methodology`** — prose plus the live `spec_commit` and rung-4
  required-field list, both read from the API rather than duplicated here.

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

**No claim wording lives here.** Every status word rendered is the string
the API sent for that rung. Where a filter or a colour mapping needs to
switch on a status value, it does so against the API's own vocabulary —
never against an invented synonym, and never producing a sentence like "N of
7 passed".
