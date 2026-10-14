import { REPORT_URL } from "../src/config.js";

const LABEL = { safe: "Tidak ada tanda bahaya", warn: "Hati-hati, situs ini mencurigakan", danger: "Kemungkinan besar phishing" };

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const verdict = tab ? await chrome.runtime.sendMessage({ type: "getTabVerdict", tabId: tab.id }) : null;
const el = document.getElementById("status");

if (verdict) {
	el.className = `status ${verdict.level}`;
	el.innerHTML = `<b></b><div class="host"></div>`;
	el.querySelector("b").textContent = LABEL[verdict.level];
	el.querySelector(".host").textContent = verdict.host;
} else {
	el.textContent = "Halaman ini belum diperiksa.";
}
document.getElementById("report").href = REPORT_URL;
