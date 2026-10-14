# Changelog

## 0.1.0 (unreleased)

First public beta.

- Domain Shield: allowlist, curated blocklist plus ~160k domains from the MetaMask and Polkadot.js lists (ADR-0007), lookalike detection (edit distance with transpositions, `rn`/`vv` homoglyphs, punycode), brand keyword, local hostname model (ADR-0006).
- Transaction Guard (EVM): unlimited/limited approvals, `setApprovalForAll`, Permit2 `approve`, Permit/Permit2 signatures, zero-value Seaport listings, `eth_sign`. **Tolak** returns EIP-1193 error 4001.
- Warnings in Bahasa Indonesia with an optional Claude explanation through the Aethereal API.
- Popup with per-tab status and a report link; "report a mistake" link on the block page.
- Not a security guarantee: the in-page guard can be bypassed by a drainer that targets it (ADR-0003).
