# ADR-0007: Bundle the MetaMask and Polkadot.js phishing lists

- Status: Accepted
- Date: 2026-10-14
- Amends: ADR-0002 (MVP shipped only our own list)

## Context
ADR-0002 shipped only our own curated blocklist, which has 1 entry today against an MVP target of ≥ 200. The license review in `docs/sources.md` found two crypto-focused lists that allow commercial use and redistribution:
- MetaMask eth-phishing-detect (DBAD 1.2), about 107k entries, updated many times a day and fed by SEAL.
- Polkadot.js phishing (Apache-2.0), about 55k entries.

## Decision
- `scripts/build-blocklist.mjs` (`npm run blocklist`) merges both into `extension/lists/blocklist-thirdparty.json`. It runs before every release.
- Our own `blocklist.json` stays separate. Indonesia-specific curation still goes there and remains our asset.
- The build skips three kinds of entry:
  - **Entries with a path** (`sites.google.com/view/...`): they flag one page, not the host.
  - **Our allowlist and official brand domains.**
  - **Majestic top-100k domains:** these are mostly shared hosts and dynamic-DNS bases (`alwaysdata.net`, `mooo.com`). Because matching is by suffix, one such entry would block every site under it.
- The background merges both lists into one `Set`. `inList` looks up each suffix of the host, so a check stays O(labels) with 160k entries.
- Attribution lives in `extension/CREDITS.md` and the store listing.

## Consequences
- **+** About 160k known crypto phishing domains blocked from day one.
- **+** Licenses allow it; obligations are attribution and keeping the Apache notice.
- **−** About 3.7 MB more package size, parsed once each time the service worker starts.
- **−** Lists age between releases. Signed remote updates (SPEC v0.2) fix this.
- **−** Their false positives become ours. Mitigations:
  - the popularity filter;
  - the allowlist always wins;
  - the appeal link on the block page;
  - a fast-track allowlist entry in the next release.
