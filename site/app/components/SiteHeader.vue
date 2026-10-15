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
		<div class="flex items-center justify-between">
			<NuxtLink to="/" class="text-[28px] max-md:text-[22px]" aria-label="Aethereal Shield, beranda">
				<SiteLogo check-color="#050505" />
			</NuxtLink>
			<nav class="hidden items-center gap-10 text-[17px] lg:flex">
				<NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="transition-opacity hover:opacity-70">{{ l.label }}</NuxtLink>
			</nav>
			<NuxtLink to="/#pasang" class="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[16px] text-ink transition-colors hover:bg-white/85 max-md:px-4 max-md:py-2 max-md:text-sm">
				Pasang Shield <ArrowRight class="size-4" />
			</NuxtLink>
		</div>
	</header>
</template>

<script setup lang="ts">
import { ArrowRight } from "@lucide/vue";
import { cn } from "@/lib/utils";

const links = [
	{ label: "Fitur", to: "/#fitur" },
	{ label: "Cara Kerja", to: "/#cara-kerja" },
	{ label: "Pola Penipuan", to: "/#pola" },
	{ label: "FAQ", to: "/#faq" },
	{ label: "Privasi", to: "/privacy" },
];

// Like the reference: hide while scrolling down, come back (with a dark backdrop) when scrolling up.
const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 40);
const hidden = ref(false);
watch(y, (now, before) => (hidden.value = now > before && now > 120));
</script>
