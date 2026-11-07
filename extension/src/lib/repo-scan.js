// Pure static scan of a repository's files for patterns common in "test job" malware aimed at freelancers
// (install-time hooks, obfuscated loaders, credential/wallet theft, exfiltration, auto-run editor tasks).
// Input: [{ path, content }]. Output: { level, findings, skipped }. Nothing is executed or fetched here.
// Advisory only: a clean result is never "safe" (obfuscated code can slip through).

export const SEVERITY = { MEDIUM: "medium", HIGH: "high" };
export const LEVEL = { NONE: "none", WARN: "warn", DANGER: "danger" };

const SKIP_PATH = /(^|\/)(node_modules|\.git)\/|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|poetry\.lock)$|\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|pdf|zip|gz|mp[34]|map)$/i;
const CODE_PATH = /\.(m?js|cjs|jsx|tsx?|py|sh|bash|zsh|ps1|bat|cmd|rb|php|go|java|json|ya?ml|toml|cfg|ini|html?)$/i;
const MAX_LINE = 4000; // Longer lines are only length-checked, not regex-scanned.

const INSTALL_HOOKS = ["preinstall", "install", "postinstall", "prepare", "prepublish", "prepack", "postpack"];
const SUSPICIOUS_CMD = /\b(curl|wget|powershell|pwsh|certutil|bitsadmin|mshta|base64|nc|ncat)\b|node\s+-e|python\d?\s+-c|https?:\/\//i;

