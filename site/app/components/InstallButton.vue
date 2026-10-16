<template>
	<component
		:is="cwsUrl ? 'a' : 'span'"
		:href="cwsUrl || undefined"
		:aria-disabled="cwsUrl ? undefined : 'true'"
		:class="
			cn(
				'inline-flex items-center gap-3 rounded-full py-3 pl-6 pr-8 transition-colors',
				tone === 'dark' && 'bg-brand text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] hover:bg-steel',
				tone === 'white' && 'border border-black/10 bg-white text-ink hover:bg-paper',
				tone === 'glass' && 'bg-white text-ink hover:bg-white/90',
				!cwsUrl && 'cursor-default',
			)
		"
	>
		<Puzzle class="size-7 shrink-0" :stroke-width="1.6" />
		<span class="flex flex-col text-left leading-none">
			<span class="text-[11px] opacity-80">{{ cwsUrl ? c.install.live : c.install.soon }}</span>
			<span class="mt-1 text-[19px] font-semibold tracking-[-0.02em]">{{ c.install.store }}</span>
		</span>
	</component>
</template>

<script setup lang="ts">
import { Puzzle } from "@lucide/vue";
import { cn } from "@/lib/utils";

withDefaults(defineProps<{ tone?: "dark" | "white" | "glass" }>(), { tone: "dark" });
const { cwsUrl } = useAppConfig();
const c = useCopy();
</script>
