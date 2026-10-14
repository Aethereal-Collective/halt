# Data sources and licenses

Required by ADR-0002: every third-party source is listed here with its license before we use it.
Checked 2026-10-14 against each project's LICENSE file or terms page.

## In use

| Source | Used for | License | Obligations |
|---|---|---|---|
| [MetaMask eth-phishing-detect](https://github.com/MetaMask/eth-phishing-detect) `src/config.json` | Bundled blocklist (`blacklist`, ADR-0007); model training (`whitelist`, `fuzzylist` as benign) | DON'T BE A DICK PUBLIC LICENSE v1.2 | Credit in `extension/CREDITS.md` and the store listing |
| [Polkadot.js phishing](https://github.com/polkadot-js/phishing) `all.json` | Bundled blocklist (`deny`, ADR-0007); model training (`allow` as benign) | Apache-2.0 | Keep license notice in `extension/CREDITS.md` |
| [Phishing.Database](https://github.com/Phishing-Database/Phishing.Database) `phishing-domains-ACTIVE.txt` | Model training only (phishing) | MIT | Credit. The README does not state which upstream feeds it aggregates, so we never bundle its entries. |
| [Majestic Million](https://majestic.com/reports/majestic-million) | Model training (benign); top 100k used to filter the bundled blocklist | CC BY 3.0 | Credit in `extension/CREDITS.md` |

Shipped: model weights (`extension/lists/model.json`) and the MetaMask + Polkadot.js entries in `extension/lists/blocklist-thirdparty.json` (`npm run blocklist`). `blocklist.json` stays our own curation.

## Rejected

| Source | Why |
|---|---|
| ScamSniffer scam-database | GPL-3.0 (copyleft). Not compatible with a closed-source extension. |
| OpenPhish community feed | Non-commercial only; redistribution forbidden. |
| URLhaus / abuse.ch | Free for non-profit use only; commercial needs a Spamhaus subscription. |
| PhishTank | New registrations closed; feed terms unclear. |
| CryptoScamDB | No license; last updated 2022. |
| Phishing Army | Upstream providers' commercial terms unknown. |
| Tranco | No published license; its default list includes Cloudflare Radar (CC BY-NC 4.0). Usable only after written confirmation or a custom list without Radar. |
| Komdigi TrustPositif scrapes | No license; mostly gambling/adult, not crypto. |
| ChainPatrol, Chainabuse, Web3 Antivirus | No public bulk data; commercial license needed. |

## Candidates

- PhiUSIIL phishing URL dataset (UCI, CC BY 4.0, cite Prasad & Chandra 2024): full URLs from 2024; would need host extraction.
- Satgas PASTI (OJK) illegal-investment announcements: public press releases, no bulk file. Curate Indonesian entries by hand into `blocklist.json`.

No public Indonesia-specific crypto phishing feed exists; that gap is ours to fill.
