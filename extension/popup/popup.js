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
	for (const b of $("lang").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.lang === (COPY[lang] ? lang : "id")));
}

$("lang").addEventListener("click", async (e) => {
	const next = e.target.closest("button")?.dataset.lang;
	if (!next || next === lang) return;
	lang = next;
	await chrome.storage.local.set({ lang });
	render();
});

$("report").href = REPORT_URL;
render();
