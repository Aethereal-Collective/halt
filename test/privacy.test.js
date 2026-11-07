import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../extension/", import.meta.url);
const sources = () =>
	readdirSync(dir, { recursive: true })
		.filter((f) => /\.(js|html)$/.test(f))
		.map((f) => [f.replaceAll("\\", "/"), readFileSync(new URL(f.replaceAll("\\", "/"), dir), "utf8")]);

// ADR-0005/0008: nothing leaves the device. The only fetches allowed are the extension's own files, plus
// ADR-0009's single user-triggered GitHub reader in content.js (`fetch(GH + path, ...)`).
test("extension code makes no network requests beyond the ADR-0009 GitHub reader", () => {
	const all = sources();
	assert.ok(all.length > 5);
	for (const [f, src] of all) {
		for (const call of src.match(/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(.{0,40}/g) ?? []) {
			const own = /^fetch\(chrome\.runtime\.getURL\(/.test(call);
			const github = f === "src/content.js" && /^fetch\(GH \+ path, /.test(call);
			assert.ok(own || github, `${f}: ${call}`);
		}
	}
});

test("GitHub reader is pinned to github.com, runs only on popup request, and checks redirect hosts", () => {
	const src = readFileSync(new URL("src/content.js", dir), "utf8");
	assert.equal(src.match(/const GH = "([^"]+)"/)?.[1], "https://github.com");
	assert.equal((src.match(/fetch\(GH \+ path/g) ?? []).length, 1);
	// ghFetch is the only caller, and scanning starts only from the popup's "repoScan" message.
	assert.equal((src.match(/\bghFetch\(/g) ?? []).length, 3); // definition + tree list + raw file
	assert.equal((src.match(/scanCurrentRepo\(/g) ?? []).length, 2); // definition + the single call inside runScan
	// runScan: definition, popup "repoScan" handler, card Scan button, card Retry button. Nothing calls it on its own.
	assert.equal((src.match(/\brunScan\(/g) ?? []).length, 4);
	assert.match(src, /onclick: \(\) => runScan\(c\.repo\)/);
	assert.match(src, /msg\?\.type === "repoScan"/);
	assert.match(src, /h !== "github\.com" && h !== "raw\.githubusercontent\.com"/);
});

test("manifest requests no host permissions", () => {
	const manifest = JSON.parse(readFileSync(new URL("manifest.json", dir), "utf8"));
	assert.equal(manifest.host_permissions, undefined);
	assert.deepEqual(manifest.permissions, ["storage"]);
});
