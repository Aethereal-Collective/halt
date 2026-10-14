# ADR-0001: Chrome MV3 extension in plain JavaScript, no build step

- Status: Accepted
- Date: 2026-10-14

## Context
We need a browser extension that runs on Chrome and Brave (the most common desktop browsers among our users). Manifest V2 is retired in Chrome, so MV3 is required. The team is small, and a security extension benefits from code that reviewers (including Chrome Web Store reviewers) can read directly.

## Decision
- Manifest V3, service worker background with `"type": "module"`.
- Plain ES modules. No bundler, no TypeScript, no framework.
- Shared logic (`lib/domain.js`, `lib/tx.js`) is pure and importable by the service worker, the in-page script (as a web-accessible module), and Node tests.
- The content script is a classic script (MV3 content scripts cannot be ES modules), so it holds only UI and messaging.

## Consequences
- **+** What ships is exactly what is in the repo: easy to audit, no supply-chain risk from build tooling.
- **+** Tests run with built-in `node --test`, no dependencies.
- **−** No type checking. Mitigated by keeping logic in small pure functions with tests.
- **−** If the UI grows (settings page, onboarding), revisit and consider a minimal bundler. Revisit trigger: more than about 3 UI screens.
