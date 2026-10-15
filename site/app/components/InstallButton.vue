<template>
	<component
		:is="cwsUrl ? 'a' : 'span'"
		:href="cwsUrl || undefined"
		:aria-disabled="cwsUrl ? undefined : 'true'"
		:class="
			cn(
				'inline-flex items-center gap-3 rounded-full py-3 pl-6 pr-8 transition-colors',
				tone === 'blue' && 'bg-brand text-white hover:bg-[#0f3fb8]',
				tone === 'white' && 'border border-black/10 bg-white text-ink hover:bg-paper',
				tone === 'glass' && 'bg-white text-ink hover:bg-white/90',
				!cwsUrl && 'cursor-default',
			)
		"
	>
		<Puzzle class="size-7 shrink-0" :stroke-width="1.6" />
		<span class="flex flex-col text-left leading-none">
			<span class="text-[11px] opacity-80">{{ cwsUrl ? "Tersedia di" : "Segera hadir di" }}</span>
			<span class="mt-1 text-[19px] font-medium tracking-[-0.01em]">Chrome Web Store</span>
		</span>
	</component>
</template>

<script setup lang="ts">
import { Puzzle } from "@lucide/vue";
import { cn } from "@/lib/utils";

withDefaults(defineProps<{ tone?: "blue" | "white" | "glass" }>(), { tone: "blue" });
const { cwsUrl } = useAppConfig();
</script>
