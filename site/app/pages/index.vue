<template>
	<main>
		<SectionHero />
		<SectionOverview />
		<SectionScrollWords />
		<SectionLayers />
		<SectionHowItWorks />
		<SectionPatterns />
		<SectionTips />
		<SectionFaq />
		<SectionCta />
	</main>
</template>

<script setup lang="ts">
const c = useCopy();
useSeoMeta({
	title: () => c.value.seo.title,
	description: () => c.value.seo.description,
	ogTitle: "Halt",
	ogDescription: () => c.value.seo.ogDescription,
});
</script>
