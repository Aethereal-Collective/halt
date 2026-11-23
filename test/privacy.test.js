import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../extension/", import.meta.url);
const sources = () =>
	readdirSync(dir, { recursive: true })
		.filter((f) => /\.(js|html)$/.test(f))
		.map((f) => [f.replaceAll("\\", "/"), readFileSync(new URL(f.replaceAll("\\", "/"), dir), "utf8")]);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const count = (src, re) => (src.match(re) ?? []).length;

// ADR-0005/0008: nothing leaves the device. The only fetches allowed are the extension's own files, plus the two
// user-triggered ones of the repo archive scan (ADR-0011), each pinned to one call site:
//   content.js:   fetch(GH + path, ...)     asks github.com for the archive address (the user's own session)
//   offscreen.js: fetch(archiveUrl, ...)    downloads that archive from the one pinned host
test("extension code makes no network requests beyond the ADR-0011 archive scan", () => {
	const all = sources();
	assert.ok(all.length > 5);
	for (const [f, src] of all) {
		for (const call of src.match(/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(.{0,40}/g) ?? []) {
			const own = /^fetch\(chrome\.runtime\.getURL\(/.test(call);
			const github = f === "src/content.js" && /^fetch\(GH \+ path, /.test(call);
			const archive = f === "src/offscreen.js" && /^fetch\(archiveUrl, /.test(call);
			assert.ok(own || github || archive, `${f}: ${call}`);
		}
	}
});

test("content script only asks github.com for the archive address, on request, and never carries file contents", () => {
	const src = read("src/content.js");
	assert.equal(src.match(/const GH = "([^"]+)"/)?.[1], "https://github.com");
	assert.equal(count(src, /fetch\(GH \+ path/g), 1);
	assert.equal(count(src, /\bghFetch\(/g), 2); // definition + the archive request
	assert.match(src, /h !== "github\.com" && h !== "codeload\.github\.com"/); // redirects may only land on these two hosts
	assert.equal(count(src, /requestArchiveScan\(/g), 2); // definition + the single call inside runScan
	// runScan: definition, popup "repoScan" handler, card Scan button, card Retry button. Nothing calls it on its own.
	assert.equal(count(src, /\brunScan\(/g), 4);
	assert.match(src, /onclick: \(\) => runScan\(c\.repo\)/);
	assert.match(src, /msg\?\.type === "repoScan"/);
	assert.doesNotMatch(src, /raw\.githubusercontent|scanRepoFiles|\bcontent: text\b/);
});

test("offscreen download is pinned to the archive host, sends no cookies, and checks where it landed", () => {
	const src = read("src/offscreen.js");
	assert.match(src, /const ARCHIVE_HOST = "codeload\.github\.com"/);
	assert.equal(count(src, /fetch\(archiveUrl, /g), 1);
	assert.match(src, /credentials: "omit"/);
	assert.match(src, /cache: "no-store"/);
	assert.match(src, /new URL\(r\.url\)\.hostname !== ARCHIVE_HOST/);
	assert.match(src, /u\.protocol !== "https:"/);
});

// Option A of the archive scan: everything stays in memory. Nothing may save, download or persist repo content.
test("no code path can save a scanned repo to disk or hand it to the OS", () => {
	for (const [f, src] of sources()) {
		assert.doesNotMatch(src, /chrome\.downloads|createObjectURL|new Blob\(|showSaveFilePicker|getDirectory\(|indexedDB|localStorage\.setItem|chrome\.storage\.local\.set\(\s*\{\s*scan/, f);
	}
});

test("manifest permissions are exactly what ADR-0011 allows", () => {
	const manifest = JSON.parse(read("manifest.json"));
	assert.deepEqual(manifest.permissions, ["storage", "offscreen"]);
	assert.deepEqual(manifest.host_permissions, ["https://codeload.github.com/*"]);
	const js = manifest.content_scripts[0].js;
	assert.ok(js.indexOf("src/scan-copy.js") >= 0 && js.indexOf("src/scan-copy.js") < js.indexOf("src/content.js"), "copy loads before content.js");
});

test("the background accepts scan results only from the offscreen page", () => {
	const src = read("src/background.js");
	assert.equal(count(src, /fromOffscreen\(sender\)/g), 2); // scanProgress + scanFinished
	assert.match(src, /s\.id === chrome\.runtime\.id && s\.url === OFFSCREEN_URL/);
	assert.match(src, /validateStart\(msg, sender\.tab\?\.url\)/);
});

// Every error code the scan can show needs copy in both languages, otherwise the user sees a raw code or nothing.
test("every scan error code has Indonesian and English copy", async () => {
	await import("../extension/src/scan-copy.js");
	const codes = new Set(["download_denied", "rate_limited", "network", "too_big", "unsupported", "bad_archive", "stalled", "busy", "no_access", "not_repo", "empty"]);
	for (const f of ["src/content.js", "src/background.js", "src/offscreen.js"]) {
		for (const m of read(f).matchAll(/(?:scanError|fail)\("(\w+)"\)|error: "(\w+)"/g)) codes.add(m[1] ?? m[2]);
	}
	for (const lang of ["id", "en"]) {
		for (const code of codes) assert.equal(typeof globalThis.HALT_SCAN_COPY[lang].errors[code], "string", `${lang} copy missing for error "${code}"`);
	}
});