// Where stealers look. STRONG targets are specific files/dirs that ordinary app code almost never names
// (case-sensitive on purpose: `res.cookies` in a web app is not a browser cookie store).
const SENSITIVE_STRONG = /(\.ssh[\\/]|\bid_rsa\b|\bid_ed25519\b|\.aws[\\/]credentials|\.git-credentials|\bwallet\.dat\b|\.config[\\/]solana|nkbihfbeogaeaoehlefnkodbefgpgknn|bfnaelmomeimhlpmgjnjophhpkkoljpa|\.bash_history|\.zsh_history|Library[\\/]Keychains|cookies\.sqlite|\blogins\.json\b|\bkey4\.db\b|User Data[\\/]|Google[\\/]Chrome|BraveSoftware|Microsoft[\\/]Edge[\\/]User|Mozilla[\\/]Firefox[\\/]Profiles|Login Data|Local State|Application Support[\\/](Exodus|Electrum|atomic))/;
// WEAK targets are common words in legitimate wallet/dev code; they count only when the same line reads a file
// and the file also talks to the network.
const SENSITIVE_WEAK = /(\.npmrc|\bkeystore\b|\bmnemonic\b|seed\s*phrase|\bExodus\b)/i;
const FS_READ = /\b(readFile(?:Sync)?|createReadStream|copyFile(?:Sync)?|readdir(?:Sync)?|glob(?:Sync)?|shutil\.(?:copy|copytree)|os\.walk|open\s*\(|Get-Content|cat)\b/;
const EXFIL_STRONG = /(discord(?:app)?\.com\/api\/webhooks|api\.telegram\.org\/bot|hooks\.slack\.com\/services)/i;
const EXFIL_HOSTS = /(pastebin\.com\/raw|hastebin|transfer\.sh|webhook\.site|requestbin|pipedream\.net|ngrok(?:-free)?\.(?:io|app|dev)|trycloudflare\.com|serveo\.net)/i;
const NET_SINK = /\b(fetch|axios|XMLHttpRequest|http\.request|https\.request|requests\.(?:get|post)|urllib|socket|WebSocket|curl|wget|Invoke-WebRequest|iwr)\b/i;

// Dependencies from these hosts are normal (SheetJS ships its npm package from its own CDN).
const TRUSTED_DEP_HOSTS = new Set(["cdn.sheetjs.com", "registry.npmjs.org", "registry.yarnpkg.com"]);

// Raw public IPs are a classic C2/exfil target; private, loopback and link-local ranges (SSRF tests, local dev) are not.
function hasPublicRawIp(line) {
	for (const m of line.matchAll(/https?:\/\/(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}(?=[:/\s'"`]|$)/g)) {
		const a = +m[1];
		const b = +m[2];
		if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)) continue;
		return true;
	}
	return false;
}

// `eval`/`exec` as a bare call, not `page.$$eval(`, `re.exec(`, or `obj.eval(`.
const CALL = String.raw`(?<![\w$.])(?:eval|exec|Function)\s*\(`;

// Per-line rules. `test` receives the (possibly truncated) line and returns true on a hit.
const LINE_RULES = [
	{ id: "remote_exec", severity: SEVERITY.HIGH, test: (l) => /\b(curl|wget)\b[^|\n]*\|\s*(sudo\s+)?(sh|bash|zsh|node|python\d?)\b/i.test(l) || /\b(iex|Invoke-Expression)\b.*\b(DownloadString|iwr|Invoke-WebRequest|irm)\b/i.test(l) },
	{ id: "decode_exec", severity: SEVERITY.HIGH, test: (l) => (new RegExp(CALL).test(l) || /\bvm\.runIn\w+\s*\(/.test(l)) && /(atob|b64decode|base64|fromCharCode|\\x[0-9a-f]{2}|unhexlify|zlib\.decompress|marshal\.loads)/i.test(l) },
	{ id: "remote_code_load", severity: SEVERITY.HIGH, test: (l) => new RegExp(`${CALL}.*\\b(fetch|axios|requests\\.get|urlopen|http\\.get)\\b`, "i").test(l) },
	{ id: "obfuscator_signature", severity: SEVERITY.HIGH, test: (l) => (l.match(/\b_0x[0-9a-f]{4,6}\b/g) ?? []).length >= 3 },
	{ id: "exfil_webhook", severity: SEVERITY.HIGH, test: (l) => EXFIL_STRONG.test(l) },
	{ id: "exfil_endpoint", severity: SEVERITY.MEDIUM, test: (l) => EXFIL_HOSTS.test(l) || hasPublicRawIp(l) },
	// A bare eval/new Function is not reported: it is only dangerous with decoded or remote input (rules above).
	{ id: "shell_spawn", severity: SEVERITY.MEDIUM, test: (l) => /(child_process|\bexecSync\b|\bspawnSync\b|os\.system\s*\(|subprocess\.(?:run|Popen|call)\s*\()/.test(l) && /\b(curl|wget|powershell|cmd(?:\.exe)?\s*\/c|bash\s+-c|sh\s+-c|base64|chmod\s+\+x)\b/i.test(l) },
];

export function scanRepo(files) {
	const findings = [];
	let skipped = 0;

	for (const { path, content } of files) {
		if (SKIP_PATH.test(path) || typeof content !== "string") {
			skipped++;
			continue;
		}
		if (/(^|\/)package\.json$/.test(path)) scanPackageJson(path, content, findings);
		if (/(^|\/)\.vscode\/tasks\.json$/.test(path) && /"runOn"\s*:\s*"folderOpen"/.test(content)) {
			findings.push(finding("vscode_autorun", SEVERITY.HIGH, path, lineOf(content, /"runOn"\s*:\s*"folderOpen"/), "runOn: folderOpen"));
		}
		if (!CODE_PATH.test(path)) continue;
		scanLines(path, content, findings);
	}

	const level = findings.some((f) => f.severity === SEVERITY.HIGH) ? LEVEL.DANGER : findings.length ? LEVEL.WARN : LEVEL.NONE;
	findings.sort((a, b) => rank(b.severity) - rank(a.severity) || a.path.localeCompare(b.path) || a.line - b.line);
	return { level, findings, skipped };
}

function scanLines(path, content, out) {
	const lines = content.split(/\r?\n/);
	let hasNet = false;
	const sensitiveHits = [];
	const weakHits = [];
	const seen = new Set(); // one finding per rule per file keeps the report readable

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		if (raw.length > MAX_LINE) {
			if (!seen.has("long_blob") && /[A-Za-z0-9+/=]{800,}/.test(raw.slice(0, 20000))) {
				seen.add("long_blob");
				out.push(finding("long_blob", SEVERITY.MEDIUM, path, i + 1, `${raw.length} chars`));
			}
			continue;
		}
		if (!hasNet && NET_SINK.test(raw)) hasNet = true;
		for (const rule of LINE_RULES) {
			if (seen.has(rule.id) || !rule.test(raw)) continue;
			seen.add(rule.id);
			out.push(finding(rule.id, rule.severity, path, i + 1, raw));
		}
		if (seen.has("sensitive_path") || /^\s*(\/\/|#|\*)/.test(raw)) continue;
		if (SENSITIVE_STRONG.test(raw)) {
			seen.add("sensitive_path");
			sensitiveHits.push(finding("sensitive_path", SEVERITY.MEDIUM, path, i + 1, raw));
		} else if (SENSITIVE_WEAK.test(raw) && FS_READ.test(raw)) {
			weakHits.push(finding("sensitive_path", SEVERITY.HIGH, path, i + 1, raw));
		}
	}
	// Reading credentials/wallet data in a file that also talks to the network is the classic stealer shape.
	// Weak targets (a bare `mnemonic` or `.npmrc` read) are only reported in that combination.
	if (hasNet) for (const f of sensitiveHits) f.severity = SEVERITY.HIGH;
	out.push(...sensitiveHits);
	if (hasNet && !sensitiveHits.length && weakHits.length) out.push(weakHits[0]);
}

function scanPackageJson(path, content, out) {
	let pkg;
	try {
		pkg = JSON.parse(content);
	} catch {
		return;
	}
	for (const name of INSTALL_HOOKS) {
		const cmd = pkg.scripts?.[name];
		if (typeof cmd !== "string") continue;
		const severity = SUSPICIOUS_CMD.test(cmd) ? SEVERITY.HIGH : SEVERITY.MEDIUM;
		out.push(finding("install_hook", severity, path, lineOf(content, new RegExp(`"${name}"\\s*:`)), `${name}: ${cmd}`));
	}
	for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
		for (const [dep, spec] of Object.entries(pkg[section] ?? {})) {
			if (typeof spec === "string" && /^(git\+|git:|github:|https?:)/i.test(spec) && !isTrustedDep(spec)) {
				out.push(finding("remote_dependency", SEVERITY.MEDIUM, path, lineOf(content, new RegExp(`"${escapeRe(dep)}"\\s*:`)), `${dep}: ${spec}`));
			}
		}
	}
}

function isTrustedDep(spec) {
	try {
		return TRUSTED_DEP_HOSTS.has(new URL(spec.replace(/^git\+/, "")).hostname);
	} catch {
		return false; // github:owner/repo and similar shorthands: keep for review
	}
}

const finding = (rule, severity, path, line, snippet) => ({ rule, severity, path, line, snippet: String(snippet).trim().slice(0, 160) });
const rank = (s) => (s === SEVERITY.HIGH ? 1 : 0);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function lineOf(content, re) {
	const m = re.exec(content);
	return m ? content.slice(0, m.index).split("\n").length : 1;
}
