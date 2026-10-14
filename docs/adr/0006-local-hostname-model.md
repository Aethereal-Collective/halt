# ADR-0006: Local hostname model as an extra Domain Shield signal

- Status: Accepted
- Date: 2026-10-14

## Context
The curated blocklist is small at launch (ADR-0002) and lookalike rules only catch near-copies of protected brand names. Many drainer domains look like `claim-airdrop-pepe.xyz` or `metamask-wallet-restore.com`: no typo, just a recognizable pattern. Public phishing datasets with permissive licenses exist (see `docs/sources.md`).

Constraints: no build step (ADR-0001), no browsing data off the device (ADR-0005), and false positives must stay rare (SPEC §9 target: under 5 per 1,000 warnings).

## Decision
- Logistic regression over hashed character 3–5-grams plus a few shape features of the hostname (`extension/src/lib/model.js`). Trained offline with `scripts/train.mjs`; weights ship as `extension/lists/model.json` (int8, ~86 KB). Inference is local and pure.
- Score the **base domain** only (`stake.lido.fi` → `lido.fi`). The benign data (Majestic) holds registrable domains only, so scoring full hosts made every subdomain look like phishing.
- The threshold is set on a validation split so at most 0.1% of held-out benign domains score above it.
- Effect on verdicts:
  - Model alone → **warn** (badge only).
  - Model **and** a brand keyword (`metamask-wallet-restore.com`) → **danger**.
  - Allowlist always wins.

## Consequences
- **+** Catches pattern-based drainer domains with no list entry. First model: 37% recall at 0.1% FPR on a held-out test split (99% precision), measured on base domains.
- **+** Fully local; nothing about the visited site leaves the device.
- **−** Recall is modest; this is a supplement to the blocklist, not a replacement.
- **−** Phishing on shared hosting (`x.pages.dev`) reduces to a benign base domain and is invisible to the model; the brand-keyword rule still covers subdomains that name a brand.
- **−** Majestic is popularity-biased. Small legitimate sites can score higher than popular ones; retrain and re-check `test/model.test.js` whenever data changes.
- Retrain: `node scripts/fetch-data.mjs && node scripts/train.mjs`, then `npm test`.
