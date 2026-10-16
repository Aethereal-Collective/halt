<template>
	<section id="pola" class="relative w-full overflow-hidden bg-white px-[5vw] py-[7%] text-ink max-lg:py-[20%]">
		<h2 v-reveal class="max-w-[11em] text-[clamp(36px,3.6vw,56px)] leading-[1.15]">{{ c.patterns.title }}</h2>
		<p v-reveal="120" class="mt-8 max-w-[34em] text-[17px] leading-[1.7] tracking-[0.02em]">
			{{ c.patterns.body }}
		</p>

		<div class="mt-14 grid grid-cols-[1.6fr_1fr] gap-6 max-lg:grid-cols-1">
			<Transition mode="out-in" enter-from-class="opacity-0 translate-y-3" leave-to-class="opacity-0 -translate-y-3" enter-active-class="transition duration-300" leave-active-class="transition duration-200">
				<article :key="current.title" class="grid grid-cols-[260px_1fr] gap-10 rounded-[28px] border border-brand/80 p-11 max-md:grid-cols-1 max-md:p-6">
					<div class="flex aspect-[3/4] flex-col justify-between rounded-2xl bg-[#101010] p-5 text-white max-md:aspect-[4/3]">
						<component :is="current.icon" class="size-10" :stroke-width="1.3" />
						<div>
							<p class="font-mono text-[13px] break-all text-[#f87171]">{{ current.sample }}</p>
							<p class="mt-2 text-[12px] text-white/60">{{ c.patterns.flagged }}: {{ current.level }}</p>
						</div>
					</div>
					<div class="flex flex-col">
						<svg viewBox="0 0 64 48" class="h-12 w-16 text-brand" aria-hidden="true"><path fill="currentColor" d="M0 48V28C0 12 8 2 26 0l2 7C19 10 15 16 15 24h12v24H0Zm36 0V28c0-16 8-26 26-28l2 7c-9 3-13 9-13 17h12v24H36Z" /></svg>
						<p class="mt-7 text-[17px] leading-[1.5]">{{ current.story }}</p>
						<div class="mt-auto pt-8">
							<p class="chrome-text w-fit text-[22px] font-bold tracking-[-0.03em]">{{ current.title }}</p>
							<p class="mt-1 text-[15px]">{{ c.patterns.handledBy }} {{ current.by }}</p>
						</div>
					</div>
				</article>
			</Transition>

			<div class="flex flex-col gap-6 overflow-hidden">
				<div class="flex justify-end gap-3 pr-6 max-lg:justify-start">
					<button class="grid size-12 place-items-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white" :aria-label="c.patterns.prev" @click="go(-1)"><ArrowLeft class="size-5" /></button>
					<button class="grid size-12 place-items-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white" :aria-label="c.patterns.next" @click="go(1)"><ArrowRight class="size-5" /></button>
				</div>
				<div class="flex gap-5">
					<button
						v-for="p in rest"
						:key="p.title"
						class="flex aspect-square w-[188px] shrink-0 flex-col justify-between rounded-2xl p-4 text-left text-white transition-transform hover:-translate-y-1"
						:class="p.tint"
						@click="index = patterns.findIndex((x) => x.title === p.title)"
					>
						<component :is="p.icon" class="size-8" :stroke-width="1.3" />
						<span class="text-[15px] leading-tight">{{ p.title }}</span>
					</button>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, MessageCircle, Gift, Image as ImageIcon, Headset } from "@lucide/vue";

const c = useCopy();
const META = [
	{ icon: MessageCircle, tint: "bg-brand", by: "Domain Shield", sample: "indodaz.com/promo" },
	{ icon: Gift, tint: "bg-[#101010]", by: "Transaction Guard", sample: "claim-airdrop-pepe.xyz" },
	{ icon: ImageIcon, tint: "chrome-surface", by: "Transaction Guard", sample: "OrderComponents → 0 ETH" },
	{ icon: Headset, tint: "bg-steel", by: "Domain Shield", sample: "metamask-wallet-restore.com" },
];
const patterns = computed(() => c.value.patterns.items.map((p, i) => ({ ...p, ...META[i]! })));

const index = ref(0);
const current = computed(() => patterns.value[index.value]!);
const rest = computed(() => [...patterns.value.slice(index.value + 1), ...patterns.value.slice(0, index.value)]);
const go = (d: number) => (index.value = (index.value + d + patterns.value.length) % patterns.value.length);
</script>
