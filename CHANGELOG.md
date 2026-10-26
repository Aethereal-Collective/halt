# Changelog

## 0.1.1 (unreleased)

- Official sites of live DeFi protocols (3,667 domains from DefiLlama) are allowlisted, so legitimate protocols are no longer flagged as phishing. Dead, deprecated, and rugged projects are excluded, as are domains also on a phishing list.
- Phishing lists refreshed: 162,855 domains.

## 0.1.0

First public beta.

- Domain Shield: allowlist, curated blocklist plus ~160k domains from the MetaMask and Polkadot.js lists (ADR-0007), lookalike detection (edit distance with transpositions, `rn`/`vv` homoglyphs, punycode), brand keyword, local hostname model (ADR-0006).
- Transaction Guard (EVM): unlimited/limited approvals, `setApprovalForAll`, Permit2 `approve`, Permit/Permit2 signatures, zero-value Seaport listings, `eth_sign`. **Tolak** returns EIP-1193 error 4001.
- Warnings in Bahasa Indonesia or English (switch in the popup) with what to do next. Fully on-device: no server, no network calls.
- Popup with per-tab status and a report link; "report a mistake" link on the block page.
- Not a security guarantee: the in-page guard can be bypassed by a drainer that targets it (ADR-0003).
