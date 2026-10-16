<template>
	<section id="pasang" class="relative min-h-screen w-full overflow-hidden bg-white">
		<!-- black -> graphite -> steel -> white: the reference's sweep, in Aethereal's monochrome -->
		<!-- On phones the copy stacks above the mockup, so the dark part runs longer to keep white text readable. -->
		<div class="absolute inset-0 bg-[linear-gradient(180deg,#000_0%,#0a0a0a_10%,#3f3f46_22%,#a1a1aa_32%,#e4e4e7_42%,#f7f7f8_58%,#fff_100%)] max-lg:bg-[linear-gradient(180deg,#000_0%,#0a0a0a_45%,#27272a_62%,#a1a1aa_80%,#fff_100%)]" />
		<p
			aria-hidden="true"
			class="pointer-events-none absolute inset-x-0 top-[17vh] select-none text-center font-display text-[26vw] leading-none font-extrabold tracking-[-0.06em] text-transparent bg-linear-to-b from-white/25 via-black/5 to-black/10 bg-clip-text max-md:top-[14vh]"
		>
			HALT
		</p>

		<div class="relative grid min-h-screen grid-cols-[0.95fr_1.05fr] items-end gap-[4vw] px-[5vw] pt-[22vh] pb-[12vh] max-lg:grid-cols-1 max-lg:pt-[28vh]">
			<div class="animate-in fade-in slide-in-from-bottom-10 duration-1000 max-lg:order-2">
				<MockBrowserFrame url="https://indodaz.com/login" danger>
					<div class="grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#1e293b,#09090b_70%)] px-6 py-10 max-sm:px-3 max-sm:py-6">
						<MockWarningCard kind="domain" class="max-w-[440px]" />
					</div>
				</MockBrowserFrame>
			</div>

			<div class="pb-[2vh] text-ink max-lg:order-1 max-lg:text-white">
				<h1 class="animate-in fade-in slide-in-from-bottom-6 text-[clamp(44px,4.8vw,76px)] leading-[1.2] duration-1000">
					{{ c.hero.title[0] }}<br class="max-sm:hidden" /> {{ c.hero.title[1] }}
				</h1>
				<p class="animate-in fade-in slide-in-from-bottom-6 mt-8 max-w-[24em] text-[17px] leading-[1.6] tracking-[0.025em] delay-150 duration-1000 fill-mode-both max-lg:text-white/85">
					{{ c.hero.body }}
				</p>
				<div class="animate-in fade-in slide-in-from-bottom-6 mt-10 flex flex-wrap gap-4 delay-300 duration-1000 fill-mode-both">
					<InstallButton tone="dark" class="max-lg:hidden" />
					<InstallButton tone="glass" class="lg:hidden" />
					<NuxtLink :to="`${localePath('/')}#cara-kerja`" class="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white py-3 pr-8 pl-6 text-ink transition-colors hover:bg-paper">
						<PlayCircle class="size-7" :stroke-width="1.6" />
						<span class="flex flex-col leading-none"><span class="text-[11px] opacity-70">{{ c.install.peekTop }}</span><span class="mt-1 text-[19px] font-semibold tracking-[-0.02em]">{{ c.install.peek }}</span></span>
					</NuxtLink>
				</div>
				<p class="animate-in fade-in mt-6 text-[15px] delay-500 duration-1000 fill-mode-both max-lg:text-white/85">
					<span class="font-bold">160K+ ✓</span> {{ c.hero.proof }}
				</p>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
const c = useCopy();
const localePath = useLocalePath();
import { PlayCircle } from "@lucide/vue";
</script>
