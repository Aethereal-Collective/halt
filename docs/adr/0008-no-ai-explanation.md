# ADR-0008: No AI explanation; the extension is fully on-device

- Status: Accepted
- Date: 2026-10-14
- Supersedes: ADR-0004

## Context
ADR-0004 added a Claude explanation behind a Cloudflare Worker. The static Bahasa Indonesia copy already covers every finding, and the AI text was only additive. Keeping it meant running a backend, holding an API key, paying per warning, and sending the flagged host and transaction details off the device.

## Decision
- Remove the `/explain` call, the Worker (`worker/`), and the AI box in the UI.
- Every warning shows our own copy: the explanation, the decoded facts (spender, token, amount), and a next step per finding (`COPY.actions` in `content.js`).
- The extension makes no network requests. `host_permissions` is dropped from the manifest. `test/privacy.test.js` checks this statically and the E2E checks it at runtime.
- The local hostname model (ADR-0006) stays: it is our own model and runs on-device.

## Consequences
- **+** Nothing leaves the device, which gives a simpler privacy policy and store disclosure.
- **+** No backend to run, no API key to protect, no per-warning cost, and no prompt-injection surface.
- **+** Smaller permission set.
- **−** Explanations are not tailored to unusual cases; new finding types need new copy.
- **−** The product no longer demonstrates a Claude use case.
