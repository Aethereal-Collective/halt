import { checkDomain, LEVEL } from "./lib/domain.js";
import { loadModel } from "./lib/model.js";
import { ACTIVE_KEY, MAX_JOBS, clampPct, isStale, jobKey, pruneKeys, validateStart } from "./lib/scan-job.js";
import { REPORT_URL } from "./config.js";

// ponytail: lists ship inside the extension. Add a signed remote list on chrome.alarms once the local list outgrows releases.
let listsPromise;
function loadLists() {
	const names = ["brands", "allowlist", "allowlist-defillama", "blocklist", "blocklist-thirdparty", "model"];
	listsPromise ??= Promise.all(names.map((n) => fetch(chrome.runtime.getURL(`lists/${n}.json`)).then((r) => r.json()))).then(
		([brands, allowlist, defillama, blocklist, thirdParty, model]) => ({
			brands,
			blocklist: new Set([...blocklist, ...thirdParty]),
			// Official sites of live DefiLlama protocols (scripts/build-allowlist.mjs) are never flagged.
			allowlist: new Set([...allowlist, ...defillama, ...brands.flatMap((b) => b.domains)]),
			model: loadModel(model),
		}),
	);
	return listsPromise;
}

const BADGE = {
	[LEVEL.SAFE]: { text: "", color: "#16a34a" },
	[LEVEL.WARN]: { text: "!", color: "#d97706" },
	[LEVEL.DANGER]: { text: "X", color: "#dc2626" },
};

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
	const handler = handlers[msg?.type];
	if (!handler) return false;
	handler(msg, sender).then(reply, () => reply(null));
	return true; // async reply
});

const handlers = {
	async checkDomain({ host }, sender) {
		const verdict = checkDomain(host, await loadLists());
		const tabId = sender.tab?.id;
		if (tabId != null) {
			chrome.action.setBadgeText({ tabId, text: BADGE[verdict.level].text });
			chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE[verdict.level].color });
			await chrome.storage.session.set({ ["tab:" + tabId]: { host, ...verdict } });
		}
		return { ...verdict, reportUrl: REPORT_URL };
	},

	// ---- Repo scan (ADR-0011). The page only hands over a short-lived archive link; the offscreen document does the rest.
	async scanStart(msg, sender) {
		const v = validateStart(msg, sender.tab?.url);
		if (v.error) return { ok: false, error: v.error };
		return serial(async () => {
			const all = await chrome.storage.session.get(null);
			const active = all[ACTIVE_KEY]?.key;
			if (active && all[active]?.state === "running" && !isStale(all[active])) return active === v.key ? { ok: true, started: false } : { ok: false, error: "busy" };

			const job = { jobId: crypto.randomUUID(), key: v.key, name: `${v.owner}/${v.name}`, state: "running", phase: "download", pct: 0, startedAt: Date.now(), updatedAt: Date.now() };
			await chrome.storage.session.set({ [v.key]: job, [ACTIVE_KEY]: { key: v.key } });
			const old = pruneKeys(Object.values(all).filter((j) => j?.jobId && j.key !== v.key));
			if (old.length) await chrome.storage.session.remove(old);
			try {
				await ensureOffscreen();
				const ack = await chrome.runtime.sendMessage({ target: "offscreen", type: "scanArchive", jobId: job.jobId, url: v.url, owner: v.owner, repo: v.name });
				if (!ack?.accepted) throw new Error("not accepted");
			} catch {
				await endJob(job.key, { state: "error", error: "network" });
				return { ok: false, error: "network" };
			}
			return { ok: true, started: true };
		});
	},

	async scanStatus({ owner, name }) {
		if (typeof owner !== "string" || typeof name !== "string") return null;
		const key = jobKey(owner, name);
		return serial(async () => (await expireIfStale((await chrome.storage.session.get(key))[key])) ?? null);
	},

	async scanList() {
		return serial(async () => {
			const all = await chrome.storage.session.get(null);
			const jobs = (await Promise.all(Object.values(all).filter((j) => j?.jobId).map(expireIfStale))).filter(Boolean);
			return jobs.sort((a, b) => b.startedAt - a.startedAt).slice(0, MAX_JOBS);
		});
	},

	async scanProgress(msg, sender) {
		if (!fromOffscreen(sender)) return null;
		return serial(async () => {
			const job = await runningJob(msg.jobId);
			if (job) await writeJob(job.key, { phase: msg.phase === "scan" ? "scan" : "download", pct: clampPct(msg.pct), done: msg.done, total: msg.total, bytes: msg.bytes });
			return { ok: true };
		});
	},

	async scanFinished(msg, sender) {
		if (!fromOffscreen(sender)) return null;
		return serial(async () => {
			const job = await runningJob(msg.jobId);
			if (job) await endJob(job.key, msg.result?.ok ? { state: "done", pct: 100, result: msg.result } : { state: "error", error: typeof msg.error === "string" ? msg.error : "network" });
			return { ok: true };
		});
	},

	async getTabVerdict({ tabId }) {
		return (await chrome.storage.session.get("tab:" + tabId))["tab:" + tabId] ?? null;
	},
};

// ---------- Repo scan job state ----------
const OFFSCREEN_URL = chrome.runtime.getURL("src/offscreen.html");
const fromOffscreen = (s) => s.id === chrome.runtime.id && s.url === OFFSCREEN_URL;

// Handlers that read-modify-write job state run one at a time, so a late progress update cannot overwrite "done".
let lock = Promise.resolve();
const serial = (fn) => (lock = lock.then(fn, fn));

async function ensureOffscreen() {
	const open = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
	if (open.length) return;
	await chrome.offscreen.createDocument({
		url: "src/offscreen.html",
		reasons: ["BLOBS"],
		justification: "Unpack and scan a repository archive in memory while the user keeps browsing.",
	});
}

async function writeJob(key, patch) {
	const job = (await chrome.storage.session.get(key))[key];
	if (!job) return null;
	const next = { ...job, ...patch, updatedAt: Date.now() };
	await chrome.storage.session.set({ [key]: next });
	return next;
}

async function endJob(key, patch) {
	const job = await writeJob(key, patch);
	await chrome.storage.session.remove(ACTIVE_KEY);
	await chrome.offscreen.closeDocument().catch(() => {}); // frees the in-memory archive
	return job;
}

async function runningJob(jobId) {
	const key = (await chrome.storage.session.get(ACTIVE_KEY))[ACTIVE_KEY]?.key;
	const job = key && (await chrome.storage.session.get(key))[key];
	return job?.state === "running" && job.jobId === jobId ? job : null;
}

async function expireIfStale(job) {
	return job && isStale(job) ? await endJob(job.key, { state: "error", error: "stalled" }) : job;
}
