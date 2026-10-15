<template>
	<section class="relative w-full bg-white px-[5vw] pt-[10vh] pb-[20vh] text-ink">
		<h2 v-reveal class="mb-[10vh] max-w-[12em] text-[clamp(34px,3.2vw,50px)] leading-[1.2]">Lapisan Perlindungan Khusus untuk Aset Kripto Kamu</h2>

		<!-- Stacked sticky cards: each pins a little lower than the previous one, so titles stay visible. -->
		<div class="relative">
			<article
				v-for="(layer, i) in layers"
				:key="layer.title"
				class="mb-[18vh] lg:sticky max-lg:mb-6 rounded-[28px] border border-ink bg-white px-9 pt-12 pb-9 max-md:px-5 max-md:pt-8"
				:style="{ top: `calc(90px + ${i * 105}px)` }"
			>
				<h3 class="text-[clamp(28px,2.6vw,38px)] text-brand">{{ layer.title }}</h3>
				<hr v-if="i === layers.length - 1" class="mt-8 border-black/10" />
				<div class="mt-[8vh] grid grid-cols-[1.4fr_1fr] items-center gap-10 max-lg:grid-cols-1 max-lg:mt-8">
					<ul class="grid grid-cols-2 gap-x-0 gap-y-7 max-sm:grid-cols-1">
						<li v-for="(item, j) in layer.items" :key="item.label" :class="['flex items-center gap-4 pr-6', j % 2 === 0 && 'border-r border-black/15 max-sm:border-0', j % 2 === 1 && 'pl-14 max-sm:pl-0']">
							<span class="grid size-[50px] shrink-0 place-items-center rounded-lg bg-brand text-white"><component :is="item.icon" class="size-7" :stroke-width="1.3" /></span>
							<span class="text-[17px] leading-snug">{{ item.label }}</span>
						</li>
					</ul>
					<div class="max-w-[24em]">
						<p class="text-[16px] leading-[1.6]">{{ layer.body }}</p>
						<NuxtLink :to="layer.to" class="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#0f3fb8]">
							Pelajari Lebih <ArrowRight class="size-4" />
						</NuxtLink>
					</div>
				</div>
			</article>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ArrowRight, ShieldAlert, Copy, Type, Cpu, Infinity as InfinityIcon, Images, PenLine, FileWarning, Languages, ListChecks, Receipt, Ban, ServerOff, UserX, EyeOff, Laptop } from "@lucide/vue";

const layers = [
	{
		title: "Domain Shield",
		body: "Situs tiruan exchange dan dApp diblokir dengan peringatan layar penuh sebelum kamu sempat mengetik apa pun.",
		to: "/#cara-kerja",
		items: [
			{ icon: ShieldAlert, label: "Daftar Phishing" },
			{ icon: Copy, label: "Deteksi Nama Tiruan" },
			{ icon: Type, label: "Huruf Mirip & Punycode" },
			{ icon: Cpu, label: "Model Lokal" },
		],
	},
	{
		title: "Transaction Guard",
		body: "Permintaan izin dan tanda tangan yang biasa dipakai drainer ditahan dulu. Kamu yang memutuskan: tolak atau lanjut ke wallet.",
		to: "/#pola",
		items: [
			{ icon: InfinityIcon, label: "Izin Tanpa Batas" },
			{ icon: Images, label: "Izin Semua NFT" },
			{ icon: PenLine, label: "Permit & Permit2" },
			{ icon: FileWarning, label: "Tanda Tangan eth_sign" },
		],
	},
	{
		title: "Peringatan yang Jelas",
		body: "Setiap peringatan menjelaskan apa yang bisa terjadi pada aset kamu dan apa yang sebaiknya kamu lakukan, tanpa istilah teknis.",
		to: "/#faq",
		items: [
			{ icon: Languages, label: "Bahasa Indonesia" },
			{ icon: ListChecks, label: "Saran Tindakan" },
			{ icon: Receipt, label: "Detail Transaksi" },
			{ icon: Ban, label: "Tombol Tolak" },
		],
	},
	{
		title: "Privasi Penuh",
		body: "Semua pemeriksaan berjalan di perangkat kamu. Tidak ada server, tidak ada akun, dan tidak ada data yang dikirim ke mana pun.",
		to: "/privacy",
		items: [
			{ icon: ServerOff, label: "Tanpa Server" },
			{ icon: UserX, label: "Tanpa Akun" },
			{ icon: EyeOff, label: "Tanpa Pelacakan" },
			{ icon: Laptop, label: "Di Perangkat Kamu" },
		],
	},
];
</script>
