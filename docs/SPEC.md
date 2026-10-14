# Aethereal Shield: Product Spec

Status: Draft v0.1 · Owner: Aethereal · Last updated: 2026-10-14

## 1. Problem

Indonesian crypto users lose money to phishing in three ways:

1. **Fake sites.** Lookalike domains of local exchanges (Indodax, Tokocrypto, Pintu, Reku) and global dApps (Uniswap, OpenSea, MetaMask), spread through WhatsApp/Telegram groups, fake "admin" DMs, and paid search ads.
2. **Malicious approvals.** A drainer site asks for `approve(unlimited)` or `setApprovalForAll`, then empties the wallet later.
3. **Malicious signatures.** Gasless off-chain signatures (EIP-2612 `Permit`, Permit2, Seaport listings) that the user does not understand, which hand over tokens or sell NFTs for 0.

Existing tools (ScamSniffer, Pocket Universe, wallet built-ins such as OKX Wallet, MetaMask + Blockaid, Rabby) work well globally, but:

- None explain risks in Bahasa Indonesia.
- Their blocklists are slow to catch Indonesia-specific scams (local exchange clones, Rupiah-denominated "investment" sites).
- Warnings are technical ("Permit2 signature detected") and do not tell a normal user what will happen to their money.

## 2. Target users

- **Primary:** Indonesian retail crypto users on desktop Chrome/Brave who use a browser wallet (MetaMask, Rabby, OKX, Phantom) and trade on DEXes or NFT marketplaces.
- **Secondary:** Indonesian crypto communities (Discord/Telegram admins) who want a fast way to report and block scam links for their members.

## 3. Goals and non-goals

### Goals
- G1: Block known and lookalike phishing domains before the user interacts with them.
- G2: Stop the most common drainer requests (unlimited approvals, approval-for-all, permit signatures, zero-value listings, `eth_sign`) with a clear warning.
- G3: Explain every warning in plain Bahasa Indonesia: what will happen and what to do.
- G4: Let users report suspicious sites in one click, feeding a local blocklist.
- G5: Privacy by default: browsing history never leaves the device.
- G6: Show whether a crypto trading platform is licensed by OJK, so users can avoid illegal platforms before depositing.

### Non-goals (v0.x)
- Not a wallet. We do not hold keys or sign anything.
- No guarantee or insurance. Shield reduces risk; it does not eliminate it.
- No mobile app (desktop browser extension only).
- No full transaction simulation in MVP (planned v0.3).
- Solana and other non-EVM chains come after MVP (planned v0.2).
- No investment advice, token ratings, or "buy/sell" signals.

## 4. Features

### F1 · Domain Shield
- Runs on every top-level page load (`document_start`).
- Checks, in order:
  1. **Allowlist** (official brand domains plus common safe sites) → safe.
  2. **Blocklist** (our curation plus the MetaMask and Polkadot.js lists, see ADR-0002 and ADR-0007) → danger.
  3. **Lookalike detection:** edit distance 1 (or 2 for labels with 8+ characters), counting adjacent swaps as one edit, against protected brand labels of 5+ characters → danger. Also applied to homoglyph skeletons (`rn`→`m`, `vv`→`w`) and to the ASCII part of punycode labels. The TLD is never compared, and a short list of real words (e.g. `finance`) is exempt.
  4. **Brand keyword:** a domain that contains a brand label but is not official (e.g. `indodax-login.xyz`) → warn.
  5. **Punycode:** `xn--` labels → warn; punycode plus brand keyword → danger.
  6. **Local model** (ADR-0006): hostname looks like known phishing → warn; model plus brand keyword → danger.
- **Danger:** full-page overlay with "Keluar dari situs ini" (primary) and "Saya paham risikonya, lanjutkan" (secondary).
- **Warn:** toolbar badge `!` only (no interruption).
- Toolbar badge per tab: none / `!` / `X`.

### F2 · Transaction & Signature Guard (EVM)
Wraps `window.ethereum.request` and EIP-6963 providers in the page context (ADR-0003). Flags:

| Request | Condition | Risk |
|---|---|---|
| `eth_sendTransaction` `approve` / `increaseAllowance` | amount ≥ 2^128 | high |
| same | 0 < amount < 2^128 | medium |
| `setApprovalForAll` | approved = true | critical |
| Permit2 `approve` | always | high |
| `eth_signTypedData_v3/v4` | primaryType is Permit / Permit2 family | high |
| `eth_signTypedData_v4` Seaport `OrderComponents` | no consideration item pays the offerer | critical |
| `eth_sign` | always | critical |

Flagged requests pause until the user picks **Tolak** (default, primary button) or **Lanjutkan ke wallet**. A rejection throws EIP-1193 error `4001`, so dApps treat it like a wallet rejection.

### F3 · Explanation (static, on-device)
- Every warning shows Bahasa Indonesia copy written by us: what the request does, the decoded facts (spender, token, amount), and what to do next (`COPY.actions` in `content.js`).
- No AI service and no network call (ADR-0008).

### F4 · Report
- Popup button "Laporkan situs mencurigakan" opens the report channel (Discord in MVP).
- v0.2: in-extension form → API → triage queue → blocklist release.

