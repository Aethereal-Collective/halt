// Static landing site for Halt, served from the domain root. Build: npm run generate -> .output/public
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	compatibilityDate: "2026-10-01",
	modules: ["shadcn-nuxt", "@nuxt/fonts", "@vueuse/nuxt", "@nuxtjs/i18n"],
	css: ["~/assets/css/main.css"],
	vite: {
		plugins: [tailwindcss()],
	},
	shadcn: { prefix: "", componentDir: "~/components/ui" },
	// Bahasa Indonesia at /, English at /en/. Copy lives in app/utils/copy.ts.
	i18n: {
		locales: [
			{ code: "id", language: "id-ID", name: "Bahasa Indonesia" },
			{ code: "en", language: "en-US", name: "English" },
		],
		defaultLocale: "id",
		baseUrl: "https://halt.aethereal.top", // absolute hreflang/canonical links
		strategy: "prefix_except_default",
		detectBrowserLanguage: false,
	},
	// Self-hosted at build time; the page itself loads no third-party fonts.
	fonts: {
		families: [
			// Same typeface as aethereal.top.
			{ name: "Plus Jakarta Sans", provider: "google", weights: [400, 500, 600, 700, 800] },
		],
	},
	app: {
		head: {
			link: [{ rel: "icon", type: "image/png", href: "/icon.png" }],
			meta: [{ name: "theme-color", content: "#141414" }],
			script: [{ innerHTML: "document.documentElement.classList.add('js')" }],
		},
	},
	// Every route is listed, so link crawling is off (it also raced on the prerender cache on Windows).
	nitro: { prerender: { routes: ["/", "/privacy", "/en", "/en/privacy"], crawlLinks: false } },
});
