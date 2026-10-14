// Downloads the training sources listed in docs/sources.md into data/raw/ (gitignored).
// Run: node scripts/fetch-data.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const SOURCES = {
	"metamask.json": "https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json",
	"polkadot.json": "https://polkadot.js.org/phishing/all.json",
	"phishing-database.txt": "https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt",
	"majestic.csv": "https://downloads.majestic.com/majestic_million.csv",
};

const dir = new URL("../data/raw/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [file, url] of Object.entries(SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
	const body = Buffer.from(await res.arrayBuffer());
	writeFileSync(new URL(file, dir), body);
	console.log(`${file}  ${(body.length / 1e6).toFixed(1)} MB`);
}
