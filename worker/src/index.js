// Cloudflare Worker: turns a Shield finding into a short Bahasa Indonesia explanation via Claude.
// Holds the API key so the extension never ships one.
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `Kamu adalah asisten keamanan kripto Aethereal Shield. Kamu menerima temuan dari ekstensi browser (domain mencurigakan atau permintaan transaksi/tanda tangan wallet).
Jelaskan risikonya kepada pengguna awam dalam Bahasa Indonesia yang singkat dan jelas, maksimal 2 kalimat untuk penjelasan dan 1 kalimat untuk saran tindakan.
Jangan menebak hal yang tidak ada di data temuan. Jangan pernah menyuruh pengguna memasukkan seed phrase atau private key di mana pun.`;

const SCHEMA = {
	type: "object",
	properties: {
		explanation: { type: "string" },
		action: { type: "string" },
	},
	required: ["explanation", "action"],
	additionalProperties: false,
};

const MAX_BODY = 4096;
const CACHE_TTL_S = 7 * 24 * 3600;

export default {
	async fetch(request, env) {
		const cors = {
			"access-control-allow-origin": env.ALLOWED_ORIGIN, // chrome-extension://<id>
			"access-control-allow-methods": "POST",
			"access-control-allow-headers": "content-type",
		};
		if (request.method === "OPTIONS") return new Response(null, { headers: cors });
		if (request.method !== "POST" || new URL(request.url).pathname !== "/explain") return new Response("Not found", { status: 404 });
		if (request.headers.get("origin") !== env.ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403 });

		const raw = await request.text();
		if (raw.length > MAX_BODY) return new Response("Too large", { status: 413 });
		let finding;
		try {
			finding = JSON.parse(raw);
		} catch {
			return new Response("Bad JSON", { status: 400 });
		}
		if (!["domain", "tx"].includes(finding?.kind)) return new Response("Bad finding", { status: 400 });

		// Per-IP limit. The IP is only used as a counter key here, never logged or stored.
		const { success } = await env.LIMITER.limit({ key: request.headers.get("cf-connecting-ip") || "unknown" });
		if (!success) return json({ explanation: null }, cors, 429);

		// Identical findings (e.g. one popular phishing domain) are explained once.
		const key = await sha256(JSON.stringify(finding));
		const cached = await env.CACHE.get(key, "json");
		if (cached) return json(cached, cors);

		const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
		try {
			const response = await client.beta.messages.create({
				model: "claude-opus-5-5",
				max_tokens: 1024,
				betas: ["server-side-fallback-2026-07-01"],
				fallbacks: "default",
				output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
				system: SYSTEM,
				messages: [{ role: "user", content: `Temuan:\n${JSON.stringify(finding)}` }],
			});
			if (response.stop_reason === "refusal") return json({ explanation: null }, cors);
			const text = response.content.find((b) => b.type === "text")?.text;
			if (!text) return json({ explanation: null }, cors);
			const body = JSON.parse(text);
			await env.CACHE.put(key, JSON.stringify(body), { expirationTtl: CACHE_TTL_S });
			return json(body, cors);
		} catch (err) {
			if (err instanceof Anthropic.RateLimitError) return json({ explanation: null }, cors, 429);
			if (err instanceof Anthropic.APIError) return json({ explanation: null }, cors, 502);
			throw err;
		}
	},
};

const json = (body, headers, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json" } });

async function sha256(text) {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
