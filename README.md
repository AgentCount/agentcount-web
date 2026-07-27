# ledgerscope-web

The Ledgerscope frontend: a Next.js App Router site that renders agent facts
and flags. It reads **only** the Rust JSON API — this repo holds no database
credentials and derives no claims of its own. Every sentence about an agent
comes from the API's `display` fields, so the site and the API can never word
the same fact differently.

## Running it

The API must be up first, or every page shows the upstream-unreachable panel:

```sh
# in the Ledgerscope repo
export DATABASE_URL=postgres://postgres:dev@localhost:5432/ledgerscope
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
