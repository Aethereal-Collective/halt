# Aethereal Shield: MVP Plan

Target: public beta on the Chrome Web Store in **6 weeks**.

## Scope

### In
- Chrome/Brave MV3 extension, plain JS, no build step (ADR-0001).
- Domain Shield: allowlist, curated blocklist, lookalike, brand keyword, punycode.
- EVM guard: unlimited approval, approval-for-all, Permit/Permit2 signatures, Seaport zero listing, `eth_sign`.
- Bahasa Indonesia warning UI (full-page overlay plus transaction modal).
- Claude explanation through the Cloudflare Worker, with static fallback.
- Popup: tab status plus report link.
- Cek Legalitas basics (SPEC F5): `licensed.json` from the OJK whitelist, "Berizin OJK" badge on official domains, licensed entities protected from lookalikes, dismissible Satgas PASTI banner on listed global exchanges.
- Unit tests for `domain.js` and `tx.js` (`npm test`).

### Out (explicitly)
- Solana and non-EVM chains.
- Transaction simulation.
- Remote list updates (lists ship with each release).
- Heuristic detection of unknown trading platforms (SPEC F5, v0.2).
- User accounts, settings page, analytics beyond anonymous counters.
- Firefox / Safari / mobile.

## Milestones

| Week | Deliverable | Done when |
|---|---|---|
| 1 | Core logic plus tests | `npm test` green; 30+ real typosquat samples covered |
| 2 | Extension shell | Load unpacked; overlay shows on a test lookalike domain; badge per tab |
| 3 | EVM guard | Modal appears for each flagged request on a local test dApp; Reject returns 4001; MetaMask, Rabby, and OKX tested |
| 4 | Worker plus AI explanation | `/explain` deployed; p95 < 8 s; static fallback verified with the Worker offline |
| 5 | Blocklist plus polish (third-party part done, ADR-0007) | ≥ 200 curated entries (own reports plus licensed sources); copy reviewed by 5 non-technical users |
| 6 | Launch | CWS listing live; privacy policy page on aethereal.top; announcement on X, Medium, Discord |

## Acceptance criteria

1. Visiting `indodaz.com` (typo of indodax.com) shows the danger overlay before the page is usable.
2. Visiting `indodax.com` and `app.uniswap.org` shows nothing.
3. On a test dApp, `approve(spender, MAX_UINT256)` opens the modal; **Tolak** makes the dApp receive error code `4001`, and the wallet popup never opens.
4. A Seaport listing that pays the offerer nothing is flagged **critical**.
5. With the Worker unreachable, warnings still render with static copy within 100 ms.
6. No network request is made for unflagged pages (verified in DevTools).
7. `npm test` passes in CI.

## Test plan
- **Unit:** `node --test` on pure libs (domain, tx, model).
- **E2E:** `npm run e2e` loads the extension into real Chrome and checks acceptance criteria 1–6 against `test/dapp/` with a mock wallet.
- **Manual dApp matrix:** local Hardhat/Anvil plus a small test page that issues each flagged request. Run on MetaMask, Rabby, OKX Wallet, and Phantom (EVM mode).
- **Real-world regression:** keep a file of confirmed phishing domains from community reports and run it against `checkDomain` before every release.

## Launch checklist
- [ ] CWS developer account with 2FA plus hardware key; single-purpose description; permission justifications (`<all_urls>`: needed to check every site the user visits locally).
- [ ] Privacy policy at `aethereal.top/shield/privacy` matching SPEC §6 (draft: `docs/privacy-policy.md`; fill contact, review, publish).
- [ ] `ALLOWED_ORIGIN` set to the published extension ID; `ANTHROPIC_API_KEY` set as a Worker secret.
- [x] Rate limit plus KV cache on the Worker (code done; create the KV namespace before deploy).
- [x] Release zip built from a tagged commit (`npm run release`); changelog (`CHANGELOG.md`).
- [x] Disclaimer in the UI and listing: "bukan jaminan keamanan".
- [x] Appeal channel for false positives (link on the block page to `REPORT_URL`).

## Metrics to collect (anonymous, opt-in)
- Warnings shown, by type and level.
- Reject vs. continue after a warning.
- False positive reports.
