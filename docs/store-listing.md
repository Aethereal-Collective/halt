# Chrome Web Store listing

Copy to paste into the CWS developer dashboard. Listing language: Bahasa Indonesia (primary), English (secondary).

## Single purpose
Aethereal Shield warns users about crypto phishing websites and risky wallet transaction or signature requests.

## Short description (≤132 chars)
- ID: Lindungi aset kripto kamu dari situs phishing dan transaksi wallet berbahaya, dengan penjelasan dalam Bahasa Indonesia.
- EN: Protects your crypto from phishing sites and risky wallet requests, with clear warnings in Bahasa Indonesia. Runs fully on-device.

## Detailed description (ID)
Aethereal Shield memeriksa setiap situs yang kamu buka dan setiap permintaan wallet yang berisiko, lalu menjelaskan bahayanya dalam Bahasa Indonesia yang mudah dipahami.

- **Situs palsu:** memblokir situs tiruan exchange dan dApp populer (misalnya indodaz.com yang meniru indodax.com) sebelum kamu sempat mengetik apa pun.
- **Transaksi berbahaya (EVM):** menahan izin token tanpa batas, izin semua NFT (setApprovalForAll), tanda tangan Permit/Permit2, listing NFT seharga 0, dan eth_sign. Kamu yang memutuskan: Tolak atau lanjut ke wallet.
- **Penjelasan jelas:** setiap peringatan menjelaskan apa yang bisa terjadi pada aset kamu dan apa yang sebaiknya kamu lakukan.
- **Privasi penuh:** semua pemeriksaan berjalan di perangkat kamu. Tidak ada data yang dikirim ke mana pun.

Mendukung MetaMask, Rabby, OKX Wallet, dan wallet EVM lain di Chrome dan Brave.

Bukan jaminan keamanan. Selalu cek ulang alamat situs dan isi transaksi di wallet kamu.

Daftar phishing dari MetaMask eth-phishing-detect dan Polkadot.js phishing (Apache-2.0). Data pelatihan model lokal juga memakai Phishing.Database (MIT) dan Majestic Million (CC BY 3.0).

## Permission justifications
| Permission | Justification |
|---|---|
| Content script on `<all_urls>` | The content script must run on every site the user opens to check the site's domain locally against the bundled phishing list and model, and to watch for risky wallet requests on any dApp. Nothing is sent off the device. |
| `storage` | Keeps the per-tab check result in session storage so the toolbar popup can show it. Cleared when the browser closes. |
| Remote code | None. All code ships in the package, and the extension makes no network requests. |

## Data usage disclosures (CWS privacy tab)
- Collects: nothing. No user data leaves the device.
- Certify: not sold to third parties; not used for unrelated purposes; not used for creditworthiness.
- Privacy policy URL: https://aethereal.top/shield/privacy (`docs/privacy-policy.md`).

## Assets still needed
- At least 1 screenshot 1280×800: the danger overlay on a lookalike domain, and the transaction modal.
- Small promo tile 440×280.
