// Trains the hostname model in extension/src/lib/model.js and writes extension/lists/model.json.
// Run: npm run train (downloads data, trains, needs ~6 GB RAM)
// Sources and licenses: docs/sources.md.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DIM, baseDomain, features, loadModel, score } from "../extension/src/lib/model.js";
import { normalizeHost } from "../extension/src/lib/domain.js";

const raw = (f) => readFileSync(new URL(`../data/raw/${f}`, import.meta.url), "utf8");
const MAX_FPR = 0.001; // threshold is set so at most 0.1% of held-out benign domains get flagged

// Entries with a path ("sites.google.com/view/...") flag a page, not the host, so they are skipped.
// Everything is reduced to its base domain (see baseDomain); a phishing subdomain on a benign base
// ("x.pages.dev", "sites.google.com") is dropped below as ambiguous.
const host = (s) => (String(s).includes("/") ? null : baseDomain(normalizeHost(s)) || null);
const metamask = JSON.parse(raw("metamask.json"));
const polkadot = JSON.parse(raw("polkadot.json"));
const benign = new Set(
	[...raw("majestic.csv").split("\n").slice(1).map((l) => l.split(",")[2]), ...metamask.whitelist, ...metamask.fuzzylist, ...polkadot.allow].map(host).filter(Boolean),
);
const phishing = new Set([...metamask.blacklist, ...polkadot.deny, ...raw("phishing-database.txt").split("\n")].map(host).filter(Boolean));
for (const h of phishing) if (benign.has(h)) (benign.delete(h), phishing.delete(h)); // ambiguous: drop from both

// Deterministic split by host hash: 80% train, 10% validation (threshold), 10% test (reported).
const split = (h) => createHash("md5").update(h).digest()[0] % 10;
const rows = [...[...benign].map((h) => [h, 0]), ...[...phishing].map((h) => [h, 1])].map(([h, y]) => ({ h, y, s: split(h), f: features(h) }));
const train = rows.filter((r) => r.s < 8);
const valid = rows.filter((r) => r.s === 8);
const test = rows.filter((r) => r.s === 9);
console.log(`benign ${benign.size}, phishing ${phishing.size}; train ${train.length}, valid ${valid.length}, test ${test.length}`);

// Logistic regression, Adagrad, light L2. Classes reweighted to equal total weight.
const w = new Float64Array(DIM);
const g2 = new Float64Array(DIM).fill(1e-8);
let bias = 0;
let bg2 = 1e-8;
const pos = train.filter((r) => r.y).length;
const cw = [train.length / (2 * (train.length - pos)), train.length / (2 * pos)];
const LR = 0.1;
const L2 = 1e-6;
for (let epoch = 0; epoch < 4; epoch++) {
	shuffle(train, epoch + 1);
	let loss = 0;
	for (const { f, y } of train) {
		let z = bias;
		for (const i of f) z += w[i];
		const p = 1 / (1 + Math.exp(-z));
		loss += -cw[y] * Math.log(y ? p + 1e-12 : 1 - p + 1e-12);
		const g = cw[y] * (p - y);
		for (const i of f) {
			const gi = g + L2 * w[i];
			g2[i] += gi * gi;
			w[i] -= (LR * gi) / Math.sqrt(g2[i]);
		}
		bg2 += g * g;
		bias -= (LR * g) / Math.sqrt(bg2);
	}
	console.log(`epoch ${epoch + 1}: loss ${(loss / train.length).toFixed(4)}`);
}

// Quantize to int8 so the shipped model stays small.
const maxAbs = w.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
const scale = maxAbs / 127;
const q = Int8Array.from(w, (x) => Math.round(x / scale));
const json = { version: 1, trained: new Date().toISOString().slice(0, 10), bias, scale, threshold: 0, weights: Buffer.from(q.buffer).toString("base64") };
const model = loadModel(json);

// Threshold from validation benign scores, then honest numbers on the untouched test split.
const vb = valid.filter((r) => !r.y).map((r) => score(r.h, model)).sort((a, b) => b - a);
json.threshold = vb[Math.floor(vb.length * MAX_FPR)];
const t = json.threshold;
const tp = test.filter((r) => r.y && score(r.h, model) >= t).length;
const fp = test.filter((r) => !r.y && score(r.h, model) >= t).length;
const P = test.filter((r) => r.y).length;
json.metrics = { threshold: +t.toFixed(4), testRecall: +(tp / P).toFixed(4), testFpr: +(fp / (test.length - P)).toFixed(5), testPrecision: +(tp / (tp + fp)).toFixed(4) };
console.log(json.metrics);

writeFileSync(new URL("../extension/lists/model.json", import.meta.url), JSON.stringify(json));
console.log(`model.json ${(JSON.stringify(json).length / 1024).toFixed(0)} KB`);

function shuffle(a, seed) {
	for (let i = a.length - 1; i > 0; i--) {
		seed = (seed * 1103515245 + 12345) % 2 ** 31;
		const j = seed % (i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
}
