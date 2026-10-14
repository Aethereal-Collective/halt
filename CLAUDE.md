# Aethereal Shield

Browser extension (Chrome/Brave, MV3) that protects Indonesian crypto users from phishing sites and wallet drainers. Warnings are in Bahasa Indonesia. Runs fully on-device: no server, no AI service (ADR-0008).

Product of Aethereal (aethereal.top), a Jakarta tech company working on AI, data science, blockchain, and fintech. This is meant to be the company's flagship product.

## Read first
- `docs/SPEC.md`: product spec, architecture, privacy table, threat model
- `docs/MVP.md`: 6-week plan, acceptance criteria, launch checklist
- `docs/adr/`: decisions; follow them or write a new ADR to change one

## Conventions
- Plain ES modules, no build step, no framework (ADR-0001).
- Logic lives in pure functions in `extension/src/lib/` and must have tests in `test/` (`npm test`, built-in `node --test`).
- `content.js` is a classic script (no imports); UI copy lives there in Bahasa Indonesia, second person "kamu".
- User-facing text: Bahasa Indonesia. Code, comments, and docs: English.
- The extension makes no network requests (ADR-0005, ADR-0008); `test/privacy.test.js` enforces it.
- Blocklist sources: our own curation plus MetaMask + Polkadot.js (ADR-0007); check the license before ingesting any third-party list (ScamSniffer DB is GPL-3.0; see `docs/sources.md`) (ADR-0002).

## Known limitation
The in-page EIP-1193 wrapper is advisory and bypassable by a targeted drainer (ADR-0003). Don't claim it guarantees safety.

## Status (2026-10-14)
- Done:
  - Core logic + 19 unit tests (43 typosquats, false-positive regressions, model).
  - Real-Chrome E2E (`npm run e2e`, 23 checks): acceptance criteria 1–6 pass with a mock wallet.
  - Local hostname model (ADR-0006), trained on licensed lists (`docs/sources.md`).
  - ~160k-domain MetaMask + Polkadot.js blocklist bundled (ADR-0007); own curated list still 1 placeholder.
  - AI explanation and Worker removed (ADR-0008); icons; privacy policy draft; store listing; release script; CI.
- Not done:
  - Not tested with a real wallet (MetaMask, Rabby, OKX, Phantom): use `test/dapp/`.
  - Own Indonesia-specific curation (`blocklist.json`) not started.
  - Copy not reviewed by non-technical users; privacy policy contact + review.
- Next: real-wallet matrix, blocklist curation, CWS submission.
