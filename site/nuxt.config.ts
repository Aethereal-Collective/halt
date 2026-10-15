// Static site for aethereal.top/shield. Build: npm run generate -> .output/public
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	compatibilityDate: "2026-10-01",
	modules: ["shadcn-nuxt", "@nuxt/fonts", "@vueuse/nuxt"],
	css: ["~/assets/css/main.css"],
	vite: {
		plugins: [tailwindcss()],
	},
	shadcn: { prefix: "", componentDir: "~/components/ui" },
	// Self-hosted at build time; the page itself loads no third-party fonts.
	fonts: {
		families: [
			{ name: "Host Grotesk", provider: "google", weights: [300, 400, 500] },
			{ name: "DM Sans", provider: "google", weights: [400, 500, 600] },
		],
	},
	app: {
		baseURL: "/shield/",
		head: {
			htmlAttrs: { lang: "id" },
			link: [{ rel: "icon", type: "image/png", href: "/shield/icon.png" }],
			meta: [{ name: "theme-color", content: "#050505" }],
			script: [{ innerHTML: "document.documentElement.classList.add('js')" }],
		},
	},
	nitro: { prerender: { routes: ["/", "/privacy"] } },
});
