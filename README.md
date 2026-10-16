# Halt

Browser extension that protects Indonesian crypto users from phishing sites and wallet drainers, with warnings explained in Bahasa Indonesia. Runs fully on-device: no server, no network calls.

- **Domain Shield:** blocks known and lookalike phishing domains (e.g. `indodaz.com` vs `indodax.com`).
- **Transaction Guard (EVM):** pauses unlimited approvals, approval-for-all, Permit/Permit2 signatures, zero-value NFT listings, and `eth_sign`.
- **Local model:** a small hostname classifier trained on licensed public phishing lists flags pattern-based drainer domains, on-device (ADR-0006).
- **Plain-language warnings:** each warning says what will happen to your money and what to do, in Bahasa Indonesia.

Docs: [Spec](docs/SPEC.md) · [MVP plan](docs/MVP.md) · [ADRs](docs/adr/) · [Data sources](docs/sources.md) · [Privacy policy](docs/privacy-policy.md) · [Store listing](docs/store-listing.md)

## Structure

```
extension/
  manifest.json        MV3 manifest
  src/background.js    service worker: lists, domain check, badge
  src/content.js       content script: inject guard, overlay + modal UI
  src/inpage.js        page-world guard: wraps EIP-1193 providers
  src/lib/domain.js    pure domain checks
  src/lib/tx.js        pure EVM request analysis
  src/lib/model.js     pure hostname model (weights in lists/model.json)
  src/config.js        report URL
  lists/               brands, allowlist, blocklist, model
  icons/               toolbar and store icons
  popup/               toolbar popup
test/                  node --test unit tests for lib/
test/dapp/             test dApp: one button per flagged request (?mock = fake wallet)
test/e2e/              real-Chrome E2E for the MVP acceptance criteria
scripts/               fetch-data + train (model), build-blocklist, release (zip from tag)
site/                  landing page + privacy policy (Nuxt 4, Tailwind 4, shadcn-vue; static), served at https://halt.aethereal.top
```

## Develop

```bash
npm install
npm test                      # core logic tests
npm run e2e                   # real Chrome + extension; set CHROME_PATH if Chrome is elsewhere; needs openssl
SHOTS=dist npm run e2e        # same, plus store screenshots
npm run train                 # download licensed datasets to data/ and retrain lists/model.json
npm run blocklist             # refresh lists/blocklist-thirdparty.json (run before every release)
```

Manual wallet test: `npx serve test/dapp`, open it with MetaMask/Rabby/OKX/Phantom installed, click each button, and check that **Tolak** shows `error 4001` and the wallet popup never opens.

Load the extension: `chrome://extensions` → enable Developer mode → **Load unpacked** → select `extension/`.

Try it: temporarily add `example.com` to `extension/lists/blocklist.json`, reload the extension, and open `https://example.com` to see the overlay.

## Landing page

```bash
cd site
npm install
npm run dev                   # http://localhost:3000 (English at /en)
npm run generate              # static files in site/.output/public -> upload to https://halt.aethereal.top
```

The privacy page renders `docs/privacy-policy.md`, so edit the policy there. Sections live in `site/app/components/section/`; the warning mockups in `site/app/components/mock/` mirror `extension/src/content.js`, so update both when the copy changes. TypeScript is pinned to 6: the Vue SFC compiler needs its JS API, which TypeScript 7 no longer ships. Set `cwsUrl` in `site/app/app.config.ts` once the store listing is live.

## Release

```bash
# npm run blocklist, bump extension/manifest.json version, update CHANGELOG.md, commit
git tag v0.1.0
npm run release               # dist/halt-0.1.0.zip, built from the tag only
```

## Limitations

The transaction guard runs in the page and can be bypassed by a drainer that specifically targets Halt (see [ADR-0003](docs/adr/0003-intercept-eip1193-in-page.md)). Halt reduces risk; it is not a guarantee.
