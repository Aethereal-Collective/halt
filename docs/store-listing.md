# Chrome Web Store listing

Copy to paste into the CWS developer dashboard. Listing language: Bahasa Indonesia (primary), English (secondary).

## Single purpose
Aethereal Shield warns users about crypto phishing websites and risky wallet transaction or signature requests.

## Short description (≤132 chars)
- ID: Lindungi aset kripto kamu dari situs phishing dan transaksi wallet berbahaya, dengan penjelasan dalam Bahasa Indonesia.
- EN: Protects your crypto from phishing sites and risky wallet requests, with warnings explained in Bahasa Indonesia.

## Detailed description (ID)
Aethereal Shield memeriksa setiap situs yang kamu buka dan setiap permintaan wallet yang berisiko, lalu menjelaskan bahayanya dalam Bahasa Indonesia yang mudah dipahami.

- **Situs palsu:** memblokir situs tiruan exchange dan dApp populer (misalnya indodaz.com yang meniru indodax.com) sebelum kamu sempat mengetik apa pun.
- **Transaksi berbahaya (EVM):** menahan izin token tanpa batas, izin semua NFT (setApprovalForAll), tanda tangan Permit/Permit2, listing NFT seharga 0, dan eth_sign. Kamu yang memutuskan: Tolak atau lanjut ke wallet.
- **Penjelasan AI:** setiap peringatan dilengkapi penjelasan singkat dari Claude tentang apa yang bisa terjadi pada aset kamu.
- **Privasi:** pemeriksaan situs berjalan di perangkat kamu. Riwayat browsing tidak pernah dikirim. Hanya ringkasan peringatan yang dikirim untuk penjelasan AI.

Mendukung MetaMask, Rabby, OKX Wallet, dan wallet EVM lain di Chrome dan Brave.

Bukan jaminan keamanan. Selalu cek ulang alamat situs dan isi transaksi di wallet kamu.

Daftar phishing dari MetaMask eth-phishing-detect dan Polkadot.js phishing (Apache-2.0). Data pelatihan model lokal juga memakai Phishing.Database (MIT) dan Majestic Million (CC BY 3.0).

## Permission justifications
| Permission | Justification |
|---|---|
| `host_permissions: <all_urls>` | The content script must run on every site the user opens to check the site's domain locally against the bundled phishing list and model, and to watch for risky wallet requests on any dApp. Visited URLs are never sent off the device. |
| `storage` | Keeps the per-tab check result in session storage so the toolbar popup can show it. Cleared when the browser closes. |
| Remote code | None. All code ships in the package. The only network call is POST of a flagged finding to our API for an explanation text. |

## Data usage disclosures (CWS privacy tab)
- Collects: "Website content"? **No.** "Web history"? **No.** (Only the hostname of a site that triggered a warning, sent for the explanation.)
- Certify: not sold to third parties; not used for unrelated purposes; not used for creditworthiness.
- Privacy policy URL: https://aethereal.top/shield/privacy (`docs/privacy-policy.md`).

## Assets still needed
- Icon 128×128 (and 16/32/48 in `manifest.json`; no icons exist yet).
- At least 1 screenshot 1280×800: the danger overlay on a lookalike domain, and the transaction modal.
- Small promo tile 440×280.
