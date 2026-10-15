<template>
	<section id="pasang" class="relative min-h-screen w-full overflow-hidden bg-white">
		<!-- black -> deep blue -> soft periwinkle -> white, like the reference -->
		<div class="absolute inset-0 bg-[linear-gradient(180deg,#000_0%,#030b2a_14%,#0d2a8a_34%,#3c5fd6_52%,#9fb1ec_70%,#e9edfb_86%,#fff_100%)]" />
		<p
			aria-hidden="true"
			class="pointer-events-none absolute inset-x-0 top-[17vh] select-none text-center font-display text-[24vw] leading-none font-medium tracking-[-0.03em] text-transparent bg-linear-to-b from-[#134bd6]/70 via-[#134bd6]/25 to-transparent bg-clip-text max-md:top-[14vh]"
		>
			SHIELD
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
					Satu Ekstensi untuk<br class="max-sm:hidden" /> Jaga Aset Kripto Kamu
				</h1>
				<p class="animate-in fade-in slide-in-from-bottom-6 mt-8 max-w-[24em] text-[17px] leading-[1.6] tracking-[0.025em] delay-150 duration-1000 fill-mode-both max-lg:text-white/85">
					Shield mengenali situs palsu, menahan transaksi wallet yang berbahaya, dan menjelaskan risikonya dalam Bahasa Indonesia sebelum kamu tanda tangan.
				</p>
				<div class="animate-in fade-in slide-in-from-bottom-6 mt-10 flex flex-wrap gap-4 delay-300 duration-1000 fill-mode-both">
					<InstallButton tone="blue" />
					<NuxtLink to="/#cara-kerja" class="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white py-3 pr-8 pl-6 text-ink transition-colors hover:bg-paper">
						<PlayCircle class="size-7" :stroke-width="1.6" />
						<span class="flex flex-col leading-none"><span class="text-[11px] opacity-70">Lihat dulu</span><span class="mt-1 text-[19px] font-medium tracking-[-0.01em]">Cara Kerjanya</span></span>
					</NuxtLink>
				</div>
				<p class="animate-in fade-in mt-6 text-[15px] delay-500 duration-1000 fill-mode-both max-lg:text-white/85">
					<span class="font-medium text-[#16a34a] max-lg:text-[#4ade80]">160K+ ✓</span> Domain phishing kripto dikenali · Untuk Chrome dan Brave
				</p>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { PlayCircle } from "@lucide/vue";
</script>
