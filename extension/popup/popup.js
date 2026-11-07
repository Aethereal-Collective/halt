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

// ---------- Repo scan ----------
// Only on github.com repo pages: the content script answers repoInfo there, other pages have no receiver.
const repo = tab ? await chrome.tabs.sendMessage(tab.id, { type: "repoInfo" }).catch(() => null) : null;
let scanState = null; // null | "busy" | { ok, ... } result from the content script
let scanPct = 0;
const MAX_SHOWN = 25;

function renderScan() {
	$("repo").hidden = !repo;
	if (!repo) return;
	const s = SCAN_COPY[COPY[lang] ? lang : "id"];
	$("repoLabel").textContent = s.label;
	$("repoName").textContent = repo.name;
	$("scan").textContent = scanState === "busy" ? `${s.scanning} ${scanPct}%` : s.button;
	const bar = $("scanBar");
	bar.hidden = scanState !== "busy";
	bar.firstElementChild.style.width = `${scanPct}%`;
	bar.setAttribute("aria-valuenow", String(scanPct));
	$("scan").disabled = scanState === "busy";
	const status = $("scanStatus");
	const list = $("findings");
	list.replaceChildren();
	$("scanNote").textContent = "";
	status.textContent = "";
	status.className = "scan-status";
	if (!scanState || scanState === "busy") return;

	const dot = Object.assign(document.createElement("span"), { className: "dot" });
	if (!scanState.ok) {
		status.append(dot, s.errors[scanState.error] ?? s.errors.network);
		return;
	}
	status.classList.add(scanState.level);
	status.append(dot, s.levels[scanState.level]);
	for (const f of scanState.findings.slice(0, MAX_SHOWN)) {
		const li = document.createElement("li");
		const sev = Object.assign(document.createElement("span"), { className: `sev ${f.severity}`, textContent: s.sev[f.severity] });
		const where = Object.assign(document.createElement("span"), { className: "where mono", textContent: `${f.path}:${f.line}` });
		const code = Object.assign(document.createElement("code"), { className: "mono", textContent: f.snippet });
		li.append(sev, s.rules[f.rule] ?? f.rule, where, code);
		list.append(li);
	}
	if (scanState.findings.length > MAX_SHOWN) {
		list.append(Object.assign(document.createElement("li"), { textContent: s.more(scanState.findings.length - MAX_SHOWN) }));
	}
	$("scanNote").textContent = [s.stats(scanState.fetched, scanState.total), scanState.partial && s.partial, s.note].filter(Boolean).join(" ");
}

// The content script reports progress while it reads files; the same scan also shows on the page.
chrome.runtime.onMessage.addListener((msg) => {
	if (msg?.type !== "repoProgress" || scanState !== "busy") return;
	scanPct = msg.pct;
	renderScan();
});

$("scan").addEventListener("click", async () => {
	scanState = "busy";
	scanPct = 0;
	renderScan();
	scanState = await chrome.tabs.sendMessage(tab.id, { type: "repoScan" }).catch(() => ({ ok: false, error: "network" }));
	renderScan();
});

$("report").href = REPORT_URL;
render();
