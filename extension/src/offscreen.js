// Offscreen document for the repo scan (ADR-0011). The service worker is killed after ~30 s idle, so the download
// and scan run here, which lets the user close the GitHub tab. Everything stays in memory: nothing is written to
// disk or to a download, nothing is executed, and entry names are only ever shown as text.
import { scanArchive } from "./lib/archive-scan.js";

const ARCHIVE_HOST = "codeload.github.com";
const MAX_ZIP_BYTES = 300_000_000; // compressed; the zip is held in memory, so above this we stop and say so

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
	if (msg?.target !== "offscreen" || msg.type !== "scanArchive" || sender.id !== chrome.runtime.id) return false;
	reply({ accepted: true }); // answer at once; progress and the result come back as separate messages
	run(msg);
	return false;
});

const send = (m) => chrome.runtime.sendMessage(m).catch(() => {});
const fail = (code) => Object.assign(new Error(code), { code });

async function run({ jobId, url, owner, repo }) {
	try {
		const archiveUrl = pinned(url, owner, repo);
		const data = await download(archiveUrl, (bytes, total) => {
			// 0-30% download. Without a Content-Length the bar eases toward 30% instead of guessing a total.
			const pct = total ? (30 * bytes) / total : 30 * (1 - Math.exp(-bytes / 50e6));
			send({ type: "scanProgress", jobId, phase: "download", pct: Math.round(pct), bytes, total });
		});
		let last = 0;
		const result = await scanArchive(data, {
			onProgress: ({ done, total }) => {
				const now = Date.now();
				if (done < total && now - last < 250) return;
				last = now;
				send({ type: "scanProgress", jobId, phase: "scan", pct: 32 + Math.round((66 * done) / Math.max(total, 1)), done, total });
			},
		});
		send({ type: "scanFinished", jobId, result: { ...result, name: `${owner}/${repo}` } });
	} catch (e) {
		const code = e?.code === "zip64" ? "unsupported" : (e?.code ?? "network");
		send({ type: "scanFinished", jobId, error: code });
	}
}

// Only the one pinned host, over https, and only this repo's path. The background checked it too.
function pinned(url, owner, repo) {
	const u = new URL(url);
	if (u.protocol !== "https:" || u.hostname !== ARCHIVE_HOST || u.port || u.username || u.password) throw fail("network");
	if (!u.pathname.toLowerCase().startsWith(`/${owner}/${repo}/`.toLowerCase())) throw fail("network");
	return u.href;
}

async function download(archiveUrl, onBytes) {
	// credentials "omit": the private-repo link carries its own short-lived token, so no cookie is needed or sent.
	const r = await fetch(archiveUrl, { credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" });
	if (new URL(r.url).hostname !== ARCHIVE_HOST) {
		r.body?.cancel().catch(() => {});
		throw fail("network");
	}
	if (!r.ok) {
		r.body?.cancel().catch(() => {});
		throw fail(r.status === 429 ? "rate_limited" : [401, 403, 404].includes(r.status) ? "download_denied" : "network");
	}
	const total = Number(r.headers.get("content-length")) || 0;
	if (total > MAX_ZIP_BYTES) {
		r.body?.cancel().catch(() => {});
		throw fail("too_big");
	}
	const reader = r.body.getReader();
	const chunks = [];
	let bytes = 0;
	let reported = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		bytes += value.length;
		if (bytes > MAX_ZIP_BYTES) {
			reader.cancel().catch(() => {});
			throw fail("too_big");
		}
		chunks.push(value);
		if (Date.now() - reported > 250) {
			reported = Date.now();
			onBytes(bytes, total);
		}
	}
	const data = new Uint8Array(bytes);
	let offset = 0;
	for (const c of chunks) {
		data.set(c, offset);
		offset += c.length;
	}
	onBytes(bytes, total);
	return data;
}
