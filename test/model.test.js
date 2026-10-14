import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { baseDomain, loadModel, score } from "../extension/src/lib/model.js";
import { checkDomain, LEVEL } from "../extension/src/lib/domain.js";

const read = (f) => JSON.parse(readFileSync(new URL(`../extension/lists/${f}`, import.meta.url)));
const model = loadModel(read("model.json"));
const brands = read("brands.json");
const lists = { brands, allowlist: [...read("allowlist.json"), ...brands.flatMap((b) => b.domains)], blocklist: read("blocklist.json"), model };
const flagged = (h) => score(h, model) >= model.threshold;

test("base domain strips subdomains, keeps ccTLD second levels", () => {
	assert.equal(baseDomain("stake.lido.fi"), "lido.fi");
	assert.equal(baseDomain("ib.bri.co.id"), "bri.co.id");
	assert.equal(baseDomain("e-katalog.lkpp.go.id"), "lkpp.go.id");
	assert.equal(baseDomain("x.com"), "x.com");
});

test("model flags typical drainer domains", () => {
	for (const h of ["claim-airdrop-pepe.xyz", "metamask-wallet-restore.com", "uniswap-v4-claim.net", "walletconnect-sync.app"]) assert.ok(flagged(h), h);
});

test("model leaves ordinary and Indonesian sites alone, including subdomains", () => {
	for (const h of ["kompas.com", "news.detik.com", "tokopedia.com", "ib.bri.co.id", "mail.yahoo.co.id", "siakad.unpad.ac.id", "app.lido.fi", "curve.finance", "docs.python.org", "myproject.pages.dev"]) {
		assert.ok(!flagged(h), h);
	}
});

test("model alone only warns; brand name plus model blocks", () => {
	assert.equal(checkDomain("claim-airdrop-pepe.xyz", lists).level, LEVEL.WARN);
	assert.equal(checkDomain("metamask-wallet-restore.com", lists).level, LEVEL.DANGER);
	assert.equal(checkDomain("indodax.com", lists).level, LEVEL.SAFE);
});
