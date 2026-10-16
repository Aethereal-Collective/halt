<template>
	<section id="fitur" class="relative w-full overflow-hidden bg-white px-[5vw] pt-[14vh] pb-[16vh] text-ink">
		<div class="flex items-start justify-between gap-12 max-lg:flex-col">
			<h2 v-reveal class="max-w-[13em] text-[clamp(36px,3.8vw,58px)] leading-[1.15]">{{ c.overview.title }}</h2>
			<p v-reveal="150" class="max-w-[30em] text-right text-[17px] leading-[1.75] tracking-[0.02em] text-ink/80 max-lg:text-left">
				{{ c.overview.body }}
			</p>
		</div>

		<div class="relative mt-[14vh] grid grid-cols-3 items-start gap-[4vw] px-[6vw] max-lg:grid-cols-1 max-lg:px-0">
			<!-- dashed connectors behind the windows -->
			<svg class="pointer-events-none absolute inset-0 -z-0 h-full w-full max-lg:hidden" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
				<path d="M -6 82 H 30 Q 32 82 32 76 V 10 Q 32 4 36 4 H 64 Q 68 4 68 10 V 44 Q 68 50 72 50 H 106" fill="none" stroke="#71717a" stroke-opacity="0.6" stroke-width="0.12" stroke-dasharray="0.8 0.6" vector-effect="non-scaling-stroke" style="stroke-width: 1.2px" />
			</svg>

			<MockExtensionWindow v-reveal tone="dark" class="relative">
				<p class="text-[15px] font-semibold text-white">{{ c.mock.popupTitle }}</p>
				<div class="mt-3 rounded-[10px] border-l-4 border-[#16a34a] bg-[#18181b] p-3">
					<p class="font-semibold text-white">{{ c.mock.safe }}</p>
					<p class="text-[12px] text-white/50">app.uniswap.org</p>
				</div>
				<div class="mt-3 rounded-[10px] border-l-4 border-[#d97706] bg-[#18181b] p-3">
					<p class="font-semibold text-white">{{ c.mock.warn }}</p>
					<p class="text-[12px] text-white/50">claim-airdrop-pepe.xyz</p>
				</div>
				<div class="mt-3 rounded-[10px] border-l-4 border-[#dc2626] bg-[#18181b] p-3">
					<p class="font-semibold text-white">{{ c.mock.danger }}</p>
					<p class="text-[12px] text-white/50">metamask-wallet-restore.com</p>
				</div>
				<p class="mt-5 text-[13px] text-white/50 underline">{{ c.mock.report }}</p>
				<p class="mt-2 text-[11px] text-white/40">{{ c.mock.disclaimer }}</p>
			</MockExtensionWindow>

			<MockExtensionWindow v-reveal="150" tone="chrome" class="relative mt-[8vh] max-lg:mt-0">
				<div class="flex min-h-[380px] flex-col items-center justify-between py-6 text-center text-white">
					<div>
						<SiteLogo class="text-[34px] text-white" />
						<p class="mt-3 text-[13px] text-white/85">{{ c.overview.tagline }}</p>
					</div>
					<span class="rounded-full bg-white px-8 py-3 text-[14px] text-ink">{{ c.overview.cta }}</span>
				</div>
			</MockExtensionWindow>

			<MockExtensionWindow v-reveal="300" tone="light" class="relative">
				<p class="text-[15px] font-semibold">{{ c.mock.holds }}</p>
				<div class="mt-3 grid grid-cols-2 gap-2.5">
					<div v-for="t in tiles" :key="t.label" class="rounded-2xl bg-[#18181b] p-3 text-center text-white">
						<component :is="t.icon" class="mx-auto size-7" :stroke-width="1.5" />
						<p class="mt-2 text-[13px] leading-tight">{{ t.label }}</p>
						<p class="text-[10px] text-white/50">{{ t.risk }}</p>
					</div>
				</div>
				<span class="mt-4 block rounded-xl bg-brand py-3 text-center text-[14px] text-white">{{ c.mock.reject }}</span>
			</MockExtensionWindow>
		</div>
	</section>
</template>

<script setup lang="ts">
const c = useCopy();
import { Infinity as InfinityIcon, Images, PenLine, FileWarning } from "@lucide/vue";

const ICONS = [InfinityIcon, Images, PenLine, FileWarning];
const tiles = computed(() => c.value.mock.tiles.map(([label, risk], i) => ({ icon: ICONS[i], label, risk })));
</script>
