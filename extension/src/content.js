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
let LANG = "id";
const langReady = chrome.storage.local.get("lang").then(
	({ lang }) => ((LANG = COPY[lang] ? lang : "id"), (T = COPY[LANG])),
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

// ---------- GitHub repo scan (ADR-0009) ----------
// Runs only when the popup asks (user clicked "Scan"). Reads files from github.com with the user's own session, so
// private repos they can open work too. The only hosts contacted are github.com and the raw.githubusercontent.com
// redirect GitHub itself issues. File contents go to the service worker for scanning and nowhere else.
const GH = "https://github.com";
const SCAN_LIMITS = { files: 200, fileBytes: 200_000, totalBytes: 3_000_000, concurrency: 6 };
const NOT_A_REPO = new Set(["settings", "orgs", "organizations", "marketplace", "features", "topics", "explore", "notifications", "login", "sponsors", "pulls", "issues", "new", "search", "about", "pricing", "enterprise", "collections", "trending", "apps", "users", "codespaces", "dashboard", "account", "security", "readme", "customer-stories", "resources", "solutions", "site"]);
const SCAN_TEXT = /\.(m?js|cjs|jsx|tsx?|py|sh|bash|ps1|bat|cmd|rb|php|go|java|json|ya?ml|toml|cfg|ini|html?)$|(^|\/)(Makefile|Dockerfile|\.npmrc)$/i;
const SCAN_SKIP = /(^|\/)(node_modules|\.git)\/|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/;
const SCAN_FIRST = [/(^|\/)package\.json$/, /(^|\/)\.vscode\/tasks\.json$/, /(^|\/)(setup\.py|Makefile|Dockerfile|\.npmrc)$/, /(^|\/)(config|server|app|index|main|utils?|helpers?|lib)[^/]*\.(m?js|cjs|ts|py)$/i];

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
	if (msg?.type === "repoInfo") {
		const r = currentRepo();
		reply(r && { name: `${r.owner}/${r.repo}` });
		return false;
	}
	if (msg?.type === "repoScan") {
		const r = currentRepo();
		if (!r) return reply({ ok: false, error: "not_repo" }), false;
		runScan(r).then(reply);
		return true; // async reply
	}
	return false;
});

function currentRepo() {
	if (location.hostname !== "github.com") return null;
	const [owner, repo, kind, ref] = location.pathname.split("/").filter(Boolean);
	const safe = /^[\w.-]+$/;
	if (!owner || !repo || NOT_A_REPO.has(owner.toLowerCase()) || !safe.test(owner) || !safe.test(repo)) return null;
	return { owner, repo, ref: (kind === "tree" || kind === "blob") && ref && safe.test(ref) ? ref : "HEAD" };
}

const scanError = (code) => Object.assign(new Error(code), { code });

async function ghFetch(path, headers) {
	const r = await fetch(GH + path, { credentials: "same-origin", headers });
	const h = new URL(r.url).hostname;
	if (h !== "github.com" && h !== "raw.githubusercontent.com") throw scanError("network");
	return r;
}