### F5 · Cek Legalitas Platform (OJK)

**Why.** Illegal trading platforms are a leading way Indonesians lose money, separate from wallet drainers:
- Satgas PASTI shut down 228 unlicensed digital asset traders (PAKD) in January–May 2026 alone.
- Satgas PASTI states that crypto trading may only be offered by OJK-licensed parties, and warns about unlicensed offers spreading through social media, chat groups, and websites.
- OJK reports Rp12 trillion in digital scam losses over the last two years (all scam types, not crypto only).

Today a user has to check legality manually: the OJK whitelist (a PDF in a press release), Kontak OJK 157, or the WhatsApp bot (081-157-157-157). Nobody does that before every deposit.

**Data source.**
- OJK publishes a whitelist of licensed PAKD, CPAKD, exchanges (bursa), clearing houses, and custodians in press releases, updated periodically. As of 22 September 2026, secondary sources count about 28 PAKD; counts differ between sources.
- There is **no public API or machine-readable dataset** (not found in research). The list is curated by hand into `extension/lists/licensed.json`.
- Satgas PASTI published (June 2026) a numbered list of the **228 unlicensed digital asset traders whose activities it stopped** in January–May 2026, by entity name only (no domains). It includes major global exchanges: Binance, Bybit, OKX, KuCoin, Bitget, MEXC, Gate, HTX, Coinbase, Bitstamp, Gemini. We map names to official domains by hand into `extension/lists/satgas-pasti.json` (name as published, our verified domains, source, date).
- Scam sites named in Satgas PASTI or OJK releases go into `blocklist.json` with the source. The 228-entity list does **not** go there: most are real companies, not phishing.

```jsonc
// extension/lists/licensed.json
{
  "source": "OJK whitelist, press release <number/date>",
  "verifiedAt": "2026-10-14",
  "entities": [
    {
      "name": "Indodax",                       // brand / app name
      "legalName": "PT Indodax Nasional Indonesia",
      "type": "PAKD",                           // PAKD | CPAKD | bursa | kliring | kustodian
      "domains": ["indodax.com"]                // official web domains, verified on the entity's own site/app store listing
    }
  ]
}
```

Rules for the list:
- Domains come only from the entity's own website or official app store listing, never from news articles.
- Every release states `verifiedAt`. If the list is older than 60 days, the popup says so.
- When OJK publishes an update, refresh the list within 7 days (release checklist item).

**Behavior.**

| Situation | Result | Level |
|---|---|---|
| Domain is an official domain of a licensed entity | Popup and badge show **"Berizin OJK"**, plus the legal name, license type, and source date | safe (green ✓) |
| Domain imitates a licensed entity (lookalike or brand keyword) | Same as F1 lookalike and brand keyword. All licensed entities are added to the protected brands automatically. | danger / warn |
| Domain belongs to an entity on the Satgas PASTI list (e.g. Binance, Bybit, OKX) | Dismissible banner plus popup: "Platform ini termasuk dalam daftar pedagang kripto tanpa izin OJK yang kegiatannya dihentikan Satgas PASTI (Juni 2026). Dana kamu tidak dilindungi OJK, dan transaksi di platform luar negeri kena PPh final 1% yang harus kamu setor sendiri." Links to the source. | warn (banner, no full-page block) |
| Domain is a foreign platform not on either list | Popup only: "Tidak ditemukan di whitelist OJK." | info |
| Unknown site that looks like a crypto trading or "investasi kripto" platform (v0.2, see below) | Warning banner: "Situs ini menawarkan trading/investasi kripto tapi **tidak ditemukan** di daftar whitelist OJK per <tanggal>." | warn |

**Detecting "looks like a trading platform" (v0.2).**
- Runs locally in the content script, after load, on the visible text plus form fields of the top frame.
- Keyword and structure heuristics: deposit/withdraw forms; "beli kripto", "trading", "profit harian", "investasi", "deposit minimal"; IDR price tickers.
- Nothing is sent off the device (ADR-0005).
- Thresholds are tuned against a labeled set of licensed sites, offshore exchanges, news/education sites, and known illegal platforms from Satgas PASTI releases. The target is a false-positive rate below 1% on news/education sites before shipping.

**Copy and legal care.**
- Never call a site "ilegal" unless it is named in an official Satgas PASTI or OJK release. Otherwise use "tidak ditemukan di whitelist OJK per <tanggal>".
- "Berizin OJK" means legal status only, not that an investment is safe. The popup says so.
- Every legality screen links to the official channels: Kontak OJK 157 and the WhatsApp bot 081-157-157-157.

**Implementation sketch.**
- `lib/legal.js`: pure `checkLegality(host, licensed, satgas)` returns `{ status: "licensed" | "satgas_stopped" | "unknown", entity?, source? }`, with unit tests.
- The banner is dismissible per domain (remembered in `chrome.storage.local`), so daily users of a global exchange see it once, not on every visit.
- `background.js`: run alongside `checkDomain`; store the result in the tab verdict.
- Merge `licensed.json` entities into the protected brands list at load.
- Popup: a legality section under the risk status.

