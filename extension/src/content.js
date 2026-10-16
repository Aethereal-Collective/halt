// Isolated-world content script: domain check on load, inject the in-page guard, render warnings.
// Content scripts can't be ES modules, so copy lives here as plain objects (keep id/en keys in sync).

// Language: "id" (default) or "en", chosen in the popup and kept in chrome.storage.local.
const COPY = {
	id: {
		reasons: {
			blocklisted: () => "Situs ini ada di daftar phishing yang sudah dilaporkan.",
			lookalike: (b) => `Alamat situs ini meniru ${b}, tapi bukan situs resmi ${b}.`,
			brand_keyword: (b) => `Alamat ini memakai nama ${b}, tapi bukan domain resmi ${b}.`,
			punycode: () => "Alamat ini memakai huruf mirip (punycode) yang sering dipakai untuk menyamar.",
			ml_suspicious: () => "Pola alamat ini mirip dengan ribuan situs phishing yang sudah dikenal.",
		},
		findings: {
			unlimited_approval: "Situs ini meminta izin TANPA BATAS untuk memindahkan token kamu.",
			approval: "Situs ini meminta izin untuk memindahkan sebagian token kamu.",
			set_approval_for_all: "Situs ini meminta izin memindahkan SEMUA NFT kamu dari koleksi ini.",
			permit2_approve: "Situs ini meminta izin Permit2 untuk memindahkan token kamu.",
			permit_signature: "Tanda tangan ini memberi izin memindahkan token kamu tanpa transaksi on-chain. Banyak penipuan memakai cara ini.",
			seaport_zero_listing: "Tanda tangan ini menjual NFT kamu dan kamu TIDAK menerima apa pun.",
			eth_sign: "Situs meminta tanda tangan mentah (eth_sign). Ini bisa dipakai untuk transaksi apa saja.",
		},
		// What to do next, per finding. Shown under the explanation.
		actions: {
			domain: "Jangan sambungkan wallet atau ketik seed phrase di sini. Buka situs resmi dari bookmark atau ketik alamatnya sendiri.",
			unlimited_approval: "Tolak, kecuali kamu yakin ini situs resmi. Kalau perlu, izinkan sejumlah yang mau kamu pakai saja.",
			approval: "Pastikan jumlah dan penerima izinnya sesuai dengan yang kamu mau.",
			set_approval_for_all: "Tolak. Situs resmi jarang butuh izin untuk semua NFT kamu kecuali saat listing di marketplace.",
			permit2_approve: "Tolak, kecuali kamu yakin ini situs resmi dan penerima izinnya kamu kenal.",
			permit_signature: "Tolak, kecuali kamu yakin ini situs resmi. Tanda tangan ini bisa dipakai menguras token tanpa biaya gas.",
			seaport_zero_listing: "Tolak. Ini pola penipuan umum untuk mencuri NFT.",
			eth_sign: "Tolak. Situs yang sah hampir tidak pernah butuh eth_sign.",
		},
		ui: {
			stop: "Berhenti.",
			phishingTitle: "Situs ini kemungkinan phishing.",
			official: "Situs resminya",
			why: "Kenapa ditandai",
			next: "Yang sebaiknya kamu lakukan",
			leave: "Keluar dari situs ini",
			stay: "Saya paham risikonya, tetap lanjutkan",
			report: "Ini situs resmi? Laporkan kesalahan",
			disclaimer: "Bukan jaminan keamanan. Selalu cek ulang alamat situs.",
			danger: "Bahaya",
			checkTitle: "Periksa dulu sebelum lanjut",
			dangerTitle: "Permintaan berbahaya",
			risk: { critical: "Kritis", high: "Tinggi", medium: "Periksa" },
			spender: "Penerima izin",
			token: "Token/kontrak",
			amount: "Jumlah",
			unlimited: "TANPA BATAS",
			reject: "Tolak",
			allow: "Tetap lanjutkan ke wallet",
			site: "Situs",
		},
	},
	en: {
		reasons: {
			blocklisted: () => "This site is on the list of reported phishing sites.",
			lookalike: (b) => `This address imitates ${b}, but it is not the official ${b} site.`,
			brand_keyword: (b) => `This address uses the name ${b}, but it is not an official ${b} domain.`,
			punycode: () => "This address uses look-alike characters (punycode), a common disguise.",
			ml_suspicious: () => "This address follows the same pattern as thousands of known phishing sites.",
		},
		findings: {
			unlimited_approval: "This site is asking for UNLIMITED permission to move your tokens.",
			approval: "This site is asking for permission to move some of your tokens.",
			set_approval_for_all: "This site is asking for permission to move ALL your NFTs from this collection.",
			permit2_approve: "This site is asking for Permit2 permission to move your tokens.",
			permit_signature: "This signature lets someone move your tokens without an on-chain transaction. Many scams use it.",
			seaport_zero_listing: "This signature sells your NFT and you receive NOTHING.",
			eth_sign: "The site is asking for a raw signature (eth_sign). It can authorize any transaction.",
		},
		actions: {
			domain: "Don't connect your wallet or type your seed phrase here. Open the official site from a bookmark or type the address yourself.",
			unlimited_approval: "Reject unless you're sure this is the official site. If you must, approve only the amount you plan to use.",
			approval: "Check that the amount and the recipient are what you expect.",
			set_approval_for_all: "Reject. Official sites rarely need access to all your NFTs except when listing on a marketplace.",
			permit2_approve: "Reject unless you're sure this is the official site and you recognize the recipient.",
			permit_signature: "Reject unless you're sure this is the official site. This signature can drain tokens without any gas fee.",
			seaport_zero_listing: "Reject. This is a common pattern for stealing NFTs.",
			eth_sign: "Reject. Legitimate sites almost never need eth_sign.",
		},
		ui: {
			stop: "Stop.",
			phishingTitle: "This site is likely phishing.",
			official: "The official site",
			why: "Why it was flagged",
			next: "What to do",
			leave: "Leave this site",
			stay: "I understand the risk, continue anyway",
			report: "Is this an official site? Report a mistake",
			disclaimer: "Not a security guarantee. Always double-check the site address.",
			danger: "Danger",
			checkTitle: "Check before you continue",
			dangerTitle: "Dangerous request",
			risk: { critical: "Critical", high: "High", medium: "Check" },
			spender: "Recipient",
			token: "Token/contract",
			amount: "Amount",
			unlimited: "UNLIMITED",
			reject: "Reject",
			allow: "Continue to wallet anyway",
			site: "Site",
		},
	},
};

