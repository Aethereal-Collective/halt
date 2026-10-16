<template>
	<section class="relative w-full overflow-hidden bg-white py-[7%] text-ink max-lg:py-[10%]">
		<div class="px-[5vw]">
			<h2 v-reveal class="max-w-[15em] text-[clamp(36px,3.6vw,56px)] leading-[1.15]">{{ c.tips.title }}</h2>
			<p v-reveal="120" class="mt-8 max-w-[26em] text-[17px] leading-[1.7] tracking-[0.02em]">{{ c.tips.body }}</p>
		</div>

		<div class="mt-12 grid grid-cols-[minmax(0,22vw)_1fr] gap-8 pl-[5vw] max-lg:grid-cols-1">
			<div class="flex flex-col justify-between max-lg:flex-row max-lg:items-center max-lg:pr-[5vw]">
				<a :href="reportUrl" target="_blank" rel="noopener noreferrer" class="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-steel">
					{{ c.tips.report }} <ArrowRight class="size-4" />
				</a>
				<div class="flex gap-3">
					<button class="grid size-12 place-items-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-30" :disabled="atStart" :aria-label="c.tips.prev" @click="scroll(-1)"><ArrowLeft class="size-5" /></button>
					<button class="grid size-12 place-items-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-30" :disabled="atEnd" :aria-label="c.tips.next" @click="scroll(1)"><ArrowRight class="size-5" /></button>
				</div>
			</div>

			<div ref="rail" class="flex snap-x snap-mandatory gap-5 overflow-x-auto pr-[5vw] pb-2 [scrollbar-width:none]">
				<article v-for="t in tips" :key="t.title" class="w-[432px] shrink-0 snap-start max-sm:w-[82vw]">
					<div :class="['relative grid aspect-[432/400] place-items-center overflow-hidden rounded-[22px]', t.bg]">
						<div class="absolute inset-0 opacity-20 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
						<component :is="t.icon" class="relative size-28 text-white" :stroke-width="0.9" />
					</div>
					<h3 class="mt-6 text-[24px] leading-tight">{{ t.title }}</h3>
					<p class="mt-3 text-[16px] leading-[1.6] text-ink/75">{{ t.body }}</p>
				</article>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, Bookmark, KeyRound, SlidersHorizontal, RotateCcw, WalletCards } from "@lucide/vue";

const { reportUrl } = useAppConfig();

const c = useCopy();
const META = [
	{ icon: Bookmark, bg: "bg-brand" },
	{ icon: KeyRound, bg: "bg-[#101010]" },
	{ icon: SlidersHorizontal, bg: "chrome-surface" },
	{ icon: RotateCcw, bg: "bg-steel" },
	{ icon: WalletCards, bg: "bg-brand" },
];
const tips = computed(() => c.value.tips.items.map((t, i) => ({ ...t, ...META[i]! })));

const rail = ref<HTMLElement>();
const { arrivedState } = useScroll(rail);
const atStart = computed(() => arrivedState.left);
const atEnd = computed(() => arrivedState.right);
const scroll = (d: number) => rail.value?.scrollBy({ left: d * 452, behavior: "smooth" });
</script>
