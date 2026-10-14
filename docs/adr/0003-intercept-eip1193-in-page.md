# ADR-0003: Intercept wallet requests by wrapping EIP-1193 providers in the page

- Status: Accepted (with a known limitation)
- Date: 2026-10-14

## Context
To warn before a malicious approval or signature, we must see the request before the wallet does. Options:

1. **Wrap `provider.request` in the page's JS world** (how Pocket Universe-style extensions work).
2. **Integrate into the wallet itself** (how Blockaid works inside MetaMask, and OKX/Rabby built-ins). This requires a partnership; not possible for MVP.
3. **Become a wallet.** Out of scope (SPEC non-goal).

## Decision
Option 1:
- The content script injects `inpage.js` as a module script.
- `inpage.js` wraps `window.ethereum` and every provider announced through EIP-6963.
- Flagged calls pause and post a confirm message to the content script, which shows the modal and posts the decision back. A rejection throws EIP-1193 error `4001`.

## Known limitation
The guard runs in the same JS world as the attacker's page:
- A drainer that targets us can call the provider's prototype `request`, or a frozen provider, and skip the wrapper.
- A drainer can also forge the "allow" message, because `window.postMessage` is visible to page scripts.

**The in-page guard is therefore advisory, not enforcement.** It stops generic drainer kits and user mistakes, not an attacker who specifically defeats Shield.

## Consequences
- **+** Works with any EVM wallet without a partnership.
- **−** Bypassable as described. Domain Shield (which runs before page code) is the first line of defense.
- **−** Some wallets freeze their provider object; the wrap fails silently and users rely on the wallet's own warnings.
- **Follow-up:** offer the analysis as an API that wallets can call (v1.0). That moves enforcement to the wallet, where it cannot be bypassed by page code.
