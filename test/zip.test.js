import { test } from "node:test";
import assert from "node:assert/strict";
import { listEntries, readEntry, ZipError } from "../extension/src/lib/zip.js";
import { makeZip } from "./helpers/make-zip.js";

const text = (u8) => new TextDecoder().decode(u8);

test("lists entries and reads deflated and stored files, including UTF-8 names and a zip comment", async () => {
	const zip = makeZip(
		[
			{ name: "repo-abc/", data: "", method: 0 },
			{ name: "repo-abc/a.js", data: "const a = 1;\n".repeat(50) },
			{ name: "repo-abc/b.txt", data: "stored", method: 0 },
			{ name: "repo-abc/résumé.md", data: "ok" },
		],
		"a zip comment, like the commit id codeload adds",
	);
	const entries = listEntries(zip);
	assert.deepEqual(entries.map((e) => e.name), ["repo-abc/", "repo-abc/a.js", "repo-abc/b.txt", "repo-abc/résumé.md"]);
	assert.equal(text(await readEntry(zip, entries[1], 1e6)), "const a = 1;\n".repeat(50));
	assert.equal(text(await readEntry(zip, entries[2], 1e6)), "stored");
	assert.equal(text(await readEntry(zip, entries[3], 1e6)), "ok");
});

test("an entry that declares more than the limit is skipped without being unpacked", async () => {
	const zip = makeZip([{ name: "big.js", data: "x".repeat(5000) }]);
	assert.equal(await readEntry(zip, listEntries(zip)[0], 1000), null);
});

test("zip bomb: data that inflates past its declared size is rejected", async () => {
	const zip = makeZip([{ name: "bomb.js", data: "A".repeat(5_000_000), declaredSize: 10 }]);
	await assert.rejects(readEntry(zip, listEntries(zip)[0], 1000), (e) => e instanceof ZipError && e.code === "bad_archive");
});

test("data shorter than its declared size is rejected", async () => {
	const zip = makeZip([{ name: "short.js", data: "tiny", declaredSize: 500 }]);
	await assert.rejects(readEntry(zip, listEntries(zip)[0], 1000), (e) => e.code === "bad_archive");
});

test("encrypted and unsupported-method entries return null", async () => {
	const zip = makeZip([
		{ name: "enc.js", data: "x", flags: 0x0801 },
		{ name: "bz.js", data: "x", method: 12 },
	]);
	const [enc, bz] = listEntries(zip);
	assert.equal(await readEntry(zip, enc, 1000), null);
	assert.equal(await readEntry(zip, bz, 1000), null);
});

test("garbage, truncated and empty input throw bad_archive", () => {
	const zip = makeZip([{ name: "a.js", data: "const a = 1;" }]);
	for (const bad of [new Uint8Array(0), new Uint8Array(100), zip.subarray(0, zip.length - 10), new Uint8Array(zip.length).fill(7)]) {
		assert.throws(() => listEntries(bad), (e) => e instanceof ZipError && e.code === "bad_archive");
	}
});

test("a central directory that points outside the file is rejected", () => {
	const zip = makeZip([{ name: "a.js", data: "x" }]);
	const bad = zip.slice();
	new DataView(bad.buffer).setUint32(bad.length - 22 + 16, 0x7fffffff, true); // cd offset past the end
	assert.throws(() => listEntries(bad), (e) => e.code === "bad_archive");
});

test("zip64 markers are reported as zip64, not misread", () => {
	const zip = makeZip([{ name: "a.js", data: "x" }]);
	const bad = zip.slice();
	new DataView(bad.buffer).setUint32(bad.length - 22 + 16, 0xffffffff, true);
	assert.throws(() => listEntries(bad), (e) => e.code === "zip64");
});

test("an entry whose local header offset is wrong throws instead of reading garbage", async () => {
	const zip = makeZip([{ name: "a.js", data: "const a = 1;" }]);
	const [e] = listEntries(zip);
	await assert.rejects(readEntry(zip, { ...e, offset: 5 }, 1000), (err) => err.code === "bad_archive");
});
