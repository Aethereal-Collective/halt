// Local phishing-likeness score for a hostname: logistic regression over hashed character n-grams.
// Pure: weights come from lists/model.json (built by scripts/train.mjs). Nothing leaves the device.

export const DIM = 1 << 16;

function fnv1a(s) {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
	return (h >>> 0) % DIM;
}

const bucket = (n, edges) => edges.findIndex((e) => n <= e);

// Benign training data (Majestic) is registrable domains only, so subdomains would look "phishy" by
// construction. Train and score on the base domain: "stake.lido.fi" -> "lido.fi", "ib.bri.co.id" -> "bri.co.id".
// ponytail: approximates the public-suffix list (2-letter ccTLD with a <=3 letter second level). Use PSL if it misfires.
export function baseDomain(host) {
	const l = host.split(".");
	const n = l.length > 2 && l.at(-1).length === 2 && l.at(-2).length <= 3 ? 3 : 2;
	return l.slice(-n).join(".");
}

/** Sorted, de-duplicated feature indexes for a normalized hostname. */
export function features(fullHost) {
	const host = baseDomain(fullHost);
	const s = `^${host}$`;
	const out = new Set();
	for (let n = 3; n <= 5; n++) for (let i = 0; i + n <= s.length; i++) out.add(fnv1a(s.slice(i, i + n)));
	const labels = host.split(".");
	out.add(fnv1a("tld:" + labels.at(-1)));
	out.add(fnv1a("labels:" + Math.min(labels.length, 6)));
	out.add(fnv1a("len:" + bucket(host.length, [8, 12, 16, 24, 32, 48, Infinity])));
	out.add(fnv1a("digits:" + bucket((host.match(/\d/g) || []).length, [0, 1, 3, 6, Infinity])));
	out.add(fnv1a("hyphens:" + bucket((host.match(/-/g) || []).length, [0, 1, 2, 4, Infinity])));
	return [...out].sort((a, b) => a - b);
}

/** model.json -> { bias, weights: Int8Array, scale, threshold } */
export function loadModel(json) {
	const bin = atob(json.weights);
	const weights = new Int8Array(bin.length);
	for (let i = 0; i < bin.length; i++) weights[i] = bin.charCodeAt(i);
	return { ...json, weights };
}

/** Probability-like score in [0, 1]; higher looks more like the phishing training data. */
export function score(host, model) {
	let z = model.bias;
	for (const f of features(host)) z += model.weights[f] * model.scale;
	return 1 / (1 + Math.exp(-z));
}
