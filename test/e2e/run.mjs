// E2E: real Chrome (set CHROME_PATH) + unpacked extension, checks the MVP acceptance criteria.
// Run: npm run e2e. Needs openssl on PATH. SHOTS=<dir> also saves store screenshots.
// All traffic goes through a local proxy that serves the test dApp for every host and records each
// host contacted, so we can prove the extension itself never talks to the network.
import puppeteer from "puppeteer-core";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { readFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DAPP = readFileSync(join(ROOT, "test/dapp/index.html"));
const SHOTS = process.env.SHOTS || process.argv[2]; // screenshot folder (env or first argument)
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

// Throwaway self-signed cert so HTTPS-only hosts (HSTS) can be served locally.
const tmp = mkdtempSync(join(tmpdir(), "shield-e2e-"));
execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(tmp, "key.pem"), "-out", join(tmp, "cert.pem"), "-days", "1", "-subj", "/CN=test"], { stdio: "ignore", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
const contacted = new Set();
const visited = new Set();
const proxy = http.createServer((req, res) => (contacted.add(new URL(req.url).hostname), res.writeHead(200, { "content-type": "text/html" }).end(DAPP)));
const serve = (req, res) => res.writeHead(200, { "content-type": "text/html" }).end(DAPP);
const tls = https.createServer({ key: readFileSync(join(tmp, "key.pem")), cert: readFileSync(join(tmp, "cert.pem")) }, serve);
await new Promise((r) => tls.listen(0, "127.0.0.1", r));
// HTTPS pages tunnel to the local TLS server.
proxy.on("connect", (req, sock) => {
	contacted.add(req.url.split(":")[0]);
	const up = net.connect(tls.address().port, "127.0.0.1", () => (sock.write("HTTP/1.1 200 OK\r\n\r\n"), up.pipe(sock), sock.pipe(up)));
	up.on("error", () => sock.destroy());
	sock.on("error", () => up.destroy());
});
await new Promise((r) => proxy.listen(0, "127.0.0.1", r));
const PORT = proxy.address().port;

const browser = await puppeteer.launch({
	executablePath: CHROME,
	headless: true,
	pipe: true,
	enableExtensions: true,
	args: [`--proxy-server=http://127.0.0.1:${PORT}`, "--proxy-bypass-list=<-loopback>", "--ignore-certificate-errors"],
});
const extId = await browser.installExtension(join(ROOT, "extension"));
console.log("extension", extId);

const results = [];
const check = (name, ok, extra = "") => (results.push(ok), console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, name) => SHOTS && page.screenshot({ path: join(SHOTS, `${name}.png`) });

// Closed shadow root: only CDP with pierce can see inside.
async function shieldButton(page, action) {
	const cdp = await page.createCDPSession();
	const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
	const find = (n) => (n.nodeName === "BUTTON" && n.attributes?.includes(action) ? n : [...(n.children || []), ...(n.shadowRoots || [])].map(find).find(Boolean));
	const node = find(root);
	if (!node) return null;
	return async () => {
		const { model } = await cdp.send("DOM.getBoxModel", { nodeId: node.nodeId });
		const [x1, y1, , , x2, y2] = model.border;
		await page.mouse.click((x1 + x2) / 2, (y1 + y2) / 2);
	};
}
// Screenshot just one element of the closed shadow root (found by class), for the store listing.
async function shotPart(page, cls, name) {
	if (!SHOTS) return;
	const cdp = await page.createCDPSession();
	const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
	const find = (n) => (n.attributes?.some((a) => a.split(" ").includes(cls)) ? n : [...(n.children || []), ...(n.shadowRoots || [])].map(find).find(Boolean));
	const { model } = await cdp.send("DOM.getBoxModel", { nodeId: find(root).nodeId });
	const [x1, y1, , , x2, y2] = model.border;
	await page.screenshot({ path: join(SHOTS, `${name}.png`), clip: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } });
}
const overlayShown = (page) => page.evaluate(() => !!document.querySelector("aethereal-shield"));
// All text inside the closed shadow root, via CDP.
async function shieldText(page) {
	const cdp = await page.createCDPSession();
	const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
	const out = [];
	const walk = (n) => (n.nodeType === 3 && out.push(n.nodeValue), [...(n.children || []), ...(n.shadowRoots || [])].forEach(walk));
	walk(root);
	return out.join(" ");
}
// Language setting lives in chrome.storage.local, written by the popup; set it from the service worker.
async function setLang(lang) {
	const sw = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().includes(extId));
	await (await sw.worker()).evaluate((l) => chrome.storage.local.set({ lang: l }), lang);
}
const log = (page) => page.$eval("#log", (e) => e.textContent);

async function visit(host, path = "/") {
	visited.add(host);
	const page = await browser.newPage();
	await page.setViewport({ width: 1280, height: 800 });
	await page.goto(`http://${host}${path}`, { waitUntil: "domcontentloaded" });
	await sleep(800);
	return page;
}

// Acceptance 1 + 2: lookalike blocked, official sites untouched.
for (const [host, want] of [["indodaz.com", true], ["xn--ndodax-9ra.com", true], ["indodax.com", false], ["app.uniswap.org", false], ["yearn.finance", false], ["metamask-wallet-restore.com", true], ["claim-airdrop-pepe.xyz", false], ["625854-binance.com", true]]) {
	const page = await visit(host);
	check(`overlay on ${host} = ${want}`, (await overlayShown(page)) === want);
	await page.close();
}

