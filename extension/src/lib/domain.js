// Pure domain checks. No DOM, no chrome.* — runs in the service worker and in node tests.
import { score } from "./model.js";

export const LEVEL = { SAFE: "safe", WARN: "warn", DANGER: "danger" };

const MIN_BRAND_LABEL = 4; // shorter labels ("jup", "okx") match too many random domains
const MIN_LOOKALIKE_LABEL = 5; // 4-letter brands ("aave") are one edit from everyday words (save, wave, have)
// Real words one edit away from a brand label. A full-page block on these would be a false positive.
const LOOKALIKE_IGNORE = new Set(["finance", "radium", "pinto", "hedger"]);

export function normalizeHost(host) {
	return String(host || "").trim().toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

// True when host equals an entry or is a subdomain of one. `list` is an array or a Set
// (the bundled blocklist has ~160k entries, so it is looked up by suffix instead of scanned).
export function inList(host, list) {
	const labels = normalizeHost(host).split(".");
	const set = list instanceof Set ? list : new Set(list);
	return labels.some((_, i) => set.has(labels.slice(i).join(".")));
}

// Levenshtein plus adjacent transposition (optimal string alignment): "opensae" is 1 edit from "opensea".
export function editDistance(a, b) {
	let prev2 = [];
	let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const cur = [i];
		for (let j = 1; j <= b.length; j++) {
			cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
		}
		[prev2, prev] = [prev, cur];
	}
	return prev[b.length];
}

// "indodax.com" -> "indodax", "pintu.co.id" -> "pintu"
export function brandLabel(domain) {
	return normalizeHost(domain).split(".")[0];
}

/**
 * @param {string} host
 * @param {{ blocklist: string[], allowlist: string[], brands: {name: string, domains: string[]}[], model?: object }} lists
 *   model: optional output of loadModel() (lib/model.js); adds "ml_suspicious" (ADR-0006).
 * @returns {{ level: string, reasons: {code: string, brand?: string}[] }}
 */
export function checkDomain(host, lists) {
	const h = normalizeHost(host);
	if (!h || !h.includes(".")) return { level: LEVEL.SAFE, reasons: [] };
	if (inList(h, lists.allowlist)) return { level: LEVEL.SAFE, reasons: [] };
	if (inList(h, lists.blocklist)) return { level: LEVEL.DANGER, reasons: [{ code: "blocklisted" }] };

	const reasons = [];
	// The TLD is never a brand ("yearn.finance" is not "binance").
	// ponytail: no public-suffix list, so every other label is compared. Upgrade to PSL if false positives pile up.
	const labels = h.split(".").slice(0, -1);
	// Punycode keeps the ASCII letters before the last "-": "xn--ndodax-9ra" (îndodax) -> "ndodax".
	const ascii = labels.filter((l) => l.startsWith("xn--")).map((l) => l.slice(4).replace(/-[^-]*$/, ""));
	// Letter-pair homoglyphs: "phantorn" reads as "phantom", "pancakesvvap" as "pancakeswap".
	const skeletons = labels.map((l) => l.replace(/rn/g, "m").replace(/vv/g, "w")).filter((l, i) => l !== labels[i]);
	for (const brand of lists.brands) {
		for (const domain of brand.domains) {
			const target = brandLabel(domain);
			if (target.length < MIN_BRAND_LABEL) continue;
			for (const label of labels) check(label, target, brand, false);
			for (const label of [...ascii, ...skeletons]) check(label, target, brand, true);
		}
	}
	function check(label, target, brand, spoofed) {
		const dist = editDistance(label, target);
		const near = dist <= (target.length >= 8 ? 2 : 1) && target.length >= MIN_LOOKALIKE_LABEL && !LOOKALIKE_IGNORE.has(label);
		// A disguised label that reads exactly as the brand is a lookalike too.
		if (near && (dist > 0 || spoofed)) {
			reasons.push({ code: "lookalike", brand: brand.name });
		} else if (dist === 0 || label.includes(target)) {
			reasons.push({ code: "brand_keyword", brand: brand.name });
		}
	}
	if (labels.some((l) => l.startsWith("xn--"))) reasons.push({ code: "punycode" });
	if (lists.model && score(h, lists.model) >= lists.model.threshold) reasons.push({ code: "ml_suspicious" });

	const unique = dedupe(reasons);
	// One weak signal warns; a brand name plus a disguise (punycode) or a phishing-like domain (model) blocks.
	const danger = hasCode(unique, "lookalike") || (hasCode(unique, "brand_keyword") && (hasCode(unique, "punycode") || hasCode(unique, "ml_suspicious")));
	if (danger) return { level: LEVEL.DANGER, reasons: unique };
	return { level: unique.length ? LEVEL.WARN : LEVEL.SAFE, reasons: unique };
}

const hasCode = (reasons, code) => reasons.some((r) => r.code === code);

function dedupe(reasons) {
	const seen = new Set();
	return reasons.filter((r) => {
		const key = r.code + ":" + (r.brand || "");
		return seen.has(key) ? false : seen.add(key);
	});
}
