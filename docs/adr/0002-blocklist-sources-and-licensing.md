# ADR-0002: Curate our own blocklist; ingest third-party lists only after a license check

- Status: Accepted; amended by ADR-0007 (MetaMask and Polkadot.js lists are now bundled)
- Date: 2026-10-14

## Context
A blocklist is the core asset of a phishing shield. Public lists exist, but their licenses differ:
- ScamSniffer's open database is GPL-3.0 (corrected 2026-10-14; earlier drafts said AGPL). Shipping it inside our extension would oblige us to release the extension under GPL-compatible terms.
- Other lists (wallet vendors, security firms, community feeds) have custom or unclear terms.

Our differentiator is Indonesia-specific coverage, which no public list provides well.

## Decision
- MVP ships with **our own curated list** (`extension/lists/blocklist.json`), built from community reports and our own monitoring of local scams.
- Before ingesting any third-party list, record its license in `docs/sources.md` and get an explicit OK. Copyleft (GPL/AGPL) sources are allowed only if we accept open-sourcing the extension under a compatible license (an open question, not decided here).
- Protected brands (`brands.json`) and the allowlist are maintained by us.
- Lists ship inside each release for MVP. Remote, signed list updates come in v0.2.

## Consequences
- **+** No license surprises; the Indonesia-focused list becomes our own asset (and later a B2B product).
- **−** Smaller coverage at launch. Lookalike detection (algorithmic, no list needed) partly compensates.
- **−** Curation takes ongoing work: we need a triage process and a report-to-release target time (SPEC §9).
