<template>
	<section id="faq" class="relative w-full bg-white px-[5vw] pt-[8vh] pb-[14vh] text-ink">
		<h2 v-reveal class="text-[clamp(36px,3.6vw,56px)] leading-[1.15]">{{ c.faq.title }}</h2>
		<Accordion v-model="open" type="single" collapsible class="mt-14">
			<AccordionItem
				v-for="(q, i) in c.faq.items"
				:key="q.q"
				:value="`q${i}`"
				class="rounded-none border-b border-ink/80 data-[state=open]:rounded-[14px] px-6 transition-colors duration-300 data-[state=open]:border-transparent data-[state=open]:bg-brand data-[state=open]:text-white max-md:px-4"
			>
				<AccordionTrigger class="group py-6 font-display text-[22px] font-normal hover:no-underline max-md:text-[18px]">
					{{ q.q }}
					<template #icon>
						<span class="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white group-data-[state=open]:bg-white group-data-[state=open]:text-ink">
							<Plus class="size-5 group-data-[state=open]:hidden" :stroke-width="1.5" />
							<Minus class="hidden size-5 group-data-[state=open]:block" :stroke-width="2" />
						</span>
					</template>
				</AccordionTrigger>
				<AccordionContent class="max-w-[52em] pb-8 text-[16px] leading-[1.65] text-white/95">{{ q.a }}</AccordionContent>
			</AccordionItem>
		</Accordion>
	</section>
</template>

<script setup lang="ts">
import { Plus, Minus } from "@lucide/vue";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const open = ref("q0");
const c = useCopy();
</script>
