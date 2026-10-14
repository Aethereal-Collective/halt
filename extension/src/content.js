// Isolated-world content script: domain check on load, inject the in-page guard, render warnings.
// Content scripts can't be ES modules, so copy lives here as plain objects.

const COPY = {
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
};

const host = location.hostname;

chrome.runtime.sendMessage({ type: "checkDomain", host }, (verdict) => {
	if (verdict?.level === "danger") onReady(() => showDomainBlock(verdict));
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
	showTxModal(finding).then((allow) => window.postMessage({ source: "aethereal-shield-content", id, allow }, location.origin));
});

// ---------- UI ----------

function mount() {
	const el = document.createElement("aethereal-shield");
	const root = el.attachShadow({ mode: "closed" });
	root.innerHTML = `<style>
		.backdrop{position:fixed;inset:0;z-index:2147483647;background:rgba(9,9,11,.92);display:flex;align-items:center;justify-content:center;padding:16px;font:15px/1.5 system-ui,sans-serif;color:#fafafa}
		.card{max-width:480px;width:100%;background:#18181b;border:1px solid #3f3f46;border-radius:16px;padding:24px}
		h2{margin:0 0 8px;font-size:20px} .danger h2{color:#f87171} .warn h2{color:#fbbf24}
		ul{padding-left:18px;margin:8px 0} .todo{margin-top:12px;padding:12px;border-radius:10px;background:#27272a;color:#d4d4d8;font-size:14px}
		.row{display:flex;gap:8px;margin-top:20px;flex-wrap:wrap} button{flex:1;min-width:140px;padding:10px 14px;border-radius:10px;border:0;font:inherit;cursor:pointer}
		.primary{background:#fafafa;color:#09090b;font-weight:600} .ghost{background:transparent;color:#a1a1aa;border:1px solid #3f3f46}
		.foot{margin-top:12px;font-size:12px;color:#71717a} .foot a{color:#a1a1aa}
	</style><div class="backdrop"><div class="card"></div></div>`;
	document.documentElement.appendChild(el);
	return { card: root.querySelector(".card"), close: () => el.remove() };
}

function showDomainBlock(verdict) {
	const { card, close } = mount();
	card.classList.add("danger");
	const reasons = verdict.reasons.map((r) => `<li>${esc(COPY.reasons[r.code]?.(r.brand) ?? r.code)}</li>`).join("");
	card.innerHTML = `<h2>⚠️ Situs ini kemungkinan phishing</h2>
		<p><b>${esc(host)}</b></p><ul>${reasons}</ul>
		<div class="todo">${esc(COPY.actions.domain)}</div>
		<div class="row"><button class="primary" data-a="back">Keluar dari situs ini</button><button class="ghost" data-a="stay">Saya paham risikonya, lanjutkan</button></div>
		<div class="foot">Aethereal Shield · bukan jaminan keamanan, selalu cek ulang alamat situs.<br><a href="${esc(verdict.reportUrl)}" target="_blank" rel="noopener noreferrer">Ini situs resmi? Laporkan kesalahan</a></div>`;
	card.querySelector('[data-a="back"]').onclick = () => location.replace("about:blank");
	card.querySelector('[data-a="stay"]').onclick = close;
}

function showTxModal(finding) {
	return new Promise((resolve) => {
		const { card, close } = mount();
		card.classList.add(finding.risk === "medium" ? "warn" : "danger");
		const d = finding.details || {};
		const facts = [d.spender && `Penerima izin: ${d.spender}`, d.token && `Token/kontrak: ${d.token}`, d.amount && `Jumlah: ${d.amount === "unlimited" ? "TANPA BATAS" : d.amount}`]
			.filter(Boolean)
			.map((f) => `<li>${esc(f)}</li>`)
			.join("");
		card.innerHTML = `<h2>${finding.risk === "medium" ? "Periksa dulu sebelum lanjut" : "⚠️ Permintaan berbahaya"}</h2>
			<p>${esc(COPY.findings[finding.code] ?? finding.code)}</p><ul>${facts}</ul>
			${COPY.actions[finding.code] ? `<div class="todo">${esc(COPY.actions[finding.code])}</div>` : ""}
			<div class="row"><button class="primary" data-a="reject">Tolak</button><button class="ghost" data-a="allow">Lanjutkan ke wallet</button></div>
			<div class="foot">Situs: ${esc(host)} · Aethereal Shield · bukan jaminan keamanan</div>`;
		const done = (allow) => (close(), resolve(allow));
		card.querySelector('[data-a="reject"]').onclick = () => done(false);
		card.querySelector('[data-a="allow"]').onclick = () => done(true);
	});
}

function onReady(fn) {
	document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();
}

function esc(s) {
	return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