let T = COPY.id;
const langReady = chrome.storage.local.get("lang").then(
	({ lang }) => (T = COPY[lang] ?? COPY.id),
	() => T,
);

const host = location.hostname;

chrome.runtime.sendMessage({ type: "checkDomain", host }, (verdict) => {
	if (verdict?.level === "danger") langReady.then(() => onReady(() => showDomainBlock(verdict)));
});

injectGuard();

function injectGuard() {
	const s = document.createElement("script");
	s.type = "module";
	s.src = chrome.runtime.getURL("src/inpage.js");
	(document.head || document.documentElement).appendChild(s);
	s.onload = () => s.remove();
}

window.addEventListener("message", (e) => {
	if (e.source !== window || e.data?.source !== "aethereal-shield-inpage" || e.data.type !== "confirm") return;
	const { id, finding } = e.data;
	langReady.then(() => showTxModal(finding)).then((allow) => window.postMessage({ source: "aethereal-shield-content", id, allow }, location.origin));
});

// ---------- UI ----------
// Halt look: monochrome ink/paper like aethereal.top, one red accent for risk, Plus Jakarta Sans bundled in fonts/.

const MARK = `<svg viewBox="0 0 100 124" aria-hidden="true"><path d="M0 14 L12 8 V86 Q6 80 0 70Z"/><path d="M20 6 L42 0 V114 Q28 104 20 94Z"/><path d="M50 0 L100 12 V70 Q94 104 50 124Z"/></svg>`;
const RISK_COLOR = { critical: "#ef4444", high: "#f97316", medium: "#eab308" };

let fontLoaded = false;
function loadFont() {
	// @font-face is ignored inside shadow roots, so the bundled font is registered on the page under a private name.
	if (fontLoaded) return;
	fontLoaded = true;
	try {
		const face = new FontFace("HaltSans", `url(${chrome.runtime.getURL("fonts/PlusJakartaSans.woff2")}) format("woff2")`, { weight: "200 800" });
		document.fonts.add(face);
		face.load().catch(() => {});
	} catch {
		// Falls back to the system font.
	}
}

