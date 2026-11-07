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

### 4. Sources consulted (2026-11-08)
All are **reference only**. Nothing from them is bundled, copied or ingested, and their licenses were **not** checked yet. What we actually read: the Malware Museum README and its repository file list (names, sizes, hashes), and web search snippets. No sample source file was read, nothing was cloned or downloaded, and the saved file list was deleted.

| Source | What it is | Use for us |
|---|---|---|
| [Emmaccen/The-Malware-Museum](https://github.com/Emmaccen/The-Malware-Museum) | 5 real "take-home assessment" malware samples with READMEs (supply chain via a malicious npm dependency, variable masquerading, obfuscated crypto-wallet stealer with contract-address swap, DAO credential stealer, typosquatted logger). | Best match for our threat. Use the README descriptions to design fixtures. Do not copy code. |
| [francesco-oghabi/lazarus-contagious-interview](https://github.com/francesco-oghabi/lazarus-contagious-interview) | One trojanized repo (live malware, samples isolated as `.txt`). | Reference only. |
| [OpenSourceMalware/PolinRider](https://github.com/OpenSourceMalware/PolinRider) | Technical dossier on a DPRK actor tied to Contagious Interview. | Technique reference. |
| [DataDog/malicious-software-packages-dataset](https://github.com/datadog/malicious-software-packages-dataset) | About 1,400 human-vetted malicious npm/PyPI packages. | Candidate for a bundled package-name list. Check license and format first. |
| Microsoft, ReversingLabs ("graphalgo"), The Hacker News write-ups | Campaign analyses of fake recruiter attacks. | Technique reference. |

### 5. Known gaps these sources revealed
- **Malicious dependencies.** In the "graphalgo" campaign the repo looks clean and the trap is a dependency (`graphnetworkx`, `bigmathutils`). The scanner reads only the repo, so it cannot see this. Fix later with a bundled list of known-bad package names (needs license check, see above).
- **Payloads hidden in config files** (for example a JS config file that loads code) and **contract-address swapping** in crypto dApps are not covered by specific rules yet.
- **No data-flow tracing.** Rules are per line plus a file-level network check, so a payload split across variables or files can slip through.

## Consequences
- **+** The next person (or agent) knows which datasets were looked at, what was read, and under what rules, without redoing the research.
- **+** Rules stay behavior-based, so the scanner does not cry wolf on ordinary web apps.
- **+** No malware or attacker infrastructure enters the repo or the dev machine.
- **−** Fixtures we write ourselves may miss quirks of real samples. We accept that over holding live malware.
- **−** Dataset licenses are still unchecked, so none can be bundled yet.
