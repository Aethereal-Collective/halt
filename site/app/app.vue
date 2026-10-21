<template>
	<SiteHeader />
	<!-- White page on top; on desktop the bottom margin reveals the fixed footer underneath. -->
	<div id="top" class="relative z-10 bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] lg:mb-[720px]">
		<NuxtPage />
	</div>
	<SiteFooter />
</template>

<script setup lang="ts">
// <html lang>, hreflang alternates and og:locale for the active language.
const head = useLocaleHead();
useHead(() => ({ htmlAttrs: { lang: head.value.htmlAttrs?.lang }, link: head.value.link, meta: head.value.meta }));
useSeoMeta({
	ogImage: "https://halt.aethereal.top/og.png",
	ogImageWidth: 1200,
	ogImageHeight: 630,
	ogSiteName: "Halt",
	ogType: "website",
	twitterCard: "summary_large_image",
	twitterSite: "@aethereal_co",
});
</script>
