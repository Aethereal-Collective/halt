<template>
	<section ref="root" class="relative h-screen w-full overflow-hidden bg-black text-white max-lg:h-fit">
		<!-- Abstract stand-in for the reference's photo: grid, glows and a large shield outline. -->
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(19,75,214,0.55),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(20,20,240,0.45),transparent_40%),#050505]" />
		<div class="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:64px_64px]" />
		<svg viewBox="0 0 128 128" class="absolute top-1/2 left-1/2 h-[120%] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" aria-hidden="true">
			<path d="M64 6 L114 24 V60 C114 92 92 112 64 122 C36 112 14 92 14 60 V24 Z" fill="none" stroke="#fff" stroke-width="1" />
			<path d="M42 64 L58 80 L88 48" fill="none" stroke="#fff" stroke-width="1" />
		</svg>

		<div class="relative flex h-full items-center px-[10vw] py-[12vh] max-md:px-4">
			<div v-reveal class="flex h-[78vh] w-full flex-col justify-between rounded-[26px] border border-white/15 bg-white/10 px-[3.5vw] py-[6vh] backdrop-blur-md max-lg:h-fit max-lg:gap-24 max-md:px-6">
				<h2 class="max-w-[8em] text-[clamp(38px,3.6vw,56px)] leading-[1.15]">Dibangun di Atas Data Nyata</h2>
				<dl class="grid grid-cols-4 gap-[3vw] max-lg:grid-cols-2 max-lg:gap-y-10">
					<div v-for="s in stats" :key="s.label" class="flex flex-col">
						<dt class="order-2 mt-4 border-t border-white/30 pt-4 text-[17px] text-white/90">{{ s.label }}</dt>
						<dd class="-order-1 font-display text-[clamp(40px,3.6vw,56px)] leading-none tabular-nums">{{ format(s, counted) }}</dd>
					</div>
				</dl>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
const stats = [
	{ value: 160, suffix: "K+", label: "Domain Phishing Dikenali" },
	{ value: 20, suffix: "", label: "Brand Kripto Dilindungi" },
	{ value: 7, suffix: "", label: "Jenis Permintaan Berisiko" },
	{ value: 0, suffix: "", label: "Data Kamu yang Dikirim" },
];

// Count up once, the first time the section is on screen.
const root = ref<HTMLElement>();
const counted = ref(0);
const { stop } = useIntersectionObserver(root, ([entry]) => {
	if (!entry?.isIntersecting) return;
	stop();
	const start = performance.now();
	const tick = (now: number) => {
		counted.value = Math.min(1, (now - start) / 1600);
		if (counted.value < 1) requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}, { threshold: 0.3 });

const format = (s: (typeof stats)[number], t: number) => `${Math.round(s.value * (1 - (1 - t) ** 3))}${s.suffix}`;
</script>
