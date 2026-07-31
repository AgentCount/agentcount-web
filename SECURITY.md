# Security policy

**Report privately to `probes@agentcount.ai`.** Please do not open a public
issue for a vulnerability.

This is the AgentCount frontend. The census, the API and the probe layer live
in [`AgentCount/agentcount`](https://github.com/AgentCount/agentcount); see
[its `SECURITY.md`](https://github.com/AgentCount/agentcount/blob/main/SECURITY.md)
for those.

## What is worth attacking here

**Everything an agent publishes is hostile input by construction.** Anyone can
register an ERC-8004 agent for the price of gas and put anything in its
document — name, description, endpoint URLs, wallet addresses. This app renders
all of it.

- **The URL scheme allowlist** (`lib/links.ts`). Agent-supplied URIs are
  rendered as links. `data:`, `javascript:`, `vbscript:`, `file:` and `blob:`
  are refused; third-party links carry
  `rel="noopener noreferrer nofollow ugc"`. A way past that allowlist — an
  encoded scheme, a protocol-relative URL, a redirect that changes scheme — is
  the highest-severity bug in this repo.
- **Injection through agent metadata.** Names and descriptions are rendered as
  text. Anything that gets them interpreted as markup, or into a dangerous
  attribute, is in scope. One agent in the live census is named
  `🦞 Clawnch 🦞`; assume worse is coming.
- **The OG image route** (`opengraph-image.tsx`). It renders agent-controlled
  strings server-side. It has already been crashed once by an emoji in a name.
- **Server-side secrets reaching the client.** `AGENTCOUNT_API_URL` is
  server-only. Anything that leaks it, or the API's responses beyond what a
  page shows, is in scope.

## Not vulnerabilities

- A rung result you disagree with — that belongs in the main repo's process.
- A published number you think is wrong — genuinely welcome, but open a public
  issue with the run id and agent id. This project has retracted its own
  findings before publication more than once.

## Disclosure

Coordinated. Tell us, give us a reasonable window, then publish whatever you
like — including that we were slow, if we were.
