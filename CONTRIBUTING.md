# Contributing to agentcount-web

This is the frontend. The census itself — the checks, the schema, the
methodology — lives in
[`AgentCount/agentcount`](https://github.com/AgentCount/agentcount), and
[its `CONTRIBUTING.md`](https://github.com/AgentCount/agentcount/blob/main/CONTRIBUTING.md)
is the authority on anything that can move an agent's status.

Frontend changes are ordinary pull requests. Three rules are not.

## 1. No derivation here

**Every figure on every page comes from the API.** This repo formats numbers;
it does not compute them. If a page needs a percentage, the API returns the
percentage — this app does not divide.

The reason is not tidiness. A derivation duplicated here becomes a second,
silently disagreeing implementation of the ladder, and the disagreement
surfaces as a page that contradicts the API with no error anywhere. A wire
*shape* mismatch, by contrast, fails loudly on the first request and names the
field — which is why `lib/api/schemas.ts` mirroring the Rust structs is
deliberate and duplicating logic is not.

If you need a number that does not exist yet, add it to the API.

## 2. No aggregate, ever

No score, grade, tier or ranking. That includes "N of 7 rungs passed", a
per-agent percentage, and sorting the directory by how many rungs an agent
passed. A pull request adding one will be declined regardless of how it is
computed — this is the project's whole differentiation, not a design
preference.

## 3. The six states are six states

`pass`, `fail`, `skipped`, `error`, `unclaimed`, and **absent** (a rung with no
row, which is not the same as `skipped`) render distinctly and are never
collapsed into each other. "We did not ask", "we could not ask" and "the agent
failed" are three different claims.

Status **words** are never chosen here either — the word rendered is the string
the API sent.

## Agent-supplied input is hostile

Anyone can register an agent and put anything in its document. URLs go through
the scheme allowlist in `lib/links.ts` (`data:`, `javascript:`, `vbscript:`,
`file:`, `blob:` refused) and third-party links carry
`rel="noopener noreferrer nofollow ugc"`. Names and descriptions are rendered
as text, never as markup. A change that widens any of this needs to say why.

## Accessibility

Rung status is encoded in three channels — the rung number, a glyph, and
colour — because colour alone excluded roughly 8% of men from the densest
information on the site. Do not remove the glyph.

## Before you push

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build          # must succeed with no API reachable
npm run check:api      # against a live API, after any crates/api change
```

`check:api` is the only thing that catches drift between this repo and the API.
Run it when either side changes.

## CLA and conduct

Pull requests require the CLA, handled by CLA Assistant on your first one — see
[`CLA.md`](https://github.com/AgentCount/agentcount/blob/main/CLA.md).
[Contributor Covenant](CODE_OF_CONDUCT.md) applies; reports to
`probes@agentcount.ai`.
