import { REPORT_URL } from "../src/config.js";

// Same language setting as the in-page warnings (content.js reads chrome.storage.local "lang").
const COPY = {
	id: {
		label: { safe: "Tidak ada tanda bahaya", warn: "Hati-hati, situs ini mencurigakan", danger: "Kemungkinan besar phishing" },
		unchecked: "Halaman ini belum diperiksa.",
		report: "Laporkan situs mencurigakan",
		disclaimer: "Bukan jaminan keamanan. Selalu cek ulang alamat situs.",
		langLabel: "Bahasa",
		statusLabel: "Situs ini",
	},
	en: {
		label: { safe: "No signs of danger", warn: "Careful, this site looks suspicious", danger: "Very likely phishing" },
		unchecked: "This page hasn't been checked.",
		report: "Report a suspicious site",
		disclaimer: "Not a security guarantee. Always double-check the site address.",
		langLabel: "Language",
		statusLabel: "This site",
	},
};

// Repo scan copy is shared with the on-page card (src/scan-copy.js, loaded as a classic script in popup.html).
const SCAN_COPY = globalThis.HALT_SCAN_COPY;

const $ = (id) => document.getElementById(id);
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const verdict = tab ? await chrome.runtime.sendMessage({ type: "getTabVerdict", tabId: tab.id }) : null;
let { lang } = await chrome.storage.local.get("lang");

function render() {
	const t = COPY[lang] ?? COPY.id;
	document.documentElement.lang = COPY[lang] ? lang : "id";
	$("statusLabel").textContent = t.statusLabel;
	$("main").className = verdict?.level ?? "";
	$("statusText").textContent = verdict ? t.label[verdict.level] : t.unchecked;
	$("host").textContent = verdict?.host ?? "";
	$("report").textContent = t.report;
	$("disclaimer").textContent = t.disclaimer;
	$("lang").setAttribute("aria-label", t.langLabel);
	renderScan();
	for (const b of $("lang").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.lang === (COPY[lang] ? lang : "id")));
}

$("lang").addEventListener("click", async (e) => {
	const next = e.target.closest("button")?.dataset.lang;
	if (!next || next === lang) return;
	lang = next;
	await chrome.storage.local.set({ lang });
	render();
});

// ---------- Repo scan (ADR-0011) ----------
// The scan runs in the background, so this popup only starts it and then shows the job state kept by the service
// worker. Opening Halt later, on any tab, shows the same result.
// Only on github.com repo pages: the content script answers repoInfo there, other pages have no receiver.
const repo = tab ? await chrome.tabs.sendMessage(tab.id, { type: "repoInfo" }).catch(() => null) : null;
const repoKey = repo ? `scan:${repo.name}`.toLowerCase() : null;
const MAX_SHOWN = 25;
let jobs = []; // newest first
let focusKey = repoKey; // the job shown in detail
let starting = false; // between the click and the first job update
let startError = null; // error from the click itself (no access, another scan running, ...)

const sc = () => SCAN_COPY[COPY[lang] ? lang : "id"];
const jobOf = (key) => jobs.find((j) => j.key === key);
const anyRunning = () => jobs.some((j) => j.state === "running");
const node = (tag, props = {}, ...kids) => {
	const n = Object.assign(document.createElement(tag), props);
	n.append(...kids);
	return n;
};

async function refreshJobs() {
	jobs = (await chrome.runtime.sendMessage({ type: "scanList" }).catch(() => null)) ?? [];
	if (!repo && !jobOf(focusKey)) focusKey = jobs[0]?.key ?? null;
}

function phaseLine(s, job) {
	return job.phase === "scan" ? s.phaseScan(job.done ?? 0, job.total ?? 0) : job.bytes ? s.phaseDownload(Math.round(job.bytes / 1e6)) : s.phaseStart;
}

function renderScan() {
	const s = sc();
	$("repo").hidden = !repo;
	if (repo) {
		const mine = jobOf(repoKey);
		$("repoLabel").textContent = s.label;
		$("repoName").textContent = repo.name;
		$("scan").textContent = starting || mine?.state === "running" ? s.scanning : s.button;
		$("scan").disabled = starting || anyRunning();
	}

	const job = focusKey ? jobOf(focusKey) : null;
	const showError = !job && startError;
	$("scanOut").hidden = !(job || showError);
	const status = $("scanStatus");
	const bar = $("scanBar");
	const list = $("findings");
	status.textContent = "";
	status.className = "scan-status";
	list.replaceChildren();
	bar.hidden = true;
	$("phaseText").textContent = "";
	$("scanNote").textContent = "";
	if (showError) {
		$("outName").textContent = repo?.name ?? "";
		status.append(node("span", { className: "dot" }), s.errors[startError] ?? s.errors.network);
	} else if (job) {
		$("outName").textContent = job.name;
		const dot = node("span", { className: "dot" });
		if (job.state === "running") {
			const pct = job.pct ?? 0;
			status.append(dot, `${s.scanning} ${pct}%`);
			bar.hidden = false;
			bar.value = pct;
			$("phaseText").textContent = phaseLine(s, job);
			$("scanNote").textContent = s.background;
		} else if (job.state === "error") {
			status.append(dot, s.errors[job.error] ?? s.errors.network);
		} else {
			const res = job.result;
			status.classList.add(res.level);
			status.append(dot, s.levels[res.level]);
			for (const f of res.findings.slice(0, MAX_SHOWN)) {
				list.append(
					node("li", {}, node("span", { className: `sev ${f.severity}`, textContent: s.sev[f.severity] }), s.rules[f.rule] ?? f.rule, node("span", { className: "where mono", textContent: `${f.path}:${f.line}` }), node("code", { className: "mono", textContent: f.snippet })),
				);
			}
			if (res.findingsTotal > MAX_SHOWN) list.append(node("li", { textContent: s.more(res.findingsTotal - MAX_SHOWN) }));
			$("scanNote").textContent = globalThis.HALT_SCAN_NOTES(s, res).join(" ");
		}
	}

	$("recent").hidden = jobs.length === 0;
	$("recentLabel").textContent = s.recent;
	$("recentList").replaceChildren(
		...jobs.map((j) => {
			const level = j.state === "running" ? "run" : j.state === "error" ? "" : j.result.level;
			const title = j.state === "running" ? s.scanning : j.state === "error" ? (s.errors[j.error] ?? "") : s.levels[j.result.level];
			const b = node("button", { type: "button", title, onclick: () => ((focusKey = j.key), renderScan()) }, node("span", { className: `lv ${level}` }), j.name);
			b.setAttribute("aria-current", String(j.key === focusKey));
			b.setAttribute("aria-label", `${j.name}: ${title}`);
			return node("li", {}, b);
		}),
	);
}

$("scan").addEventListener("click", async () => {
	starting = true;
	startError = null;
	focusKey = repoKey;
	renderScan();
	const res = await chrome.tabs.sendMessage(tab.id, { type: "repoScan" }).catch(() => ({ ok: false, error: "network" }));
	starting = false;
	if (!res?.ok) startError = res?.error ?? "network";
	await refreshJobs();
	renderScan();
});

// While a scan runs (started here or earlier), follow it. This keeps working after the tab was closed.
setInterval(async () => {
	if (!starting && !anyRunning()) return;
	await refreshJobs();
	renderScan();
}, 700);

$("report").href = REPORT_URL;
await refreshJobs();
render();
