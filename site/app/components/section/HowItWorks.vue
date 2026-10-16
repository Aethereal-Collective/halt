<template>
	<section id="cara-kerja" class="relative w-full bg-white px-[5vw] pt-[10vh] pb-[14vh] text-center text-ink">
		<h2 v-reveal class="text-[clamp(38px,4vw,64px)] leading-[1.1]">{{ c.how.title }}</h2>
		<p v-reveal="120" class="mx-auto mt-10 max-w-[48em] text-[18px] leading-[1.6] tracking-[0.02em]">
			{{ c.how.body }}
		</p>

		<ol ref="list" class="mx-auto mt-16 max-w-[560px]">
			<li v-for="(s, i) in c.how.steps" :key="s.title" class="flex flex-col items-center">
				<!-- connector: grey track, ink fill growing with scroll -->
				<div class="relative h-[150px] w-px bg-black/10">
					<div class="absolute inset-x-0 top-0 bg-brand" :style="{ height: `${fill(i) * 100}%` }" />
				</div>
				<span :class="['size-3.5 rounded-full border transition-colors duration-300', fill(i) >= 1 ? 'border-brand bg-brand' : 'border-brand bg-white']" />
				<h3 :class="['mt-9 text-[26px] transition-colors duration-500', state(i)]">{{ s.title }}</h3>
				<p :class="['mt-4 text-[16px] transition-opacity duration-500', fill(i) >= 1 ? 'opacity-90' : 'opacity-40']">{{ s.body }}</p>
			</li>
		</ol>

		<NuxtLink :to="`${localePath('/')}#pasang`" class="mt-24 inline-flex items-center gap-2 rounded-full bg-brand px-9 py-5 text-[17px] font-semibold text-white transition-colors hover:bg-steel">
			{{ c.how.cta }} <ArrowRight class="size-4" />
		</NuxtLink>
	</section>
</template>

<script setup lang="ts">
import { ArrowRight } from "@lucide/vue";

const c = useCopy();
const localePath = useLocalePath();
const steps = computed(() => c.value.how.steps);

const list = ref<HTMLElement>();
const { top, height } = useElementBounding(list);
const { height: vh } = useWindowSize();
// Overall progress through the list as it passes the middle of the screen, split per step.
const progress = computed(() => Math.min(1, Math.max(0, (vh.value * 0.6 - top.value) / Math.max(1, height.value))) * steps.value.length);
const fill = (i: number) => Math.min(1, Math.max(0, progress.value - i));
const state = (i: number) => {
	const f = fill(i);
	if (f >= 1 && progress.value < i + 1.6) return "chrome-text"; // the step you just reached
	if (f >= 1) return "text-ink";
	return "text-ink/30";
};
</script>
