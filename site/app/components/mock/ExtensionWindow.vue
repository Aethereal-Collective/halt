<!-- A tall extension-popup window, playing the role the phone mockups play in the reference layout. -->
<template>
	<div :class="['overflow-hidden rounded-[34px] border-[6px] border-[#1a1a1a] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]', bg]">
		<div class="flex items-center justify-between px-5 pt-4 pb-2 text-[11px]" :class="dark ? 'text-white/70' : 'text-ink/60'">
			<span>Halt</span>
			<span class="flex gap-1"><i class="size-1.5 rounded-full bg-current" /><i class="size-1.5 rounded-full bg-current" /><i class="size-1.5 rounded-full bg-current" /></span>
		</div>
		<div class="px-4 pb-5"><slot /></div>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ tone?: "dark" | "chrome" | "light" }>(), { tone: "dark" });
const dark = computed(() => props.tone !== "light");
const bg = computed(() => ({ dark: "bg-[#09090b]", chrome: "chrome-surface", light: "bg-white" })[props.tone]);
</script>
