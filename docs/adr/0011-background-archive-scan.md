# ADR-0011: Repo scan runs in the background from one in-memory archive

- Status: Accepted
- Date: 2026-11-14
- Amends: ADR-0009 (replaces reading files one by one, and the "no host_permissions" rule)

## Context
ADR-0009 read each file from the GitHub tab. On a real repo (809 files) that stopped at 200 files because of limits we chose (file count, bytes, rate limiting), and the scan died if the tab was closed. Both defeat the purpose: a freelancer needs the whole repo checked, and should not have to babysit a tab. The scan must also stay safe: reading a hostile repo must never save, extract or run any of it.

Findings from research on how this can work in Chrome MV3:
- GitHub serves the whole repo as one zip (`/archive/<ref>.zip`, which redirects to `codeload.github.com`). One request, no per-file rate limit.
- Links for private repos are short-lived tokens (expire in about 5 minutes), so the page, which has the user's session, must obtain the link.
- A service worker is stopped after about 30 seconds of inactivity, so it cannot hold a long download. An offscreen document has no lifetime limit (except for audio) and lets the work continue after the tab is closed.
- Sources disagree on whether SameSite=Lax cookies are sent from extension contexts, so the design does not depend on cookies outside the page.

## Decision
- **Hand-off from the page.** On a click, `content.js` requests `/archive/<ref>.zip` on github.com with the user's session, reads only the address it was redirected to (a `codeload.github.com` link), cancels the body, and sends the link to the background. The tab is needed for about a second.
- **Download in an offscreen document** (`src/offscreen.js`, reason `BLOBS`). It fetches the pinned host over https with `credentials: "omit"`, `cache: "no-store"` and no referrer, checks the host again after redirects, and keeps the zip **in memory only** (option A).
- **Nothing is saved, extracted or run.** No `chrome.downloads`, Blob, object URL, file-system or IndexedDB use. Entry names are untrusted text, cleaned of control and bidi characters, and never used as paths. `test/privacy.test.js` fails if such an API appears.
- **Own minimal zip reader** (`lib/zip.js`, no dependency). Decompression is bounded by the size the archive declares, so a zip bomb is rejected, not expanded. Encrypted entries and zip64 archives are not supported and reported. At most 1,000,000 entries.
- **Scan everything.** No cap on the number of files. Files are unpacked one at a time, scanned in batches, and dropped; only findings are kept. A file over 1 MB unpacked is reported by name as not scanned. A total unpacked budget (2 GB) stops a bomb made of many mid-size files and is reported as an early stop. Corrupt entries are counted, not hidden. More file types are scanned than before (`.vue`, `.svelte`, `.mts`, `.gradle`, `.lua`, `.husky/*`, `Makefile`, `Dockerfile`, ...). Docs (`.md`, `.txt`) are not, because READMEs legitimately contain `curl | sh`.
- **Memory ceiling.** The compressed zip must be at most 300 MB. Above that the scan says the repo is too large and scans nothing partially.
- **Results** live in `chrome.storage.session` (memory, cleared when the browser closes), keyed per repo, at most 8 kept. At most 300 findings are stored; the real count is stored alongside. They include file path, line and a snippet of up to 160 characters. Opening Halt on any tab shows them. One scan runs at a time; a job with no progress for 2 minutes is reported as stalled.
- **Messages are validated.** The background accepts a start only from a github.com tab with a link on exactly `codeload.github.com` (https, no port or credentials) whose path belongs to the same owner/repo, and accepts progress and results only from the offscreen page (`lib/scan-job.js`, tested).
- **Permissions.** `host_permissions: ["https://codeload.github.com/*"]` and `offscreen`. The content script already matches `<all_urls>`, so the install warning should not get broader (not confirmed in Chrome). `notifications` is deliberately not requested; the user finds the result under the Halt icon.

## Not verified yet (needs a real browser)
1. A `fetch` from the GitHub page to `/archive/<ref>.zip` follows the redirect to `codeload.github.com` (CORS) and exposes the final URL.
2. The tokenized link still works after the page cancelled its body, and from the offscreen document without cookies.
3. Chrome Web Store accepts reason `BLOBS` for this use.
4. `DecompressionStream("deflate-raw")` is available in the user's browser (Chrome 103+).

## Consequences
- **+** The whole repo is scanned in one request. The tab can be closed after about a second.
- **+** Nothing from the repo touches the disk by our code, and nothing is run.
- **−** Peak memory is about twice the compressed zip while the chunks are joined (up to ~600 MB at the ceiling).
- **−** Lines over 4000 characters are still only checked for a blob (see ADR-0010).
- **−** New permissions and a changed privacy statement; the policy and store listing were updated with this ADR.
- **−** The archive link and a repo's snippets are held in browser memory until the browser closes.
