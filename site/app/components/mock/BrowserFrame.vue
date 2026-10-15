<template>
	<div class="overflow-hidden rounded-[18px] border border-white/15 bg-[#1c1c1f] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]">
		<div class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
			<span class="flex gap-1.5"><i class="size-3 rounded-full bg-[#ff5f57]" /><i class="size-3 rounded-full bg-[#febc2e]" /><i class="size-3 rounded-full bg-[#28c840]" /></span>
			<span :class="['flex-1 truncate rounded-full bg-black/40 px-4 py-1.5 font-mono text-[13px]', danger ? 'text-[#f87171]' : 'text-white/70']">{{ url }}</span>
			<span :class="['grid size-7 place-items-center rounded-md text-[11px] font-bold', danger ? 'bg-[#dc2626] text-white' : 'bg-white/10 text-white/60']">{{ danger ? "X" : "" }}</span>
		</div>
		<div class="relative"><slot /></div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ url: string; danger?: boolean }>();
</script>
