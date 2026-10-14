# ADR-0005: Local-first domain checks; browsing history never leaves the device

- Status: Accepted
- Date: 2026-10-14

## Context
Checking every visited site against a server would reveal the user's full browsing history to us. For a security product, that is both a trust problem and a liability. Google Safe Browsing solves this with hash-prefix lookups; ScamSniffer-style tools ship lists locally.

## Decision
- All domain checks run in the service worker against lists bundled in the extension.
- No network call happens for unflagged pages.
- Only when a page or request is flagged is a minimal finding sent for explanation (ADR-0004).
- When the list grows too large to bundle (rough threshold: more than about 5 MB), switch to downloading a compact list (Bloom filter or sorted hash prefixes) and confirming full matches with a hash-prefix query. Never send plain URLs.

## Consequences
- **+** Strong privacy story for the Chrome Web Store listing and for users.
- **+** Works offline; no latency on page load.
- **−** List freshness depends on release cadence until remote updates ship (v0.2).
