// Builds Chrome Web Store images in dist/store/ from real UI screenshots.
// Run: npm run store-assets   (captures with the E2E first, then composes)
import puppeteer from "puppeteer-core";
import { readFileSync, copyFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../dist/store/", import.meta.url);
const RAW = new URL("raw/", OUT);
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync(OUT, { recursive: true });

const img = (name) => `data:image/png;base64,${readFileSync(new URL(name, RAW)).toString("base64")}`;
const font = `data:font/woff2;base64,${readFileSync(new URL("../extension/fonts/PlusJakartaSans.woff2", import.meta.url)).toString("base64")}`;
const MARK = `<svg viewBox="0 0 100 124" fill="currentColor"><path d="M0 14 L12 8 V86 Q6 80 0 70Z"/><path d="M20 6 L42 0 V114 Q28 104 20 94Z"/><path d="M50 0 L100 12 V70 Q94 104 50 124Z"/></svg>`;

const BASE = `@font-face{font-family:H;src:url(${font}) format("woff2");font-weight:200 800}
	*{box-sizing:border-box;margin:0}
	body{width:var(--w);height:var(--h);overflow:hidden;background:#0a0a0a;color:#f0f0f0;font-family:H,sans-serif;-webkit-font-smoothing:antialiased}
	.brand{display:flex;align-items:center;gap:.3em;font-weight:800;letter-spacing:-.05em}
	.brand svg{height:1em;width:auto}
	.chrome{background:linear-gradient(180deg,#fff 0%,#8a8a8a 100%);-webkit-background-clip:text;background-clip:text;color:transparent}`;

const COPY = {
	id: {
		modal: ["Transaction Guard", "Tahan transaksi berbahaya sebelum kamu tanda tangan.", "Izin tanpa batas, Permit, listing NFT seharga nol: Halt menahannya dan menjelaskan akibatnya."],
		popup: ["Status situs", "Cek status setiap situs, sekali klik.", "Semua pemeriksaan berjalan di perangkat kamu. Tidak ada data yang dikirim."],
		tagline: "Blokir phishing kripto & transaksi wallet berbahaya.",
	},
	en: {
		modal: ["Transaction Guard", "Hold dangerous transactions before you sign.", "Unlimited approvals, Permit, zero-price NFT listings: Halt holds them and explains what they would do."],
		popup: ["Site status", "Check any site's status in one click.", "Every check runs on your device. Nothing is sent anywhere."],
		tagline: "Block crypto phishing & dangerous wallet transactions.",
	},
};

// Caption on the left, UI on the right.
const feature = ([eyebrow, title, body], visual) => `<style>${BASE}
	body{--w:1280px;--h:800px;display:grid;grid-template-columns:520px 1fr;align-items:center;padding:0 0 0 80px}
	.eyebrow{font-size:14px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#737373}
	h1{margin-top:18px;font-size:54px;line-height:1.05;font-weight:800;letter-spacing:-.05em}
	p{margin-top:22px;font-size:20px;line-height:1.5;color:#a3a3a3;max-width:26ch}
	.brand{position:absolute;left:80px;top:56px;font-size:26px}
	.visual{height:800px;display:flex;align-items:center;justify-content:center}</style>
	<div class="brand">${MARK}<span>halt</span></div>
	<div><div class="eyebrow">${eyebrow}</div><h1 class="chrome">${title}</h1><p>${body}</p></div>
	<div class="visual">${visual}</div>`;

const modalVisual = (lang) => `<img src="${img(lang === "en" ? "panel-unlimited-approval-en.png" : "panel-unlimited-approval.png")}" style="width:480px;border-radius:22px;box-shadow:0 40px 120px -20px #000">`;
const popupVisual = (lang) => `<img src="${img(`popup-${lang}.png`)}" style="width:420px;border-radius:18px;border:1px solid #262626;box-shadow:0 40px 120px -20px #000">`;

const promo = (size, w, h) => `<style>${BASE}
	body{--w:${w}px;--h:${h}px;display:flex;flex-direction:column;justify-content:center;padding:0 ${Math.round(w * 0.09)}px;background:radial-gradient(circle at 85% 20%,#2a2a2a,#0a0a0a 60%)}
	.brand{font-size:${size}px}
	p{margin-top:${Math.round(size * 0.35)}px;font-size:${Math.round(size * 0.24)}px;color:#a3a3a3;font-weight:500;max-width:22ch;line-height:1.35}
	.by{position:absolute;right:${Math.round(w * 0.06)}px;bottom:${Math.round(h * 0.1)}px;font-size:${Math.round(size * 0.18)}px;color:#525252;font-weight:600}</style>
	<div class="brand">${MARK}<span class="chrome">halt</span></div><p>${COPY.id.tagline}</p><div class="by">by æthereal</div>`;

const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
async function render(html, w, h, file) {
	await p.setViewport({ width: w, height: h });
	await p.setContent(`<!doctype html><meta charset="utf-8">${html}`, { waitUntil: "load" });
	await p.evaluate(() => document.fonts.ready);
	await p.screenshot({ path: new URL(file, OUT).pathname.slice(1) });
	console.log(file);
}

for (const lang of ["id", "en"]) {
	copyFileSync(new URL(lang === "en" ? "overlay-lookalike-en.png" : "overlay-lookalike.png", RAW), new URL(`${lang}-1-domain-block.png`, OUT));
	console.log(`${lang}-1-domain-block.png`);
	await render(feature(COPY[lang].modal, modalVisual(lang)), 1280, 800, `${lang}-2-transaction-guard.png`);
	await render(feature(COPY[lang].popup, popupVisual(lang)), 1280, 800, `${lang}-3-popup.png`);
}
await render(promo(72, 440, 280), 440, 280, "promo-small-440x280.png");
await render(promo(150, 1400, 560), 1400, 560, "promo-marquee-1400x560.png");
await b.close();
