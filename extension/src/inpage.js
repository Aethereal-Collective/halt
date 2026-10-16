// Runs in the page's own JS world so it can see window.ethereum.
// Wraps provider.request: risky calls wait for the user's decision in the content-script modal.
import { analyzeRequest } from "./lib/tx.js";

const wrapped = new WeakSet();
let nextId = 0;

function ask(finding, method) {
	const id = `as-${Date.now()}-${nextId++}`;
	return new Promise((resolve) => {
		const onMessage = (e) => {
			if (e.source !== window || e.data?.source !== "aethereal-shield-content" || e.data.id !== id) return;
			window.removeEventListener("message", onMessage);
			resolve(e.data.allow === true);
		};
		window.addEventListener("message", onMessage);
		window.postMessage({ source: "aethereal-shield-inpage", type: "confirm", id, method, finding }, window.location.origin);
	});
}

function wrap(provider) {
	if (!provider || typeof provider.request !== "function" || wrapped.has(provider)) return;
	const original = provider.request.bind(provider);
	const guarded = async (args) => {
		const finding = safeAnalyze(args);
		if (finding && !(await ask(finding, args.method))) {
			// EIP-1193 "user rejected" so dApps handle it like a wallet rejection.
			throw Object.assign(new Error("Diblokir oleh Halt"), { code: 4001 });
		}
		return original(args);
	};
	try {
		Object.defineProperty(provider, "request", { value: guarded, configurable: true, writable: true });
		wrapped.add(provider);
	} catch {
		// ponytail: some wallets freeze their provider object. Those users fall back to the wallet's own warnings.
	}
}

function safeAnalyze(args) {
	try {
		return analyzeRequest(args || {});
	} catch {
		return null; // never break the dApp because our parser choked
	}
}

// Legacy injection (window.ethereum) plus EIP-6963 multi-wallet discovery.
wrap(window.ethereum);
window.addEventListener("ethereum#initialized", () => wrap(window.ethereum));
window.addEventListener("eip6963:announceProvider", (e) => wrap(e.detail?.provider));
window.dispatchEvent(new Event("eip6963:requestProvider"));
// Wallets that inject late without firing events.
let tries = 0;
const poll = setInterval(() => {
	wrap(window.ethereum);
	if (++tries >= 10) clearInterval(poll);
}, 500);