const STYLE = `
	:host { all: initial; }
	* { box-sizing: border-box; margin: 0; }
	.root { position: fixed; inset: 0; z-index: 2147483647; font: 400 15px/1.55 HaltSans, ui-sans-serif, system-ui, sans-serif; color: #f0f0f0; -webkit-font-smoothing: antialiased; }
	.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
	.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; letter-spacing: -0.04em; }
	.brand svg { width: 16px; height: 20px; fill: #f0f0f0; }
	.pill { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #a3a3a3; }
	.dot { width: 7px; height: 7px; border-radius: 50%; }
	.label { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #737373; }
	.primary { appearance: none; border: 0; cursor: pointer; font: 700 15px/1 HaltSans, ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.01em; color: #0a0a0a; background: #f0f0f0; border-radius: 999px; padding: 15px 26px; transition: background .15s; }
	.primary:hover { background: #ffffff; }
	.text-btn { appearance: none; border: 0; background: none; cursor: pointer; font: 500 13px/1.4 HaltSans, ui-sans-serif, system-ui, sans-serif; color: #737373; text-decoration: underline; text-underline-offset: 3px; padding: 6px 0; }
	.text-btn:hover { color: #d4d4d4; }
	button:focus-visible, a:focus-visible { outline: 2px solid #f0f0f0; outline-offset: 3px; }
	a { color: #a3a3a3; text-underline-offset: 3px; }

	/* Full-page block for phishing domains */
	.page { background: #0a0a0a; overflow: auto; }
	.page .wrap { max-width: 760px; min-height: 100%; margin: 0 auto; padding: 32px 32px 28px; display: flex; flex-direction: column; }
	.page header { display: flex; justify-content: space-between; align-items: center; }
	.page main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 56px 0 40px; }
	.host { font-size: 14px; color: #a3a3a3; word-break: break-all; }
	.stop { font-size: clamp(64px, 11vw, 112px); line-height: .95; font-weight: 800; letter-spacing: -0.06em; margin: 18px 0 14px; background: linear-gradient(180deg, #ffffff 0%, #8a8a8a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
	.title { font-size: clamp(22px, 3vw, 30px); font-weight: 700; letter-spacing: -0.035em; line-height: 1.2; }
	.official { margin-top: 14px; font-size: 15px; color: #a3a3a3; }
	.official b { color: #f0f0f0; font-weight: 600; }
	.section { margin-top: 36px; border-top: 1px solid #262626; padding-top: 16px; }
	.reasons { list-style: none; padding: 0; margin-top: 6px; }
	.reasons li { display: grid; grid-template-columns: 36px 1fr; padding: 12px 0; border-bottom: 1px solid #1c1c1c; color: #d4d4d4; }
	.reasons li span { color: #525252; font-size: 13px; padding-top: 2px; }
	.next { margin-top: 8px; color: #d4d4d4; max-width: 56ch; }
	.actions { margin-top: 36px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
	.page footer { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; border-top: 1px solid #1c1c1c; padding-top: 16px; font-size: 12px; color: #525252; }

	/* Transaction modal */
	.modal { background: rgba(10, 10, 10, .72); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 16px; }
	.panel { width: 100%; max-width: 440px; background: #0f0f0f; border: 1px solid #262626; border-radius: 22px; padding: 24px; box-shadow: 0 40px 120px -20px rgba(0, 0, 0, .8); }
	.panel header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 18px; border-bottom: 1px solid #1c1c1c; }
	.panel .kicker { margin-top: 20px; }
	.panel .finding { margin-top: 8px; font-size: 21px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.3; }
	.facts { margin-top: 18px; border-top: 1px solid #1c1c1c; }
	.facts div { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid #1c1c1c; font-size: 13px; }
	.facts dt { color: #737373; }
	.facts dd { color: #e5e5e5; text-align: right; word-break: break-all; }
	.panel .next { margin-top: 16px; font-size: 14px; color: #a3a3a3; }
	.panel .primary { width: 100%; margin-top: 22px; padding: 16px; }
	.panel .text-btn { display: block; margin: 10px auto 0; }
	.panel .meta { margin-top: 14px; text-align: center; font-size: 11px; color: #525252; overflow-wrap: anywhere; }
`;

