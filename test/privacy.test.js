import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// ADR-0005/0008: nothing leaves the device. The only fetch allowed is of the extension's own files.
test("extension code makes no network requests", () => {
	const dir = new URL("../extension/", import.meta.url);
	const files = readdirSync(dir, { recursive: true }).filter((f) => /\.(js|html)$/.test(f));
	assert.ok(files.length > 5);
	for (const f of files) {
		const src = readFileSync(new URL(f.replaceAll("\\", "/"), dir), "utf8");
		for (const call of src.match(/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(.{0,40}/g) ?? []) {
			assert.match(call, /^fetch\(chrome\.runtime\.getURL\(/, `${f}: ${call}`);
		}
	}
});