async function listRepoFiles({ owner, repo, ref }) {
	const r = await ghFetch(`/${owner}/${repo}/tree-list/${encodeURIComponent(ref)}`, { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" });
	if (r.status === 404) throw scanError("no_access");
	if (r.status === 429) throw scanError("rate_limited");
	if (!r.ok) throw scanError("unsupported");
	const j = await r.json().catch(() => null);
	const list = j?.paths ?? j?.items ?? j?.tree;
	if (!Array.isArray(list)) throw scanError("unsupported");
	return list.map((x) => (typeof x === "string" ? x : x?.path)).filter((p) => typeof p === "string");
}

// onProgress({ pct, phase, done, total }): 0-5% listing, 5-92% reading files, 92-100% analysis.
async function scanCurrentRepo(repo, onProgress = () => {}) {
	onProgress({ pct: 0, phase: "list", done: 0, total: 0 });
	const all = await listRepoFiles(repo);
	const wanted = all.filter((p) => SCAN_TEXT.test(p) && !SCAN_SKIP.test(p));
	const prio = (p) => {
		const i = SCAN_FIRST.findIndex((re) => re.test(p));
		return i < 0 ? SCAN_FIRST.length : i;
	};
	const queue = wanted.sort((a, b) => prio(a) - prio(b)).slice(0, SCAN_LIMITS.files);
	const total = queue.length;
	let done = 0;
	const tick = () => onProgress({ pct: 5 + Math.round((87 * done) / Math.max(total, 1)), phase: "files", done, total });
	tick();

	const files = [];
	let bytes = 0;
	let limited = false;
	const worker = async () => {
		for (let p; (p = queue.shift()) !== undefined && !limited && bytes < SCAN_LIMITS.totalBytes; ) {
			try {
				const r = await ghFetch(`/${repo.owner}/${repo.repo}/raw/${encodeURIComponent(repo.ref)}/${p.split("/").map(encodeURIComponent).join("/")}`);
				if (r.status === 429) limited = true;
				if (!r.ok || Number(r.headers.get("content-length")) > SCAN_LIMITS.fileBytes) continue;
				const content = await r.text();
				if (content.length > SCAN_LIMITS.fileBytes) continue;
				bytes += content.length;
				files.push({ path: p, content });
			} catch {
				// Skip unreadable files; the scan reports how many it could read.
			}
			done++;
			tick();
		}
	};
	await Promise.all(Array.from({ length: SCAN_LIMITS.concurrency }, worker));

	if (!files.length) throw scanError(limited ? "rate_limited" : all.length ? "unsupported" : "empty");
	onProgress({ pct: 92, phase: "analyze", done: total, total });
	const result = await chrome.runtime.sendMessage({ type: "scanRepoFiles", files });
	if (!result) throw scanError("network");
	return { ok: true, name: `${repo.owner}/${repo.repo}`, ...result, fetched: files.length, total: all.length, partial: limited || files.length < wanted.length };
}

// ---------- On-page scan card ----------
// A small card (bottom-right) on repo pages: offers the scan, shows live progress, then the findings.
// Copy comes from src/scan-copy.js. Scanning starts only from a click (card button or popup button), never by itself.
const CARD_CSS = `
	.card { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; width: min(360px, calc(100vw - 32px)); max-height: calc(100vh - 40px); overflow-y: auto; background: #0f0f0f; border: 1px solid #262626; border-radius: 18px; padding: 18px; font: 400 14px/1.5 HaltSans, ui-sans-serif, system-ui, sans-serif; color: #f0f0f0; -webkit-font-smoothing: antialiased; box-shadow: 0 24px 80px -16px rgba(0, 0, 0, .7); }
	.card header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid #1c1c1c; }
	.card .repo { margin-top: 14px; font-size: 12px; color: #737373; word-break: break-all; }
	.card .heading { margin-top: 6px; font-size: 18px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.3; }
	.card .body { margin-top: 8px; font-size: 13px; color: #a3a3a3; }
	.card .primary { width: 100%; margin-top: 16px; padding: 13px; font-size: 14px; }
	.card .text-btn { display: block; margin: 8px auto 0; }
	.bar { margin-top: 16px; height: 6px; border-radius: 999px; background: #262626; overflow: hidden; }
	.bar span { display: block; height: 100%; width: 0; background: #f0f0f0; border-radius: 999px; transition: width .2s; }
	@media (prefers-reduced-motion: reduce) { .bar span { transition: none; } }
	.pct { margin-top: 10px; display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: #d4d4d4; }
	.pct b { font-weight: 700; }
	.list { list-style: none; padding: 0; margin-top: 10px; max-height: 240px; overflow-y: auto; }
	.list li { padding: 9px 0; border-bottom: 1px solid #1c1c1c; font-size: 12px; color: #d4d4d4; }
	.list .sev { display: inline-block; margin-right: 6px; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #eab308; }
	.list .sev.high { color: #ef4444; }
	.list .where, .list code { display: block; margin-top: 3px; color: #737373; word-break: break-all; }
	.list code { color: #a3a3a3; font-size: 11px; white-space: pre-wrap; }
`;
const LEVEL_COLOR = { danger: RISK_COLOR.critical, warn: RISK_COLOR.medium, none: "#22c55e" };
const SCAN_SHOWN = 12;

let card = null; // { el, box, key, repo }
let activeScan = null; // { key, promise }

const SC = () => globalThis.HALT_SCAN_COPY[LANG];
const repoKey = (r) => `${r.owner}/${r.repo}`;

function h(tag, props = {}, ...kids) {
	const el = Object.assign(document.createElement(tag), props);
	el.append(...kids.filter((k) => k != null && k !== false));
	return el;
}

function ensureCard(repo) {
	const key = repoKey(repo);
	if (card?.key === key && card.el.isConnected) return card;
	card?.el.remove();
	loadFont();
	const el = document.createElement("aethereal-shield-scan");
	const root = el.attachShadow({ mode: "closed" });
	root.innerHTML = `<style>${STYLE}${CARD_CSS}</style><section class="card" role="region"></section>`;
	document.documentElement.appendChild(el);
	card = { el, key, repo, box: root.querySelector(".card") };
	return card;
}

function cardHeader(color, label) {
	const head = h("header");
	head.innerHTML = brand() + pill(color, label);
	return head;
}

function dismissCard(c) {
	try {
		sessionStorage.setItem(`halt-scan-dismissed:${c.key}`, "1");
	} catch {
		// Storage can be blocked; the card will simply reappear on reload.
	}
	c.el.remove();
	if (card === c) card = null;
}

function renderPrompt(c) {
	const S = SC();
	c.box.replaceChildren(
		cardHeader("#a3a3a3", S.label),
		h("p", { className: "repo mono", textContent: c.key }),
		h("p", { className: "heading", textContent: S.promptTitle }),
		h("p", { className: "body", textContent: S.promptBody }),
		h("button", { className: "primary", type: "button", textContent: S.button, onclick: () => runScan(c.repo) }),
		h("button", { className: "text-btn", type: "button", textContent: S.later, onclick: () => dismissCard(c) }),
	);
}

function renderProgress(c) {
	const S = SC();
	c.pctText = h("b", { textContent: "0%" });
	c.phaseText = h("span", { textContent: S.phaseList });
	c.barFill = h("span");
	const bar = h("div", { className: "bar", role: "progressbar" }, c.barFill);
	bar.setAttribute("aria-label", S.scanning);
	bar.setAttribute("aria-valuemin", "0");
	bar.setAttribute("aria-valuemax", "100");
	bar.setAttribute("aria-valuenow", "0");
	c.bar = bar;
	c.box.replaceChildren(
		cardHeader("#a3a3a3", S.label),
		h("p", { className: "repo mono", textContent: c.key }),
		h("p", { className: "heading", textContent: S.scanning }),
		bar,
		h("p", { className: "pct" }, c.phaseText, c.pctText),
		h("p", { className: "body", textContent: S.slow }),
	);
}

function updateProgress(c, p) {
	if (!c.bar) return;
	const S = SC();
	c.barFill.style.width = `${p.pct}%`;
	c.bar.setAttribute("aria-valuenow", String(p.pct));
	c.pctText.textContent = `${p.pct}%`;
	c.phaseText.textContent = p.phase === "files" ? S.phaseFiles(p.done, p.total) : p.phase === "analyze" ? S.phaseAnalyze : S.phaseList;
}

function renderResult(c, res) {
	const S = SC();
	const items = res.findings.slice(0, SCAN_SHOWN).map((f) =>
		h(
			"li",
			{},
			h("span", { className: `sev ${f.severity}`, textContent: S.sev[f.severity] }),
			S.rules[f.rule] ?? f.rule,
			h("span", { className: "where mono", textContent: `${f.path}:${f.line}` }),
			h("code", { className: "mono", textContent: f.snippet }),
		),
	);
	if (res.findings.length > SCAN_SHOWN) items.push(h("li", { textContent: S.more(res.findings.length - SCAN_SHOWN) }));
	const note = [S.stats(res.fetched, res.total), res.partial && S.partial, S.note].filter(Boolean).join(" ");
	c.bar = null;
	c.box.replaceChildren(
		cardHeader(LEVEL_COLOR[res.level], S.levels[res.level]),
		h("p", { className: "repo mono", textContent: c.key }),
		items.length ? h("ul", { className: "list" }, ...items) : null,
		h("p", { className: "body", textContent: note }),
		h("button", { className: "primary", type: "button", textContent: S.close, onclick: () => dismissCard(c) }),
	);
}

function renderError(c, code) {
	const S = SC();
	c.bar = null;
	c.box.replaceChildren(
		cardHeader(RISK_COLOR.high, S.label),
		h("p", { className: "repo mono", textContent: c.key }),
		h("p", { className: "heading", textContent: S.errors[code] ?? S.errors.network }),
		h("button", { className: "primary", type: "button", textContent: S.retry, onclick: () => runScan(c.repo) }),
		h("button", { className: "text-btn", type: "button", textContent: S.close, onclick: () => dismissCard(c) }),
	);
}

// Single entry point for a user-requested scan (card button or popup button). Joins a scan already running for the same repo.
function runScan(repo) {
	const key = repoKey(repo);
	if (activeScan?.key === key) return activeScan.promise;
	const promise = (async () => {
		await langReady;
		const c = ensureCard(repo);
		renderProgress(c);
		const report = (p) => {
			updateProgress(c, p);
			try {
				chrome.runtime.sendMessage({ type: "repoProgress", pct: p.pct }).catch(() => {});
			} catch {
				// Popup closed or extension reloaded: progress on the page card is enough.
			}
		};
		try {
			const res = await scanCurrentRepo(repo, report);
			renderResult(c, res);
			return res;
		} catch (e) {
			const code = e?.code ?? "network";
			renderError(c, code);
			return { ok: false, error: code };
		} finally {
			activeScan = null;
		}
	})();
	activeScan = { key, promise };
	return promise;
}

// GitHub navigates without page loads (Turbo), so re-check on its events plus a light poll.
function syncScanCard() {
	const r = currentRepo();
	const key = r && repoKey(r);
	if (card?.key === key) {
		if (!card.el.isConnected) document.documentElement.appendChild(card.el);
		return;
	}
	card?.el.remove();
	card = null;
	if (!r) return;
	let dismissed = false;
	try {
		dismissed = sessionStorage.getItem(`halt-scan-dismissed:${key}`) === "1";
	} catch {
		// Treat blocked storage as "not dismissed".
	}
	if (dismissed) return;
	langReady.then(() => {
		const now = currentRepo();
		if (now && repoKey(now) === key && !card) renderPrompt(ensureCard(now));
	});
}

if (location.hostname === "github.com") {
	onReady(syncScanCard);
	document.addEventListener("turbo:load", syncScanCard);
	window.addEventListener("popstate", syncScanCard);
	setInterval(syncScanCard, 1000);
}
