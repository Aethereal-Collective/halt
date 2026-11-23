// Pure helpers for the background repo scan (ADR-0011): what the service worker accepts from a tab, and job bookkeeping.

export const ARCHIVE_HOST = "codeload.github.com";
export const ACTIVE_KEY = "scan:active";
export const STALE_MS = 120_000; // a running job with no progress for this long is declared stalled
export const MAX_JOBS = 8; // finished scans kept in memory (chrome.storage.session) for the popup

const SAFE_NAME = /^[\w.-]{1,100}$/;

export const jobKey = (owner, name) => `scan:${owner}/${name}`.toLowerCase();

// A start request must come from a github.com tab and carry an https link on the pinned archive host whose path
// belongs to the same owner/repo. Anything else is rejected before anything is downloaded.
export function validateStart(msg, tabUrl) {
	let tab;
	try {
		tab = new URL(tabUrl);
	} catch {
		return { error: "not_repo" };
	}
	if (tab.protocol !== "https:" || tab.hostname !== "github.com") return { error: "not_repo" };

	const owner = msg?.repo?.owner;
	const name = msg?.repo?.repo;
	if (typeof owner !== "string" || typeof name !== "string" || !SAFE_NAME.test(owner) || !SAFE_NAME.test(name)) return { error: "not_repo" };

	let u;
	try {
		u = new URL(msg.url);
	} catch {
		return { error: "network" };
	}
	const inRepo = u.pathname.toLowerCase().startsWith(`/${owner}/${name}/`.toLowerCase());
	if (u.protocol !== "https:" || u.hostname !== ARCHIVE_HOST || u.port || u.username || u.password || !inRepo) return { error: "network" };
	return { owner, name, url: u.href, key: jobKey(owner, name) };
}

export const isStale = (job, now = Date.now()) => job?.state === "running" && now - job.updatedAt > STALE_MS;

export const clampPct = (n) => (Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0);

// Keys of finished jobs to delete so at most `keep` finished jobs remain (newest kept).
export function pruneKeys(jobs, keep = MAX_JOBS) {
	return jobs
		.filter((j) => j.state !== "running")
		.sort((a, b) => b.startedAt - a.startedAt)
		.slice(keep)
		.map((j) => j.key);
}
