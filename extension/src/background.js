import { checkDomain, LEVEL } from "./lib/domain.js";
import { loadModel } from "./lib/model.js";
import { REPORT_URL } from "./config.js";

// ponytail: lists ship inside the extension. Add a signed remote list on chrome.alarms once the local list outgrows releases.
let listsPromise;
function loadLists() {
	const names = ["brands", "allowlist", "blocklist", "blocklist-thirdparty", "model"];
	listsPromise ??= Promise.all(names.map((n) => fetch(chrome.runtime.getURL(`lists/${n}.json`)).then((r) => r.json()))).then(
		([brands, allowlist, blocklist, thirdParty, model]) => ({
			brands,
			blocklist: new Set([...blocklist, ...thirdParty]),
			allowlist: [...allowlist, ...brands.flatMap((b) => b.domains)],
			model: loadModel(model),
		}),
	);
	return listsPromise;
}

const BADGE = {
	[LEVEL.SAFE]: { text: "", color: "#16a34a" },
	[LEVEL.WARN]: { text: "!", color: "#d97706" },
	[LEVEL.DANGER]: { text: "X", color: "#dc2626" },
};

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
	const handler = handlers[msg?.type];
	if (!handler) return false;
	handler(msg, sender).then(reply, () => reply(null));
	return true; // async reply
});

const handlers = {
	async checkDomain({ host }, sender) {
		const verdict = checkDomain(host, await loadLists());
		const tabId = sender.tab?.id;
		if (tabId != null) {
			chrome.action.setBadgeText({ tabId, text: BADGE[verdict.level].text });
			chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE[verdict.level].color });
			await chrome.storage.session.set({ ["tab:" + tabId]: { host, ...verdict } });
		}
		return { ...verdict, reportUrl: REPORT_URL };
	},

	async getTabVerdict({ tabId }) {
		return (await chrome.storage.session.get("tab:" + tabId))["tab:" + tabId] ?? null;
	},
};
