<template>
	<!-- Desktop: fixed under the page; app.vue gives the content a 720px bottom margin so the footer is revealed at the end. -->
	<footer class="fixed bottom-0 left-0 z-0 w-screen bg-brand text-white max-lg:static">
		<div class="relative h-[720px] overflow-hidden px-[5vw] pt-[50px] max-lg:h-auto max-lg:pb-10">
			<div class="flex justify-between gap-12 max-lg:flex-col">
				<div>
					<SiteLogo class="text-[clamp(40px,4.2vw,64px)]" />
					<p class="mt-10 max-w-[22em] text-[18px] leading-[1.5]">{{ c.footer.tagline }}</p>
					<div class="mt-10 flex flex-wrap gap-4"><InstallButton tone="glass" /></div>
				</div>
				<ul class="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-[17px]">
					<li v-for="l in contact" :key="l.label">
						<a :href="l.href" target="_blank" rel="noopener noreferrer" class="opacity-90 transition-opacity hover:opacity-100 hover:underline">{{ l.label }}</a>
					</li>
				</ul>
			</div>

			<!-- Extension window peeking up from the bottom edge, like the reference's phone. -->
			<div class="absolute bottom-0 left-1/2 w-[300px] -translate-x-1/2 translate-y-[38%] max-lg:hidden">
				<MockExtensionWindow tone="light">
					<div class="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
						<SiteLogo class="text-[30px] text-brand" />
						<p class="text-[11px] text-ink/70">{{ c.overview.tagline }}</p>
					</div>
				</MockExtensionWindow>
			</div>

			<div class="absolute inset-x-[5vw] bottom-10 flex items-center justify-between text-[17px] max-lg:static max-lg:mt-16 max-lg:flex-col max-lg:items-start max-lg:gap-4">
				<p>© {{ year }} Aethereal. {{ c.footer.rights }}</p>
				<a href="#top" class="inline-flex items-center gap-2 hover:underline" @click.prevent="toTop">{{ c.footer.top }} <ArrowUp class="size-4" /></a>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { ArrowUp } from "@lucide/vue";

const { reportUrl, email, social } = useAppConfig();
const year = new Date().getFullYear();
const c = useCopy();
// The header already links every section; the footer only has ways to reach us.
const contact = computed(() => [
	{ label: c.value.footer.report, href: reportUrl },
	{ label: email, href: `mailto:${email}` },
	{ label: "Discord", href: reportUrl },
	{ label: "X", href: social.x },
	{ label: "GitHub", href: social.github },
]);
const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>
