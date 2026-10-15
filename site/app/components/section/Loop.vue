<template>
	<section ref="root" class="relative w-full overflow-hidden bg-white pt-[8vh] pb-[14vh] text-ink">
		<div class="px-[5vw]">
			<h2 v-reveal class="max-w-[15em] text-[clamp(34px,3.6vw,56px)] leading-[1.15]">Setiap Laporan Membuat Shield Lebih Pintar</h2>
			<p v-reveal="120" class="mt-8 max-w-[34em] text-[17px] leading-[1.6]">
				Daftar phishing dan model pendeteksi diperbarui dari laporan komunitas dan sumber terbuka berlisensi, lalu ikut di setiap pembaruan ekstensi.
			</p>
		</div>
		<!-- Cards drift left as the section scrolls by. -->
		<div class="mt-[8vh] flex w-max gap-7 pl-[5vw] will-change-transform" :style="{ transform: `translateX(${shift}px)` }">
			<article
				v-for="(c, i) in cards"
				:key="c.title"
				:class="['flex h-[436px] w-[402px] shrink-0 flex-col justify-between rounded-[22px] p-8 text-white max-sm:h-[360px] max-sm:w-[300px]', i % 2 ? 'bg-[#101010]' : 'bg-brand']"
			>
				<component :is="c.icon" class="size-11" :stroke-width="1.2" />
				<div>
					<h3 class="max-w-[9em] text-[34px] leading-[1.15] max-sm:text-[28px]">{{ c.title }}</h3>
					<p class="mt-8 text-[16px] leading-[1.4] text-white/90">{{ c.body }}</p>
				</div>
			</article>
		</div>
	</section>
</template>

<script setup lang="ts">
import { Flag, UserCheck, ListPlus, BrainCircuit, ShieldCheck } from "@lucide/vue";

const cards = [
	{ icon: Flag, title: "Komunitas Melapor", body: "Kamu melaporkan situs mencurigakan dengan satu klik dari popup Shield." },
	{ icon: UserCheck, title: "Tim Memverifikasi", body: "Setiap laporan dicek manual dulu, supaya situs resmi tidak ikut diblokir." },
	{ icon: ListPlus, title: "Daftar Diperbarui", body: "Domain baru bergabung dengan lebih dari 160.000 domain phishing yang sudah dikenali." },
	{ icon: BrainCircuit, title: "Model Belajar Lagi", body: "Model pendeteksi lokal dilatih ulang dengan pola penipuan terbaru." },
	{ icon: ShieldCheck, title: "Kamu Lebih Terlindungi", body: "Pembaruan sampai ke browser kamu, tanpa data kamu pernah keluar dari perangkat." },
];

const root = ref<HTMLElement>();
const { top } = useElementBounding(root);
const { height: vh, width: vw } = useWindowSize();
// Move up to ~one viewport width left while the section crosses the screen.
const shift = computed(() => {
	const p = Math.min(1, Math.max(0, (vh.value - top.value) / (vh.value * 2)));
	return -p * Math.min(vw.value * 0.9, 1100);
});
</script>
