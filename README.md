# ledgerscope-web

The Ledgerscope frontend: a Next.js App Router site that renders agent facts
and flags. It reads **only** the Rust JSON API — this repo holds no database
credentials and derives no claims of its own. Every sentence about an agent
comes from the API's `display` fields, so the site and the API can never word
the same fact differently.

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
| `app/` | Routes. Every page is a Server Component. |
| `components/` | Presentational pieces only. |
| `scripts/check-api.ts` | Validates every endpoint against a live API. |

## Contract with the API

`lib/api/schemas.ts` mirrors the serde structs in the Rust `api` crate. That is
duplication of the wire *shape* — deliberate, and different from duplicating
*derivation*: a shape mismatch fails loudly on the first request and names the
field, whereas a duplicated derivation renders a page that quietly contradicts
the API.

Run `pnpm check:api` against a live API after any change to `crates/api`. It is
the only thing that catches a drift between the two repos.

**No claim wording lives here.** Every sentence about an agent, fact, or flag
comes from an API `display` field, and the measurement windows come from
`/api/methodology`. If something needs words the API does not provide, that is
a gap to fix in the `facts` crate — not a string to write in this repo.
