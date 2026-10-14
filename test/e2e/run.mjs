// E2E: real Chrome (set CHROME_PATH) + unpacked extension, checks MVP acceptance criteria 1-6.
// Run: npm run e2e. Needs openssl on PATH. SHOTS=<dir> also saves store screenshots.
// A local proxy serves the test dApp for every host and refuses the Worker host, so the Worker is
// "unreachable" (criterion 5) and every Worker call is counted (criterion 6).
import puppeteer from "puppeteer-core";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { readFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DAPP = readFileSync(join(ROOT, "test/dapp/index.html"));
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

// Throwaway self-signed cert so HTTPS-only hosts (HSTS) can be served locally.
const tmp = mkdtempSync(join(tmpdir(), "shield-e2e-"));
execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(tmp, "key.pem"), "-out", join(tmp, "cert.pem"), "-days", "1", "-subj", "/CN=test"], { stdio: "ignore", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
const connects = [];
const proxy = http.createServer((req, res) => res.writeHead(200, { "content-type": "text/html" }).end(DAPP));
const serve = (req, res) => res.writeHead(200, { "content-type": "text/html" }).end(DAPP);
const tls = https.createServer({ key: readFileSync(join(tmp, "key.pem")), cert: readFileSync(join(tmp, "cert.pem")) }, serve);
await new Promise((r) => tls.listen(0, "127.0.0.1", r));
// HTTPS pages tunnel to the local TLS server; the Worker host is logged and refused (= unreachable).
proxy.on("connect", (req, sock) => {
	connects.push(req.url);
	if (req.url.startsWith("shield-api.")) return sock.destroy();
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
const shot = (page, name) => process.env.SHOTS && page.screenshot({ path: join(process.env.SHOTS, `${name}.png`) });

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
const overlayShown = (page) => page.evaluate(() => !!document.querySelector("aethereal-shield"));
const log = (page) => page.$eval("#log", (e) => e.textContent);

async function visit(host, path = "/") {
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

// Acceptance 6: unflagged pages make no outbound request.
connects.length = 0;
for (const h of ["indodax.com", "example.com"]) await (await visit(h)).close();
const outbound = connects.filter((c) => c.startsWith("shield-api."));
check("no Worker request on unflagged pages", outbound.length === 0, JSON.stringify(outbound));

// "Keluar dari situs ini" leaves the page.
{
	const page = await visit("indodaz.com");
	await shot(page, "overlay-lookalike");
	await (await shieldButton(page, "back"))();
	await sleep(500);
	check("Keluar navigates to about:blank", page.url() === "about:blank", page.url());
	await page.close();
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
	if (name.startsWith("approve MAX")) await shot(page, "modal-unlimited-approval");
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
console.log("Worker calls (refused):", connects.filter((c) => c.startsWith("shield-api.")).length);

await browser.close();
proxy.close();
tls.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
