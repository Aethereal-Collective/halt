<template>
	<!-- Tall track + sticky text: words light up blue, then settle to ink, as you scroll through. -->
	<section ref="track" class="relative h-[220vh] w-full bg-white">
		<div class="sticky top-0 flex h-screen items-center justify-center px-[14vw] max-md:px-6">
			<p class="text-center font-display text-[clamp(30px,4vw,64px)] leading-[1.6] font-medium tracking-[-0.03em]">
				<span v-for="(w, i) in words" :key="i" class="transition-colors duration-300" :style="{ color: colorFor(i) }">{{ `${w} ` }}</span>
			</p>
		</div>
	</section>
</template>

<script setup lang="ts">
const text = "Setiap klik di dunia kripto bisa jadi jebakan. Shield memeriksa situs dan transaksi kamu lebih dulu, jadi setiap keputusan kamu ambil dengan informasi yang jelas.";
const words = text.split(" ");

const track = ref<HTMLElement>();
const { top, height } = useElementBounding(track);
const { height: vh } = useWindowSize();
// 0 when the track reaches the top, 1 when its sticky part is about to leave.
const progress = computed(() => Math.min(1, Math.max(0, -top.value / Math.max(1, height.value - vh.value))));

// Each word: faint -> brand blue (front of the wave) -> ink (behind it).
function colorFor(i: number) {
	const lit = progress.value * (words.length + 4);
	if (i < lit - 4) return "#111111";
	if (i < lit) return "#134bd6";
	return "rgba(19, 75, 214, 0.18)";
}
</script>
