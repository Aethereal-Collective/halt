# ADR-0009: On-demand GitHub repo scan; the one allowed network exception

- Status: Accepted
- Date: 2026-11-08
- Amends: ADR-0005, ADR-0008 (the "no network requests" rule)

## Context
Freelancers are being hacked through fake "test job" repositories: an install hook, an obfuscated loader, or a `.vscode/tasks.json` that runs when the folder opens. The warning is most useful on the GitHub page, before the repo is cloned or run. Many of these repos are private (shared with the victim only), so a public-API or server-side scanner would not work, and we do not want to hold user tokens or see their code.

## Decision
- Add a static scanner (`extension/src/lib/repo-scan.js`, pure function, tests in `test/repo-scan.test.js`). It never executes or installs anything.
- The scan runs only when the user clicks "Scan this repo" in the popup on a `github.com/<owner>/<repo>` page. Never in the background, never automatically.
- The content script reads the file list and file contents from `github.com` using the user's own logged-in session (same-origin fetch), so private repos the user can open work without tokens. The only hosts contacted are `github.com` and the `raw.githubusercontent.com` redirect GitHub issues itself. File contents go to our service worker for scanning and nowhere else. We run no server and receive nothing.
- No `host_permissions` are added. `test/privacy.test.js` pins the exception: the only non-extension `fetch` is `fetch(GH + path, ...)` in `content.js`, `GH` is `https://github.com`, redirects are host-checked, and the manifest has no host permissions.
- Limits: 200 files, 200 KB per file, 3 MB total, 6 concurrent requests. Results say when the scan was partial.
- A clean result is never labelled "safe". Obfuscated or well-hidden payloads can be missed.

## Consequences
- **+** Works on private repos with no token, no backend, and no code leaving the device.
- **+** Catches the common freelancer-trap patterns where the user is already looking.
- **−** The file list uses an undocumented GitHub web endpoint (`/tree-list/<ref>`). If GitHub changes it, the popup shows an "unsupported" message. Fallback if needed: optional read-only token plus `api.github.com`.
- **−** The "no network requests" claim becomes "no network requests except the reading you ask for on github.com". The privacy policy and store listing must say so.
- **−** Rate limiting on large repos produces partial scans.

See ADR-0010 for how scanner rules are written, tested against false positives, and which datasets were consulted.
