<template>
	<!-- Desktop: fixed under the page; app.vue gives the content a 720px bottom margin so the footer is revealed at the end. -->
	<footer class="fixed bottom-0 left-0 z-0 w-screen bg-brand text-white max-lg:static">
		<div class="relative h-[720px] overflow-hidden px-[5vw] pt-[50px] max-lg:h-auto max-lg:pb-10">
			<div class="flex justify-between gap-12 max-lg:flex-col">
				<div>
					<SiteLogo class="text-[clamp(40px,4.2vw,64px)]" check-color="#134bd6" />
					<p class="mt-10 max-w-[22em] text-[18px] leading-[1.5]">Perlindungan dari situs phishing dan transaksi wallet berbahaya, untuk pengguna kripto Indonesia.</p>
					<div class="mt-10 flex flex-wrap gap-4"><InstallButton tone="glass" /></div>
				</div>
				<nav class="flex gap-[6vw] pt-2 text-[17px]">
					<div v-for="col in cols" :key="col.title">
						<p class="mb-7 text-[17px] tracking-wide">{{ col.title }}</p>
						<ul class="space-y-3.5">
							<li v-for="l in col.links" :key="l.label">
								<a :href="l.href" :target="l.external ? '_blank' : undefined" :rel="l.external ? 'noopener noreferrer' : undefined" class="opacity-90 transition-opacity hover:opacity-100 hover:underline">{{ l.label }}</a>
							</li>
						</ul>
					</div>
				</nav>
			</div>

			<!-- Extension window peeking up from the bottom edge, like the reference's phone. -->
			<div class="absolute bottom-0 left-1/2 w-[300px] -translate-x-1/2 translate-y-[38%] max-lg:hidden">
				<MockExtensionWindow tone="light">
					<div class="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
						<SiteLogo class="text-[30px] text-brand" check-color="#ffffff" />
						<p class="text-[11px] text-ink/70">Situs palsu dan transaksi berbahaya, dihentikan.</p>
					</div>
				</MockExtensionWindow>
			</div>

			<div class="absolute inset-x-[5vw] bottom-10 flex items-center justify-between text-[17px] max-lg:static max-lg:mt-16 max-lg:flex-col max-lg:items-start max-lg:gap-4">
				<p>© {{ year }} Aethereal. Semua hak dilindungi.</p>
				<a href="#top" class="inline-flex items-center gap-2 hover:underline" @click.prevent="toTop">Kembali ke Atas <ArrowUp class="size-4" /></a>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { ArrowUp } from "@lucide/vue";

const { reportUrl } = useAppConfig();
const base = useRuntimeConfig().app.baseURL;
const year = new Date().getFullYear();
const cols = [
	{
		title: "PRODUK",
		links: [
			{ label: "Domain Shield", href: `${base}#fitur` },
			{ label: "Transaction Guard", href: `${base}#fitur` },
			{ label: "Cara Kerja", href: `${base}#cara-kerja` },
			{ label: "FAQ", href: `${base}#faq` },
			{ label: "Privasi", href: `${base}privacy` },
		],
	},
	{
		title: "TERHUBUNG",
		links: [
			{ label: "Discord", href: reportUrl, external: true },
			{ label: "Laporkan Situs", href: reportUrl, external: true },
			{ label: "aethereal.top", href: "https://aethereal.top", external: true },
		],
	},
];
const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>
