# ADR-0010: Where repo-scan rules and test data come from, and the rules for using malware datasets

- Status: Accepted
- Date: 2026-11-08
- Relates to: ADR-0002 (license check before ingesting), ADR-0009 (the scanner itself)

## Context
The repo scanner (ADR-0009) exists because freelancers get hacked by fake "test job" repositories. Its rules started as a list of known patterns, and the first real run showed the danger of keyword rules: a clean Next.js + Puppeteer + Supabase project produced 8 false alarms (`res.cookies.get`, `page.$$eval`, the SheetJS CDN dependency, an SSRF test using `169.254.169.254`). We also went looking for public malware datasets to test against, and decided how to handle them. This ADR records both so we do not have to re-decide.

## Decision

### 1. Rules describe behavior, not keywords
- A finding needs a dangerous combination, not a scary word. Examples: decode (`atob`, base64, hex) **then** `eval`/`exec`; download **then** run; read a browser profile or key file **and** the same file talks to the network; a public raw IP as a destination.
- A bare `eval`, `new Function`, `cookies`, `mnemonic`, or `.npmrc` is not reported. Weak targets count only when the same line reads a file and the file also uses the network.
- Allowlist known-legitimate cases: dependencies from `cdn.sheetjs.com`, `registry.npmjs.org`, `registry.yarnpkg.com`; private, loopback and link-local IP ranges (SSRF tests, local dev).
- Match calls precisely (`(?<![\w$.])eval(`), so `page.$$eval(`, `re.exec(` and `obj.eval(` do not count.
- Severity: **high** only for behavior that is rarely legitimate. Everything else is **medium** ("check"), and a clean result is never labelled "safe".

### 2. Every false positive becomes a test
When a real repo is wrongly flagged, add the exact line as a regression test in `test/repo-scan.test.js` and fix the rule. Tests for the real attacks stay next to them, so a fix cannot silently stop catching malware. Current regression set: Next.js cookie APIs, Puppeteer `$$eval`, SheetJS CDN, link-local/private IPs.

### 3. Rules for using malware datasets and samples
- **Read, never run.** Read samples as text through the web or the GitHub API from a browser or `web_fetch`. Do not `git clone`, `npm install`, `pip install`, unzip, or execute anything from a sample, and do not download sample payloads onto a development machine.
- **Metadata first.** Prefer READMEs, write-ups, file lists and indicators over source files. Read file contents only when a rule needs a real example, and then only the specific file.
- **No sample code in this repo.** Do not commit sample source, extracted payloads, real C2 addresses, or victim/recruiter/company names. Test fixtures are written by us, small, and mimic the pattern (for example `eval(atob(...))`, a `postinstall` that pipes `curl` to `sh`, a `runOn: folderOpen` task).
- **Fixtures use reserved or fake hosts.** Use `example`/`.example` domains and documentation IP ranges, never live attacker infrastructure.
- **Clean up.** Delete anything an automated tool saved to disk (tool-output files in the Kiro session folder) once it is no longer needed.
- **License check before ingesting.** Per ADR-0002, a dataset is listed in `docs/sources.md` with its license before we copy anything from it. Reference-only reading is allowed without ingesting.
- **If ingestion is ever needed** (for example a bundled list of malicious package names for the dependency check), prefer a permissive-licensed list, bundle only names/hashes, and add credit to `extension/CREDITS.md`.

### 4. Sources consulted

#### Initial consultation (2026-11-08)
All are **reference only**. Nothing from them is bundled, copied or ingested, and their licenses were **not** checked yet. What we actually read: the Malware Museum README and its repository file list (names, sizes, hashes), and web search snippets. No sample source file was read, nothing was cloned or downloaded, and the saved file list was deleted.

