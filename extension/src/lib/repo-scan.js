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

// Node.js built-in modules that have no business being listed as npm dependencies.
// When an attacker needs child_process / fs for their payload they sometimes list them in package.json
// to make require('child_process') look like a declared dependency (Samples 3 & 4).
const NODE_BUILTINS_AS_DEP = new Set(["child_process", "fs", "crypto", "path", "os", "net", "http", "https", "dgram"]);

// Build / config files that run in the developer's environment. Network calls here almost never happen
// in a legitimate project (eslints-logger / graphalgo pattern — Sample 5, graphalgo campaign).
// `.config` is required: ordinary modules such as `src/lib/next.ts` or `utils/vite.js` are not build configs.
const CONFIG_PATH = /(^|\/)(vite|webpack|rollup|tailwind|postcss|babel|next|nuxt|astro|svelte|jest|vitest)\.config\.[cm]?[jt]s$/i;

// `process.env` being *serialized* (not just read per-key) and sent to the network is the
// BeaverTail / Stage-1 Lazarus pattern (the entire secret store exfiltrated in one call).
// We match explicit full-env serialization on a single line: JSON.stringify(process.env),
// spreading process.env into a serialized object, qs/querystring stringification, or base64
// encoding of the whole env — but NOT per-key access like process.env.DATABASE_URL.
// Gaps are bounded ({0,200}) on purpose: this runs on untrusted files, and an unbounded `[^)]*` inside a
// repeated prefix backtracks cubically (50 crafted lines took ~1.8 s).
const PROCESS_ENV_SERIAL = /JSON\.stringify\s*\(\s*(process\.env\b|\{[^}]{0,200}\.\.\.\s*process\.env\b)|URLSearchParams\s*\(\s*\{[^}]{0,200}process\.env\b|(?:qs|querystring)\.stringify\s*\(\s*process\.env\b|(?:btoa|Buffer\.from)\s*\([^)]{0,200}JSON\.stringify\s*\([^)]{0,200}process\.env\b/;

// Serializing the env is routine in build and debug code: webpack/vite `define` blocks and log lines.
// Those lines never count as the "serialize" half of an exfil.
const ENV_SERIAL_BENIGN = /DefinePlugin|\bdefine\s*:|['"`]process\.env['"`]\s*:|\b(?:console|logger|log)\.\w+\s*\(/;
// The serialization must sit within this many lines of a network call. A file that serializes env in one
// place and calls fetch hundreds of lines away is an ordinary server, not a one-shot exfil.
const ENV_NET_WINDOW = 5;

// Decode expressions that produce a string — the "decode" half of a split decode+exec.
// Narrowed to patterns that explicitly convert encoded data to executable string form:
//   - atob(  — always decodes base64 to string
//   - Buffer.from(..., 'base64').toString(  — the base64 argument must be present to avoid
//     flagging Buffer.from(x).toString('binary') used for image/binary manipulation
//   - String.fromCharCode( — char-code array to string
// We do NOT match a bare `base64` word — too broad.
const DECODE_EXPR = /\batob\s*\(|Buffer\.from\s*\([^)]{0,200}['"`]base64['"`][^)]{0,200}\)\s*\.toString\s*\(|String\.fromCharCode\s*\(/i;

// Bare eval/exec/Function call — the "exec" half of a split decode+exec.
// Same lookbehind as CALL to exclude re.exec(, page.$$eval(, obj.eval(.
const EXEC_CALL = new RegExp(String.raw`(?<![\w$.])(?:eval|Function(?:\.constructor)?)\s*\(`);

// Contract-address concatenation inside a conditional with multiple conditions (`&&`): `"0x" + var`
// as argument to a setter call (Sample 3). Legitimate DeFi code uses full address constants.
// Splitting "0x" and the hex part via concatenation hidden behind a flag AND value check is the
// attack pattern. Requiring `&&` avoids flagging simple formatters like
// `if (!prefixed) setAddr("0x" + addr)` which have a single condition.
// Two separate regexes are used so nested calls like `.toFixed(5)` inside the if-condition don't
// break the `[^)]*` match — HAS_IF_AND looks for the && anywhere on the line; HAS_SETTER_0X
// looks for a function call receiving "0x" + something.
const HAS_IF_AND = /\bif\s*\(.*&&/;
const HAS_SETTER_0X = /\w+\s*\(\s*["'`]0x["'`]\s*\+/;

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

// `eval`/`exec`/`new Function` as a bare call, not `page.$$eval(`, `re.exec(`, or `obj.eval(`.
// Also matches `Function.constructor(` (a lesser-known alias for `new Function`).
const CALL = String.raw`(?<![\w$.])(?:eval|exec|Function(?:\.constructor)?)\s*\(`;

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
	// Config files (vite/webpack/rollup/tailwind/postcss/next/nuxt) that contain network calls are almost
	// never legitimate; this is the eslints-logger / graphalgo pattern (a malicious Vite plugin loaded at
	// build time gets full filesystem access). We only report it inside a file whose path matches CONFIG_PATH
	// (checked in scanLines via the `isConfig` flag). A single bare import from a package is not flagged;
	// we require an actual network sink.
	{ id: "config_file_net", severity: SEVERITY.MEDIUM, _configOnly: true, test: (l) => NET_SINK.test(l) },
	// Contract-address swap: `"0x" + var` to a setter inside an `if` with `&&` (Sample 3).
	// Full address constants are the norm; "0x" + hidden-var behind a multi-condition flag/value
	// check is the attack signature. Two-regex approach handles nested calls in the if-condition.
	{ id: "addr_concat_swap", severity: SEVERITY.MEDIUM, test: (l) => HAS_IF_AND.test(l) && HAS_SETTER_0X.test(l) },
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
		const isConfig = CONFIG_PATH.test(path);
		scanLines(path, content, findings, isConfig);
	}

	const level = findings.some((f) => f.severity === SEVERITY.HIGH) ? LEVEL.DANGER : findings.length ? LEVEL.WARN : LEVEL.NONE;
	findings.sort((a, b) => rank(b.severity) - rank(a.severity) || a.path.localeCompare(b.path) || a.line - b.line);
	return { level, findings, skipped };
}

function scanLines(path, content, out, isConfig = false) {
	const lines = content.split(/\r?\n/);
	let hasNet = false;
	let envSerialLine = -1; // 0-based index of the first non-benign full-env serialization
	const netLines = []; // 0-based indexes of lines containing a network call
	// Multi-line decode+exec tracking: record the first line number where each half appears.
	// If both halves are present but on different lines, emit decode_exec_split (MEDIUM).
	// If they're on the same line, decode_exec (HIGH) already fires via LINE_RULES.
	let decodeLineNo = -1;  // line index (0-based) of first decode expression
	let execLineNo = -1;    // line index (0-based) of first bare eval/Function call
	const sensitiveHits = [];
	const weakHits = [];
	const seen = new Set(); // one finding per rule per file keeps the report readable

	for (let i = 0; i < lines.length; i++) {
		let raw = lines[i];
		// Whitespace-hidden code: a line with 500+ leading spaces/tabs followed by non-whitespace.
		// This is the off-screen indentation technique used in Samples 3, 4, and the Lazarus loader to
		// hide a payload past the visible end of the file. Counted before the length cap below, so padding
		// that pushes a line past MAX_LINE cannot be used to skip the check.
		const lead = /^[ \t]*/.exec(raw)[0].length;
		if (lead >= 500 && lead < raw.length && !/\s/.test(raw[lead]) && !seen.has("whitespace_hidden")) {
			seen.add("whitespace_hidden");
			out.push(finding("whitespace_hidden", SEVERITY.HIGH, path, i + 1, `${lead} leading spaces before code`));
		}
		// After a long padding the real code may fit in MAX_LINE: scan that part instead of skipping the line.
		if (raw.length > MAX_LINE && lead >= 500 && raw.length - lead <= MAX_LINE) raw = raw.slice(lead);
		if (raw.length > MAX_LINE) {
			if (!seen.has("long_blob") && /[A-Za-z0-9+/=]{800,}/.test(raw.slice(0, 20000))) {
				seen.add("long_blob");
				out.push(finding("long_blob", SEVERITY.MEDIUM, path, i + 1, `${raw.length} chars`));
			}
			continue;
		}
		if (NET_SINK.test(raw)) {
			hasNet = true;
			netLines.push(i);
		}
		if (envSerialLine < 0 && PROCESS_ENV_SERIAL.test(raw) && !ENV_SERIAL_BENIGN.test(raw)) envSerialLine = i;
		// Track multi-line decode+exec halves (skip comment lines).
		if (!/^\s*(\/\/|#|\*)/.test(raw)) {
			if (decodeLineNo < 0 && DECODE_EXPR.test(raw)) decodeLineNo = i;
			if (execLineNo < 0 && EXEC_CALL.test(raw)) execLineNo = i;
		}
		for (const rule of LINE_RULES) {
			if (seen.has(rule.id)) continue;
			// config_file_net only fires inside build-config files
			if (rule._configOnly && !isConfig) continue;
			if (!rule.test(raw)) continue;
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
	// Serializing the entire process.env and sending it to the network is the BeaverTail/Lazarus
	// Stage-1 pattern (all JWT_SECRET, DB URI, cloud keys sent in a single call). We require an
	// explicit full-env serialization (not per-key access like process.env.DATABASE_URL) that is not in a
	// define/log line AND a network call within ENV_NET_WINDOW lines of it.
	if (envSerialLine >= 0 && netLines.some((n) => Math.abs(n - envSerialLine) <= ENV_NET_WINDOW)) {
		out.push(finding("process_env_exfil", SEVERITY.HIGH, path, envSerialLine + 1, lines[envSerialLine]));
	}
	// Multi-line decode+exec: a decode expression on one line and a bare eval/Function on a different
	// line in the same file. Weaker than same-line (which fires decode_exec HIGH via LINE_RULES), so
	// MEDIUM. Only emitted when decode_exec did NOT already fire (same-line case already covered).
	if (decodeLineNo >= 0 && execLineNo >= 0 && decodeLineNo !== execLineNo && !seen.has("decode_exec")) {
		const reportLine = Math.min(decodeLineNo, execLineNo) + 1;
		out.push(finding("decode_exec_split", SEVERITY.MEDIUM, path, reportLine, "decode expression and eval/Function call on separate lines"));
	}
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
			// Node.js built-in modules listed as npm deps is a strong indicator of an attacker
			// wrapping or masking require('child_process') etc. behind a fake package (Samples 3 & 4).
			// devDependencies are excluded: some scaffolding tools do add these.
			if (section === "dependencies" && NODE_BUILTINS_AS_DEP.has(dep)) {
				out.push(finding("builtin_as_dep", SEVERITY.MEDIUM, path, lineOf(content, new RegExp(`"${escapeRe(dep)}"\\s*:`)), `${dep} is a Node.js built-in listed as an npm dependency`));
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