function mount(kind) {
	loadFont();
	const el = document.createElement("aethereal-shield");
	const root = el.attachShadow({ mode: "closed" });
	root.innerHTML = `<style>${STYLE}</style><div class="root ${kind}"></div>`;
	document.documentElement.appendChild(el);
	return { box: root.querySelector(".root"), close: () => el.remove() };
}

const brand = () => `<div class="brand">${MARK}<span>halt</span></div>`;
const pill = (color, text) => `<span class="pill"><span class="dot" style="background:${color}"></span>${esc(text)}</span>`;
const short = (v) => (/^0x[0-9a-fA-F]{40}$/.test(v) ? `${v.slice(0, 6)}…${v.slice(-4)}` : v);

function showDomainBlock(verdict) {
	const { box, close } = mount("page");
	const official = verdict.reasons.find((r) => r.official)?.official;
	const reasons = verdict.reasons.map((r, i) => `<li><span class="mono">${String(i + 1).padStart(2, "0")}</span>${esc(T.reasons[r.code]?.(r.brand) ?? r.code)}</li>`).join("");
	box.innerHTML = `<div class="wrap">
		<header>${brand()}${pill(RISK_COLOR.critical, T.ui.danger)}</header>
		<main>
			<p class="host mono">${esc(host)}</p>
			<h1 class="stop">${esc(T.ui.stop)}</h1>
			<h2 class="title">${esc(T.ui.phishingTitle)}</h2>
			${official ? `<p class="official">${esc(T.ui.official)}: <b class="mono">${esc(official)}</b></p>` : ""}
			<div class="section"><p class="label">${esc(T.ui.why)}</p><ul class="reasons">${reasons}</ul></div>
			<div class="section"><p class="label">${esc(T.ui.next)}</p><p class="next">${esc(T.actions.domain)}</p></div>
			<div class="actions"><button class="primary" data-a="back">${esc(T.ui.leave)} →</button><button class="text-btn" data-a="stay">${esc(T.ui.stay)}</button></div>
		</main>
		<footer><span>${esc(T.ui.disclaimer)}</span><a href="${esc(verdict.reportUrl)}" target="_blank" rel="noopener noreferrer">${esc(T.ui.report)}</a></footer>
	</div>`;
	box.querySelector('[data-a="back"]').onclick = () => location.replace("about:blank");
	box.querySelector('[data-a="stay"]').onclick = close;
	box.querySelector('[data-a="back"]').focus({ focusVisible: false });
}

function showTxModal(finding) {
	return new Promise((resolve) => {
		const { box, close } = mount("modal");
		const d = finding.details || {};
		const facts = [
			d.spender && [T.ui.spender, short(d.spender), d.spender],
			d.token && [T.ui.token, short(d.token), d.token],
			d.amount && [T.ui.amount, d.amount === "unlimited" ? T.ui.unlimited : d.amount, d.amount],
		]
			.filter(Boolean)
			.map(([k, v, full]) => `<div><dt>${esc(k)}</dt><dd class="mono" title="${esc(full)}">${esc(v)}</dd></div>`)
			.join("");
		box.innerHTML = `<div class="panel" role="alertdialog" aria-modal="true">
			<header>${brand()}${pill(RISK_COLOR[finding.risk] ?? RISK_COLOR.high, T.ui.risk[finding.risk] ?? finding.risk)}</header>
			<p class="label kicker">${esc(finding.risk === "medium" ? T.ui.checkTitle : T.ui.dangerTitle)}</p>
			<p class="finding">${esc(T.findings[finding.code] ?? finding.code)}</p>
			${facts ? `<dl class="facts">${facts}</dl>` : ""}
			${T.actions[finding.code] ? `<p class="next">${esc(T.actions[finding.code])}</p>` : ""}
			<button class="primary" data-a="reject">${esc(T.ui.reject)}</button>
			<button class="text-btn" data-a="allow">${esc(T.ui.allow)}</button>
			<p class="meta">${esc(T.ui.site)}: <span class="mono">${esc(host)}</span> · ${esc(T.ui.disclaimer)}</p>
		</div>`;
		const done = (allow) => (close(), resolve(allow));
		box.querySelector('[data-a="reject"]').onclick = () => done(false);
		box.querySelector('[data-a="allow"]').onclick = () => done(true);
		box.querySelector('[data-a="reject"]').focus({ focusVisible: false });
	});
}

function onReady(fn) {
	document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();
}

function esc(s) {
	return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
