# Aethereal Shield

Browser extension (Chrome/Brave, MV3) that protects Indonesian crypto users from phishing sites and wallet drainers. Warnings are in Bahasa Indonesia, with an optional explanation from Claude.

Product of Aethereal (aethereal.top), a Jakarta tech company working on AI, data science, blockchain, and fintech. This is meant to be the company's flagship product and its concrete Claude use case (relevant for the Claude Startups application).

## Read first
- `docs/SPEC.md`: product spec, architecture, privacy table, threat model
- `docs/MVP.md`: 6-week plan, acceptance criteria, launch checklist
- `docs/adr/`: decisions; follow them or write a new ADR to change one

## Conventions
- Plain ES modules, no build step, no framework (ADR-0001).
- Logic lives in pure functions in `extension/src/lib/` and must have tests in `test/` (`npm test`, built-in `node --test`).
- `content.js` is a classic script (no imports); UI copy lives there in Bahasa Indonesia, second person "kamu".
- User-facing text: Bahasa Indonesia. Code, comments, and docs: English.
- Never send full URLs, page content, or user wallet addresses off the device (ADR-0005). Only flagged findings go to the Worker (ADR-0004).
- Blocklist sources: our own curation plus MetaMask + Polkadot.js (ADR-0007); check the license before ingesting any third-party list (ScamSniffer DB is GPL-3.0; see `docs/sources.md`) (ADR-0002).
- Worker model: `claude-opus-5-5`, effort `low`, structured output, server-side refusal fallback.

## Known limitation
The in-page EIP-1193 wrapper is advisory and bypassable by a targeted drainer (ADR-0003). Don't claim it guarantees safety.

## Status (2026-10-14)
- Done:
  - Core logic + 18 unit tests (43 typosquats, false-positive regressions, model).
  - Real-Chrome E2E (`npm run e2e`, 23 checks): acceptance criteria 1–6 pass with a mock wallet.
  - Local hostname model (ADR-0006), trained on licensed lists (`docs/sources.md`).
  - ~160k-domain MetaMask + Polkadot.js blocklist bundled (ADR-0007); own curated list still 1 placeholder.
  - Worker rate limit + KV cache; icons; privacy policy draft; store listing; release script; CI.
- Not done:
  - Not tested with a real wallet (MetaMask, Rabby, OKX, Phantom): use `test/dapp/`.
  - Worker not deployed; KV id, `ALLOWED_ORIGIN`, `ANTHROPIC_API_KEY` not set.
  - Own Indonesia-specific curation (`blocklist.json`) not started.
  - Copy not reviewed by non-technical users; privacy policy contact + review.
- Next: real-wallet matrix, Worker deploy, blocklist curation, CWS submission.
