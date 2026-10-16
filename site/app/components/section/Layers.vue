<template>
	<section class="relative w-full bg-white px-[5vw] pt-[6vh] pb-[14vh] text-ink">
		<h2 v-reveal class="mb-12 text-[clamp(34px,3.2vw,50px)] leading-[1.2]">{{ c.layers.title }}</h2>

		<!-- Stacked sticky cards (desktop): each pins a little lower than the previous one. -->
		<div class="relative">
			<article
				v-for="(layer, i) in c.layers.cards"
				:key="layer.title"
				class="mb-[10vh] grid grid-cols-[1fr_1.3fr] items-center gap-10 rounded-[28px] border border-ink bg-white px-9 py-10 lg:sticky max-lg:mb-6 max-lg:grid-cols-1 max-md:px-5 max-md:py-8"
				:style="{ top: `calc(90px + ${i * 24}px)` }"
			>
				<div>
					<h3 class="chrome-text w-fit text-[clamp(28px,2.6vw,38px)]">{{ layer.title }}</h3>
					<p class="mt-4 max-w-[26em] text-[16px] leading-[1.6] text-ink/75">{{ layer.body }}</p>
				</div>
				<ul class="grid grid-cols-2 gap-x-6 gap-y-6 max-sm:grid-cols-1">
					<li v-for="(item, j) in layer.items" :key="item" class="flex items-center gap-4">
						<span class="grid size-[46px] shrink-0 place-items-center rounded-lg bg-brand text-white"><component :is="ICONS[i]![j]" class="size-6" :stroke-width="1.4" /></span>
						<span class="text-[16px] leading-snug">{{ item }}</span>
					</li>
				</ul>
			</article>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ShieldAlert, Copy, Type, Cpu, Infinity as InfinityIcon, Images, PenLine, FileWarning, ServerOff, UserX, EyeOff, Laptop } from "@lucide/vue";

const c = useCopy();
// Same order as c.layers.cards[i].items.
const ICONS = [
	[ShieldAlert, Copy, Type, Cpu],
	[InfinityIcon, Images, PenLine, FileWarning],
	[ServerOff, UserX, EyeOff, Laptop],
];
</script>
