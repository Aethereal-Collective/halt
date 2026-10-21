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

// Structured data for search and answer engines: the product, its FAQ, and who makes it.
const { locale } = useI18n();
const ORG = {
	"@type": "Organization",
	name: "Aethereal",
	alternateName: ["æthereal", "Aethereal Collective"],
	url: "https://aethereal.top",
	email: "aethereal.hq@gmail.com",
	sameAs: ["https://discord.gg/aethereal", "https://x.com/aethereal_co", "https://github.com/Aethereal-Collective", "https://medium.com/@aethereal_co", "https://www.linkedin.com/company/aethereal-collective"],
};
useHead(() => ({
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify([
				{
					"@context": "https://schema.org",
					"@type": "SoftwareApplication",
					name: "Halt",
					description: c.value.seo.description,
					url: locale.value === "en" ? "https://halt.aethereal.top/en" : "https://halt.aethereal.top/",
					applicationCategory: "SecurityApplication",
					applicationSubCategory: "Browser extension",
					operatingSystem: "Chrome, Brave",
					inLanguage: ["id", "en"],
					offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
					featureList: c.value.layers.cards.map((l) => `${l.title}: ${l.body}`),
					publisher: ORG,
				},
				{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale.value, mainEntity: c.value.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
				{ "@context": "https://schema.org", ...ORG },
			]),
		},
	],
}));
</script>