## 5. Architecture

```
┌──────────────── Browser ────────────────────────────────────────────┐
│                                                                     │
│  Page (MAIN world)            Content script (isolated)             │
│  ┌───────────────┐  postMsg   ┌──────────────────────┐              │
│  │ inpage.js     │──────────▶ │ content.js           │              │
│  │ wraps         │ ◀──────────│ overlay + tx modal   │              │
│  │ provider.req  │  decision  │ (shadow DOM)         │              │
│  │ uses lib/tx.js│            └─────────┬────────────┘              │
│  └───────────────┘                      │ chrome.runtime msg        │
│                               ┌─────────▼────────────┐              │
│                               │ background.js (SW)   │              │
│                               │ lib/domain.js        │              │
│                               │ lists/*.json         │              │
│                               │ badge, session store │              │
│                               └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                No network calls: everything runs on-device.
```

| Component | File | Responsibility |
|---|---|---|
| Domain logic | `extension/src/lib/domain.js` | Pure function `checkDomain(host, lists)` |
| Tx logic | `extension/src/lib/tx.js` | Pure function `analyzeRequest({method, params})` |
| Service worker | `extension/src/background.js` | Load lists, run domain check, badge |
| Content script | `extension/src/content.js` | Inject guard, render overlay/modal, relay decisions |
| In-page guard | `extension/src/inpage.js` | Wrap EIP-1193 providers, pause risky calls |
| Popup | `extension/popup/` | Current tab status, report link |

## 6. Data & privacy

| Data | Leaves device? | Notes |
|---|---|---|
| Visited URLs / hostnames | **No** | Domain checks run locally against bundled lists |
| Hostname of a flagged site | **No** | Warnings are rendered locally |
| Transaction finding (method, spender, token, amount) | **No** | Decoded and shown locally |
| Wallet address, balances, keys | **Never** | |
| Legality check (F5) and page heuristics (v0.2) | **No** | Runs locally against `licensed.json`; page text is never sent |

The extension makes no network requests at all (enforced by `test/privacy.test.js` and the E2E). The privacy policy must state the table above before Chrome Web Store submission.

## 7. Threat model (summary)

| Threat | Impact | Mitigation |
|---|---|---|
| Drainer bypasses the in-page wrapper (calls the provider prototype directly, or uses a frozen provider) | Guard skipped | Documented limitation (ADR-0003). Domain Shield is the first line. Long-term: wallet-side integration via API. |
| Malicious page spoofs the "allow" postMessage | Guard skipped | Same root cause as above. Accepted for MVP; the in-page guard is advisory. |
| Extension supply-chain compromise (stolen CWS account, malicious update) | Catastrophic: every user exposed | 2FA plus hardware key on the CWS account, release checklist, no remote code, minimal permissions, reproducible zip from tagged commit. |
| False positive on a legitimate site | Reputation, complaints | Warn level for weaker signals; danger only for blocklist or lookalike; appeal channel; allowlist fast-track. |
| Stale OJK whitelist (entity loses or gains a license) | Wrong "Berizin OJK" badge | `verifiedAt` shown in the popup; stale warning after 60 days; refresh within 7 days of an OJK update |
| Illegal platform copies a licensed brand's name on its own domain | User trusts a fake | Licensed entities are protected brands (F1 lookalike/keyword), and the badge only appears on exact official domains |

## 8. UX copy principles
- Bahasa Indonesia, second person ("kamu"), short sentences.
- Say what will happen to the money ("Situs ini bisa memindahkan SEMUA USDT kamu"), not the technical term.
- The safe action is always the primary button.
- Every screen states: "bukan jaminan keamanan".

## 9. Success metrics
- Weekly active users (WAU).
- Warnings shown per week, and the **reject rate** after a warning (target ≥ 60% on critical findings).
- False positive reports per 1,000 warnings (target < 5).
- Median time from a community report to blocklist release (target < 24 h by v0.2).
- Days between an OJK whitelist update and our list release (target ≤ 7).

## 10. Competitors

| Product | Model | Gap Shield targets |
|---|---|---|
| ScamSniffer | Free extension + paid API; large global blocklist (GPL-3.0 open DB) | No Bahasa Indonesia, global focus |
| Pocket Universe | Extension with transaction simulation | English only; status of active development unclear |
| OKX Wallet / MetaMask (Blockaid) / Rabby | Built into the wallet | Only protects users of that wallet; technical wording |

## 11. Roadmap

- **v0.1 (MVP):**
  - F1, F2 (EVM), F3 (static copy), F4 (link).
  - F5 basics: licensed badge, licensed brands protected from lookalikes, Satgas PASTI banner for listed global exchanges.
- **v0.2:**
  - Solana (wallet-standard `signTransaction`: flag `SetAuthority` / owner changes).
  - In-extension report form.
  - Signed remote blocklist and whitelist updates.
  - F5 "looks like a trading platform" heuristic for unknown sites.
- **v0.3:**
  - Transaction simulation (asset changes) through a provider API.
  - Firefox support.
- **v1.0:** B2B API for local exchanges and communities (domain/address check).
