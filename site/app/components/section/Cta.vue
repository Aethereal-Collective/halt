<template>
	<section class="relative flex h-screen w-full flex-col items-center justify-center bg-paper px-6 text-center text-ink max-lg:h-[70vh]">
		<component
			:is="cwsUrl ? 'a' : 'span'"
			v-reveal
			:href="cwsUrl || undefined"
			class="inline-flex items-center justify-center rounded-full bg-black px-[6vw] py-[2.6vw] font-sans text-[clamp(22px,2.4vw,36px)] font-medium text-white transition-transform hover:scale-[1.02] max-md:px-10 max-md:py-6"
		>
			{{ cwsUrl ? c.cta.live : c.cta.soon }}
		</component>
		<p v-reveal="150" class="mt-8 text-[17px]">{{ c.cta.body }}</p>
	</section>
</template>

<script setup lang="ts">
const c = useCopy();
const { cwsUrl } = useAppConfig();
</script>
