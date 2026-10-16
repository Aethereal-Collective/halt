<template>
	<header
		:class="
			cn(
				'fixed inset-x-0 top-0 z-50 px-[3vw] py-[1.1vw] text-white transition-all duration-700 ease-out max-md:py-4',
				scrolled && 'bg-ink/80 py-3 backdrop-blur-xl',
				hidden && '-translate-y-full',
			)
		"
	>
		<div class="flex items-center justify-between gap-4">
			<NuxtLink :to="localePath('/')" class="text-[28px] max-md:text-[22px]" :aria-label="c.nav.home">
				<SiteLogo />
			</NuxtLink>
			<nav class="hidden items-center gap-10 text-[17px] lg:flex">
				<NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="transition-opacity hover:opacity-70">{{ l.label }}</NuxtLink>
			</nav>
			<div class="flex items-center gap-3">
				<NuxtLink :to="switchLocalePath(locale === 'id' ? 'en' : 'id')" :aria-label="c.nav.langLabel" class="rounded-full border border-white/30 px-3.5 py-2 text-[14px] font-semibold transition-colors hover:bg-white/10">
					{{ c.nav.lang }}
				</NuxtLink>
				<NuxtLink :to="`${localePath('/')}#pasang`" class="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[16px] text-ink transition-colors hover:bg-white/85 max-md:px-4 max-md:py-2 max-md:text-sm">
					{{ c.nav.install }} <ArrowRight class="size-4" />
				</NuxtLink>
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
import { ArrowRight } from "@lucide/vue";
import { cn } from "@/lib/utils";

const c = useCopy();
const { locale } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();

const links = computed(() => {
	const home = localePath("/");
	return [
		{ label: c.value.nav.features, to: `${home}#fitur` },
		{ label: c.value.nav.how, to: `${home}#cara-kerja` },
		{ label: c.value.nav.patterns, to: `${home}#pola` },
		{ label: c.value.nav.faq, to: `${home}#faq` },
		{ label: c.value.nav.privacy, to: localePath("/privacy") },
	];
});

// Like the reference: hide while scrolling down, come back (with a dark backdrop) when scrolling up.
const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 40);
const hidden = ref(false);
watch(y, (now, before) => (hidden.value = now > before && now > 120));
</script>
