// Builds extension/lists/blocklist-thirdparty.json from the licensed crypto phishing lists (ADR-0007).
// Run before every release: npm run blocklist (needs data/raw/majestic.csv from scripts/fetch-data.mjs)
import { readFileSync, writeFileSync } from "node:fs";
import { inList, normalizeHost } from "../extension/src/lib/domain.js";

const SOURCES = {
	metamask: ["https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json", (j) => j.blacklist],
	polkadot: ["https://polkadot.js.org/phishing/all.json", (j) => j.deny],
};
const list = (f) => JSON.parse(readFileSync(new URL(`../extension/lists/${f}`, import.meta.url)));
// Our allowlist and official brand domains always win; never ship them as blocked.
const safe = new Set([...list("allowlist.json"), ...list("allowlist-defillama.json"), ...list("brands.json").flatMap((b) => b.domains)]);
// Popular domains in these lists are mostly shared hosts / dynamic DNS (alwaysdata.net, mooo.com). A suffix match
// would block every site under them, so the top 100k Majestic domains are never shipped as blocked.
const POPULAR = 100_000;
const popular = new Set(readFileSync(new URL("../data/raw/majestic.csv", import.meta.url), "utf8").split("\n").slice(1, POPULAR + 1).map((l) => l.split(",")[2]));

const out = new Set();
for (const [name, [url, pick]] of Object.entries(SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
	const entries = pick(await res.json());
	let added = 0;
	for (const e of entries) {
		// Entries with a path ("sites.google.com/view/...") flag one page on a shared host; blocking the host would be a false positive.
		if (String(e).includes("/")) continue;
		const h = normalizeHost(e);
		if (!h.includes(".") || inList(h, safe) || popular.has(h)) continue;
		if (!out.has(h)) (out.add(h), added++);
	}
	console.log(`${name}: ${entries.length} entries, ${added} added`);
}
const file = new URL("../extension/lists/blocklist-thirdparty.json", import.meta.url);
writeFileSync(file, JSON.stringify([...out].sort()));
console.log(`blocklist-thirdparty.json: ${out.size} domains, ${(readFileSync(file).length / 1e6).toFixed(1)} MB`);
