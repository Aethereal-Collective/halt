// Builds extension/lists/allowlist-defillama.json: official websites of live protocols listed on DefiLlama,
// so real dApps are never flagged as lookalikes. Run before every release: npm run allowlist
import { readFileSync, writeFileSync } from "node:fs";
import { inList, normalizeHost } from "../extension/src/lib/domain.js";

const API = "https://api.llama.fi/protocols";

// Hosting and link-in-bio platforms. Allowlisting one of these (or a parent of a site on them)
// would mark every phishing page hosted there as safe, so they are never added.
const SHARED = new Set([
	"vercel.app", "netlify.app", "pages.dev", "workers.dev", "github.io", "gitbook.io", "gitlab.io", "web.app", "firebaseapp.com",
	"herokuapp.com", "onrender.com", "fly.dev", "railway.app", "replit.app", "repl.co", "glitch.me", "surge.sh", "webflow.io",
	"framer.app", "framer.website", "wixsite.com", "carrd.co", "notion.site", "notion.so", "substack.com", "medium.com", "mirror.xyz",
	"linktr.ee", "t.me", "telegram.me", "discord.gg", "discord.com", "twitter.com", "x.com", "youtube.com", "facebook.com",
	"instagram.com", "linkedin.com", "reddit.com", "google.com", "sites.google.com", "docs.google.com", "azurewebsites.net",
	"cloudfront.net", "amazonaws.com", "ipfs.io", "dweb.link", "eth.limo", "eth.link", "4everland.app", "fleek.co", "on-fleek.app",
]);

// Second-level labels that are part of a country TLD ("co.id", "com.au"): the registrable domain then has three labels.
const SLD = new Set(["co", "com", "net", "org", "or", "ac", "go", "gov", "edu", "my", "web", "biz", "ne", "gob"]);

function registrable(host) {
	const l = host.split(".");
	const n = l.length >= 3 && l.at(-1).length === 2 && SLD.has(l.at(-2)) ? 3 : 2;
	return l.slice(-n).join(".");
}

const list = (f) => JSON.parse(readFileSync(new URL(`../extension/lists/${f}`, import.meta.url)));
const blocked = new Set([...list("blocklist.json"), ...list("blocklist-thirdparty.json")]);

const res = await fetch(API);
if (!res.ok) throw new Error(`${API}: HTTP ${res.status}`);
const protocols = await res.json();

const out = new Set();
const conflicts = [];
let skippedDead = 0;
for (const p of protocols) {
	// A dead or rugged project's domain can be re-registered by scammers: never vouch for it.
	if (!p.url || p.deadUrl || p.deprecated || p.rugged || p.deadFrom) {
		if (p.url) skippedDead++;
		continue;
	}
	let host;
	try {
		host = normalizeHost(new URL(p.url).hostname);
	} catch {
		continue;
	}
	if (!host.includes(".") || /^[\d.]+$/.test(host) || inList(host, SHARED)) continue;
	// The main domain covers app./docs. subdomains too, unless it is a shared platform.
	const root = registrable(host);
	const entry = SHARED.has(root) ? host : root;
	// Both a phishing list and DefiLlama claim this domain: leave it to a human, never auto-allow.
	if (inList(entry, blocked)) {
		conflicts.push(`${entry} (${p.name})`);
		continue;
	}
	out.add(entry);
}

const file = new URL("../extension/lists/allowlist-defillama.json", import.meta.url);
writeFileSync(file, JSON.stringify([...out].sort()));
console.log(`${protocols.length} protocols, ${skippedDead} skipped as dead/deprecated/rugged`);
console.log(`allowlist-defillama.json: ${out.size} domains`);
if (conflicts.length) console.log(`${conflicts.length} also on a phishing list, not added:\n  ${conflicts.join("\n  ")}`);