| Source | What it is | Use for us |
|---|---|---|
| [Emmaccen/The-Malware-Museum](https://github.com/Emmaccen/The-Malware-Museum) | 5 real "take-home assessment" malware samples with READMEs (supply chain via a malicious npm dependency, variable masquerading, obfuscated crypto-wallet stealer with contract-address swap, DAO credential stealer, typosquatted logger). | Best match for our threat. Use the README descriptions to design fixtures. Do not copy code. |
| [francesco-oghabi/lazarus-contagious-interview](https://github.com/francesco-oghabi/lazarus-contagious-interview) | One trojanized repo (live malware, samples isolated as `.txt`). | Reference only. |
| [OpenSourceMalware/PolinRider](https://github.com/OpenSourceMalware/PolinRider) | Technical dossier on a DPRK actor tied to Contagious Interview. | Technique reference. |
| [DataDog/malicious-software-packages-dataset](https://github.com/datadog/malicious-software-packages-dataset) | About 1,400 human-vetted malicious npm/PyPI packages. | Candidate for a bundled package-name list. Check license and format first. |
| Microsoft, ReversingLabs ("graphalgo"), The Hacker News write-ups | Campaign analyses of fake recruiter attacks. | Technique reference. |

#### Deep-dive consultation (2026-11-13)
Read via GitHub API (`api.github.com/repos/…/contents`) and `raw.githubusercontent.com` as plain text. No cloning, no install, no execution. No sample code was stored in this repo; all test fixtures were written by us.

**What was read (text only):**

| Source | What was read | Date |
|---|---|---|
| Emmaccen/The-Malware-Museum — Sample 1 README | Full README for the `metrica-node` supply-chain sample. Attack: `child_process.spawn` detached process, `Buffer.from(...,'base64')` decodes C2 URL, `new Function.constructor("require", payload)(require)` for RCE. | 2026-11-13 |
| Emmaccen/The-Malware-Museum — Sample 2 README | Full README for the `js-nodecat` variable-masquerading sample. Attack: malicious package assigned to a trusted variable name (`dotenv`). | 2026-11-13 |
| Emmaccen/The-Malware-Museum — Sample 3 README | Full README for the crypto-wallet stealer. Attack: 1,488 spaces of whitespace padding after `module.exports`, custom base64 decoder (strip-first-char salt), wallet/browser credential theft, C2 HTTP POST, `setInterval` persistence. Additional: conditional contract-address swap in React state. | 2026-11-13 |
| Emmaccen/The-Malware-Museum — Sample 4 README | Full README for the DAO credential stealer. Same family as Sample 3 (same C2), different lure. Added: interleaved base64 URL construction, `child_process`/`fs`/`path` listed as npm dependencies. | 2026-11-13 |
| Emmaccen/The-Malware-Museum — Sample 5 README | Full README for the `eslints-logger` typosquat sample. Attack: one-character typo in `package.json` dep, malicious Vite plugin imported in `vite.config.js`, executes at build time with full filesystem access. | 2026-11-13 |
| francesco-oghabi/lazarus-contagious-interview — `docs/01-overview.md` | Campaign overview (Contagious Interview / BeaverTail): two-stage attack, Stage 1 = obfuscated loader in `routes/api/auth.js`, Stage 2 = `eval(message)` from C2. | 2026-11-13 |
| francesco-oghabi/lazarus-contagious-interview — `docs/02-stage1-loader.md` | Deobfuscated Stage-1 loader. Key pattern: `JSON.stringify(process.env)` passed via `URLSearchParams` to C2, then `eval(message)` for RCE. Payload hidden by off-screen whitespace indentation. | 2026-11-13 |
| ReversingLabs graphalgo write-ups (web search snippets) | Campaign summary: fake company publishes GitHub repos with malicious npm deps (`graphnetworkx`, `bigmathutils`). Malicious package imported in `vite.config.js` as a plugin, runs at build time. | 2026-11-13 |

**No payload source code was read; no sample was downloaded to this machine; no cloning occurred.**

### 5. Known gaps these sources revealed
- **Malicious dependencies.** In the "graphalgo" campaign the repo looks clean and the trap is a dependency (`graphnetworkx`, `bigmathutils`). The scanner reads only the repo, so it cannot see this. Fix later with a bundled list of known-bad package names (needs license check, see above).
- **Payloads hidden in config files** (for example a JS config file that loads code): **partially addressed** — `config_file_net` rule (MEDIUM) flags network calls inside vite/webpack/rollup/tailwind/postcss/babel/next/nuxt/jest config files. This catches the `eslints-logger`/graphalgo pattern but not a config file that indirectly triggers a payload at import time without an in-file network call.
- **Contract-address swapping** in crypto dApps: not covered by specific rules. The pattern (a React `useState` with a hidden flag/value pair that swaps the contract address) requires React-aware data-flow analysis. Left as a known gap.
- **No data-flow tracing.** Rules are per line plus a file-level network check, so a payload split across variables or files can slip through.
- **Variable masquerading (Sample 2):** the malicious package is assigned to a trusted variable name. The scanner checks `package.json` dependencies for URL-based or git-based specs; a plain npm package name like `js-nodecat` or `eslints-logger` is not checked. Fix later with a bundled list of known-bad package names.

### 6. New rules added (2026-11-13)
All new rules follow the behavior-based policy from §1: a dangerous combination, not a scary keyword.

| Rule ID | Severity | What it catches | Why it is not a bare keyword |
|---|---|---|---|
| `whitespace_hidden` | HIGH | A line with 500+ leading spaces/tabs followed by non-whitespace. | Catches the off-screen indentation technique from Samples 3, 4 and the Lazarus Stage-1 loader. Normal indented code uses at most ~20 spaces. |
| `process_env_exfil` | HIGH | `JSON.stringify(process.env)` or equivalent full-env serialization in a file that also calls the network. | Requires explicit full-env serialization (not per-key `process.env.DATABASE_URL`) AND a network sink in the same file. Normal Express/Next.js apps that read per-key env vars are not flagged. |
| `builtin_as_dep` | MEDIUM | A Node.js built-in module (`child_process`, `fs`, `crypto`, `path`, etc.) listed in `dependencies` (not `devDependencies`). | Node.js built-ins cannot be installed from npm; listing them as `dependencies` is a known attacker technique (Samples 3 & 4) to give a wrapper package the same name. |
| `config_file_net` | MEDIUM | A network sink (`fetch`, `axios`, `XMLHttpRequest`, etc.) inside a build/config file (vite/webpack/rollup/tailwind/postcss/babel/next/nuxt/jest config). | Build configs run in the developer's environment with full filesystem access; a network call there is almost never legitimate. Requires both the config path AND a network sink in that file. |
| `Function.constructor(` | (extends `decode_exec` and `remote_code_load`) | `Function.constructor(…)` as an alias for `new Function`. | Same lookbehind as the existing `CALL` regex; `page.Function.constructor(` is excluded by the `(?<![\w$.])` lookbehind. |

## Consequences
- **+** The next person (or agent) knows which datasets were looked at, what was read, and under what rules, without redoing the research.
- **+** Rules stay behavior-based, so the scanner does not cry wolf on ordinary web apps.
- **+** No malware or attacker infrastructure enters the repo or the dev machine.
- **−** Fixtures we write ourselves may miss quirks of real samples. We accept that over holding live malware.
- **−** Dataset licenses are still unchecked, so none can be bundled yet.
