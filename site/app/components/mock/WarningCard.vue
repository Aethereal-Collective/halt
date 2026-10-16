<!-- Mirrors the real in-page warning from extension/src/content.js; copy in utils/copy.ts (mock). -->
<template>
	<div class="w-full rounded-2xl border border-[#3f3f46] bg-[#18181b] p-6 text-left text-[15px] leading-normal text-[#fafafa] max-sm:p-4 max-sm:text-[13px]">
		<template v-if="kind === 'domain'">
			<p class="mb-2 font-display text-[20px] font-medium text-[#f87171] max-sm:text-[16px]">{{ m.phishingTitle }}</p>
			<p class="font-semibold">indodaz.com</p>
			<ul class="my-2 list-disc pl-5"><li>{{ m.lookalike }}</li></ul>
			<p class="mt-3 rounded-[10px] bg-[#27272a] p-3 text-[14px] text-[#d4d4d8] max-sm:text-[12px]">{{ m.domainAction }}</p>
			<div class="mt-5 flex gap-2"><span class="flex-1 rounded-[10px] bg-[#fafafa] px-3 py-2.5 text-center font-semibold text-[#09090b]">{{ m.leave }}</span><span class="flex-1 rounded-[10px] border border-[#3f3f46] px-3 py-2.5 text-center text-[#a1a1aa]">{{ m.stay }}</span></div>
		</template>
		<template v-else>
			<p class="mb-2 font-display text-[20px] font-medium text-[#f87171] max-sm:text-[16px]">{{ m.dangerTitle }}</p>
			<p>{{ m.unlimitedFinding }}</p>
			<ul class="my-2 list-disc pl-5"><li>{{ m.spender }}: 0x7a2c…91fe</li><li>Token: USDT</li><li>{{ m.amount }}: {{ m.unlimited }}</li></ul>
			<p class="mt-3 rounded-[10px] bg-[#27272a] p-3 text-[14px] text-[#d4d4d8] max-sm:text-[12px]">{{ m.unlimitedAction }}</p>
			<div class="mt-5 flex gap-2"><span class="flex-1 rounded-[10px] bg-[#fafafa] px-3 py-2.5 text-center font-semibold text-[#09090b]">{{ m.reject }}</span><span class="flex-1 rounded-[10px] border border-[#3f3f46] px-3 py-2.5 text-center text-[#a1a1aa]">{{ m.allow }}</span></div>
		</template>
	</div>
</template>

<script setup lang="ts">
defineProps<{ kind: "domain" | "tx" }>();
const c = useCopy();
const m = computed(() => c.value.mock);
</script>
