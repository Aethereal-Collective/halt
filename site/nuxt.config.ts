// Static site for aethereal.top/shield. Build: npm run generate -> .output/public
export default defineNuxtConfig({
	compatibilityDate: "2026-10-01",
	css: ["~/assets/main.css"],
	app: {
		baseURL: "/shield/",
		head: {
			htmlAttrs: { lang: "id" },
			link: [{ rel: "icon", type: "image/png", href: "/shield/icon.png" }],
			meta: [{ name: "theme-color", content: "#09090b" }],
		},
	},
	nitro: { prerender: { routes: ["/", "/privacy"] } },
});
