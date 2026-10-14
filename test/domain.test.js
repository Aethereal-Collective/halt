import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkDomain, LEVEL } from "../extension/src/lib/domain.js";

const read = (f) => JSON.parse(readFileSync(new URL(`../extension/lists/${f}`, import.meta.url)));
const brands = read("brands.json");
const lists = {
	brands,
	allowlist: [...read("allowlist.json"), ...brands.flatMap((b) => b.domains)],
	blocklist: read("blocklist.json"),
};

test("official domains and subdomains are safe", () => {
	for (const h of ["indodax.com", "www.indodax.com", "app.uniswap.org", "pintu.co.id"]) {
		assert.equal(checkDomain(h, lists).level, LEVEL.SAFE, h);
	}
});

// Typosquat techniques: substitution, omission, doubling, transposition, digit/letter swaps, rn->m, vv->w, punycode.
const TYPOSQUATS = [
	"indodaz.com", "indodex.com", "lndodax.com", "1ndodax.com", "indodaxx.com", "indoax.com",
	"tokocrypt0.com", "tokocrpyto.com", "tokoctypto.com", "plntu.co.id", "pintuu.com",
	"binanse.com", "blnance.com", "binnance.com", "6inance.com", "coinbse.com", "coinbasse.com",
	"metamesk.io", "rnetamask.io", "metamaks.io", "metarnask.io", "phantonm.app", "phantorn.app",
	"uniswep.org", "uniswapp.org", "unlswap.org", "uniiswap.org", "pancakesvvap.finance", "pancakeswaps.finance", "pancakeswop.com",
	"openseaa.io", "opensae.io", "0pensea.io", "magiceeden.io", "raydlum.io", "ledgerr.com",
	"trez0r.io", "tresor.io", "rabbby.io", "bybitt.com", "byblt.com",
	"xn--ndodax-9ra.com", "xn--metamsk-k4a.io",
];

test(`${TYPOSQUATS.length} typosquats are dangerous`, () => {
	for (const h of TYPOSQUATS) assert.equal(checkDomain(h, lists).level, LEVEL.DANGER, h);
});

test("brand name on a foreign domain only warns", () => {
	for (const h of ["claim.uniswap-airdrop.xyz", "secure-metamask.net", "pintu-bonus.id", "aave-claim.xyz", "tokocrypto.id"]) {
		assert.equal(checkDomain(h, lists).level, LEVEL.WARN, h);
	}
});

test("real sites one edit from a brand are not blocked", () => {
	// .finance TLD vs Binance, everyday words vs Aave/Raydium/Pintu/Ledger, "rn" in normal words.
	for (const h of ["yearn.finance", "curve.finance", "compound.finance", "finance.yahoo.com", "save.com", "wave.com", "radium.com", "pinto.com", "hedger.com", "learn.com", "modern.com", "xn--80ak6aa92e.com"]) {
		assert.notEqual(checkDomain(h, lists).level, LEVEL.DANGER, h);
	}
});

test("brand keyword on a foreign domain warns", () => {
	const r = checkDomain("indodax-login.xyz", lists);
	assert.equal(r.level, LEVEL.WARN);
	assert.equal(r.reasons[0].brand, "Indodax");
});

test("blocklisted domain and its subdomains are dangerous", () => {
	assert.equal(checkDomain("claim-airdrop-example.xyz", lists).level, LEVEL.DANGER);
	assert.equal(checkDomain("app.claim-airdrop-example.xyz", lists).level, LEVEL.DANGER);
});

test("unrelated domains are safe", () => {
	for (const h of ["google.com", "github.com", "aethereal.top", "localhost"]) {
		assert.equal(checkDomain(h, lists).level, LEVEL.SAFE, h);
	}
});

test("bundled third-party blocklist blocks its entries but never an official or allowlisted domain", () => {
	const thirdParty = read("blocklist-thirdparty.json");
	assert.ok(thirdParty.length > 1000);
	const withThirdParty = { ...lists, blocklist: new Set([...lists.blocklist, ...thirdParty]) };
	for (const h of thirdParty.slice(0, 50)) assert.equal(checkDomain("login." + h, withThirdParty).level, LEVEL.DANGER, h);
	for (const h of lists.allowlist) assert.ok(!thirdParty.includes(h), h);
	for (const h of ["indodax.com", "app.uniswap.org", "curve.finance", "kompas.com"]) assert.equal(checkDomain(h, withThirdParty).level, LEVEL.SAFE, h);
});