for (const h of ["indodax.com", "example.com"]) await (await visit(h)).close();

// "Keluar dari situs ini" leaves the page.
{
	const page = await visit("indodaz.com");
	await shot(page, "overlay-lookalike");
	await (await shieldButton(page, "back"))();
	await sleep(500);
	check("Keluar navigates to about:blank", page.url() === "about:blank", page.url());
	await page.close();
}

if (SHOTS) {
	// The popup reads the verdict of its own (active) tab; seed one so the shot shows a real danger state.
	const popup = await browser.newPage();
	await popup.setViewport({ width: 320, height: 200, deviceScaleFactor: 2 });
	await popup.goto(`chrome-extension://${extId}/popup/popup.html`);
	await popup.evaluate(async () => {
		const tab = await chrome.tabs.getCurrent();
		await chrome.storage.session.set({ ["tab:" + tab.id]: { host: "indodaz.com", level: "danger", reasons: [{ code: "lookalike", brand: "Indodax" }] } });
	});
	for (const lang of ["id", "en"]) {
		await popup.evaluate((l) => chrome.storage.local.set({ lang: l }), lang);
		await popup.reload();
		await sleep(500);
		await popup.screenshot({ path: join(SHOTS, `popup-${lang}.png`), fullPage: true });
	}
	await popup.evaluate(() => chrome.storage.local.set({ lang: "id" }));
	await popup.close();
}

// Language setting: English copy after switching, Indonesian again after switching back.
{
	await setLang("en");
	const page = await visit("indodaz.com");
	check("English overlay after switching language", (await shieldText(page)).includes("This site is likely phishing"));
	await shot(page, "overlay-lookalike-en");
	await page.close();
	if (SHOTS) {
		// English modal for the store listing.
		const dapp = await visit("dapp.test", "/?mock");
		await dapp.evaluate(() => [...document.querySelectorAll("#buttons button")].find((b) => b.textContent.startsWith("approve MAX")).click());
		let reject;
		for (let i = 0; !reject && i < 20; i++) reject = await shieldButton(dapp, "reject");
		await sleep(300);
		await shot(dapp, "modal-unlimited-approval-en");
		await shotPart(dapp, "panel", "panel-unlimited-approval-en");
		await reject();
		await dapp.close();
	}
	await setLang("id");
	const again = await visit("indodaz.com");
	check("Indonesian overlay by default", (await shieldText(again)).includes("Situs ini kemungkinan phishing"));
	await again.close();
}

// Acceptance 3 + 4 + 5: every flagged case opens the modal fast; Tolak -> 4001 and the wallet never sees it.
const page = await visit("dapp.test", "/?mock");
const cases = await page.$$eval("#buttons button", (bs) => bs.map((b) => b.textContent));
for (const name of cases) {
	const flagged = !name.startsWith("[not flagged]") && !name.includes("(not flagged)");
	await page.evaluate(() => (document.getElementById("log").textContent = ""));
	const t0 = Date.now();
	await page.evaluate((n) => [...document.querySelectorAll("#buttons button")].find((b) => b.textContent === n).click(), name);
	let reject;
	while (!reject && Date.now() - t0 < 2000) reject = await shieldButton(page, "reject");
	const ms = Date.now() - t0;
	if (!flagged) {
		await sleep(300);
		check(`${name}: passes straight to wallet`, !reject && (await log(page)).includes("wallet opened"));
		continue;
	}
	if (!reject) {
		check(`${name}: modal shown`, false);
		continue;
	}
	if (name.startsWith("approve MAX")) (await shot(page, "modal-unlimited-approval"), await shotPart(page, "panel", "panel-unlimited-approval"));
	if (name.startsWith("Seaport")) await shot(page, "modal-seaport-zero");
	await reject();
	await sleep(200);
	const out = await log(page);
	check(`${name}: modal in ${ms} ms, Tolak -> 4001, wallet untouched`, out.includes("error 4001") && !out.includes("wallet opened"), out.trim().split("\n").pop());
}

// "Lanjutkan ke wallet" forwards the request.
{
	await page.evaluate(() => (document.getElementById("log").textContent = ""));
	await page.evaluate(() => document.querySelector("#buttons button:nth-child(2)").click());
	let allow;
	for (let i = 0; !allow && i < 20; i++) allow = await shieldButton(page, "allow");
	await allow();
	await sleep(200);
	check("Lanjutkan forwards to wallet", (await log(page)).includes("wallet opened"));
}
// Acceptance 6, stricter now that there is no API: the extension sends nothing anywhere, flagged page or not.
// Chrome itself phones Google (updates, accounts); test/privacy.test.js covers the extension code statically.
const CHROME_OWN = /(^|\.)(google\.com|googleapis\.com|gstatic\.com)$/;
const strangers = [...contacted].filter((h) => !visited.has(h) && !CHROME_OWN.test(h));
check("no network request except the pages themselves", strangers.length === 0, JSON.stringify(strangers));

await browser.close();
proxy.close();
tls.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
