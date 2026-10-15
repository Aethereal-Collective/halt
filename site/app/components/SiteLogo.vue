<template>
	<span class="inline-flex items-center gap-[0.35em] font-display font-medium tracking-[-0.04em]">
		<svg viewBox="0 0 128 128" class="h-[1.05em] w-[1.05em]" aria-hidden="true">
			<path d="M64 6 L114 24 V60 C114 92 92 112 64 122 C36 112 14 92 14 60 V24 Z" fill="currentColor" />
			<path d="M42 64 L58 80 L88 48" fill="none" :stroke="checkColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<span>aethereal<span class="opacity-60"> shield</span></span>
	</span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ checkColor?: string }>(), { checkColor: "#134bd6" });
</script>
