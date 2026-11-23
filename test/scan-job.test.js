import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStart, isStale, clampPct, pruneKeys, jobKey, STALE_MS } from "../extension/src/lib/scan-job.js";

const TAB = "https://github.com/octo/repo/tree/main";
const ok = (url) => validateStart({ repo: { owner: "octo", repo: "repo" }, url }, TAB);

test("accepts the pinned archive host for the same repo, public or with a token", () => {
	const v = ok("https://codeload.github.com/octo/repo/zip/refs/heads/main?token=abc");
	assert.equal(v.error, undefined);
	assert.equal(v.key, "scan:octo/repo");
	assert.ok(v.url.startsWith("https://codeload.github.com/octo/repo/"));
	assert.equal(ok("https://codeload.github.com/Octo/Repo/legacy.zip/main").error, undefined, "owner/repo match is case-insensitive");
});

test("rejects other hosts, schemes, ports, credentials and other repos", () => {
	for (const url of [
		"https://evil.example/octo/repo/zip/main",
		"http://codeload.github.com/octo/repo/zip/main",
		"https://codeload.github.com:8443/octo/repo/zip/main",
		"https://user:pw@codeload.github.com/octo/repo/zip/main",
		"https://codeload.github.com.evil.example/octo/repo/zip/main",
		"https://codeload.github.com/other/repo/zip/main",
		"https://codeload.github.com/octo/repo-two/zip/main",
		"https://github.com/octo/repo/archive/HEAD.zip",
		"javascript:alert(1)",
		"not a url",
		undefined,
	]) {
		assert.equal(ok(url).error, "network", String(url));
	}
});

test("rejects requests that do not come from a github.com tab or carry odd repo names", () => {
	const url = "https://codeload.github.com/octo/repo/zip/main";
	const msg = { repo: { owner: "octo", repo: "repo" }, url };
	for (const tab of ["https://evil.example/", "http://github.com/x/y", "https://github.com.evil.example/x/y", "", undefined]) {
		assert.equal(validateStart(msg, tab).error, "not_repo", String(tab));
	}
	for (const repo of [{ owner: "../x", repo: "repo" }, { owner: "octo", repo: "a b" }, { owner: "octo" }, { owner: 5, repo: "repo" }, null, undefined]) {
		assert.equal(validateStart({ repo, url }, TAB).error, "not_repo", JSON.stringify(repo));
	}
});

test("stale detection only applies to running jobs", () => {
	const now = 1_000_000;
	assert.equal(isStale({ state: "running", updatedAt: now - STALE_MS - 1 }, now), true);
	assert.equal(isStale({ state: "running", updatedAt: now - 1000 }, now), false);
	assert.equal(isStale({ state: "done", updatedAt: 0 }, now), false);
	assert.equal(isStale(undefined, now), false);
});

test("progress is clamped to 0-100 and junk becomes 0", () => {
	assert.deepEqual([clampPct(-5), clampPct(55.6), clampPct(900), clampPct(NaN), clampPct("x")], [0, 56, 100, 0, 0]);
});

test("pruning keeps the newest finished jobs and never touches a running one", () => {
	const jobs = [
		{ key: jobKey("a", "1"), state: "running", startedAt: 1 },
		...Array.from({ length: 10 }, (_, i) => ({ key: jobKey("a", String(i + 2)), state: "done", startedAt: 100 + i })),
	];
	const drop = pruneKeys(jobs, 8);
	assert.deepEqual(drop, ["scan:a/3", "scan:a/2"]);
	assert.ok(!drop.includes("scan:a/1"));
});
