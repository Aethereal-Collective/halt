<template>
	<section id="faq" class="relative w-full bg-white px-[5vw] pt-[8vh] pb-[14vh] text-ink">
		<h2 v-reveal class="text-[clamp(36px,3.6vw,56px)] leading-[1.15]">Pertanyaan yang Sering Ditanyakan</h2>
		<Accordion v-model="open" type="single" collapsible class="mt-14">
			<AccordionItem
				v-for="(q, i) in faq"
				:key="q.q"
				:value="`q${i}`"
				class="rounded-none border-b border-ink/80 data-[state=open]:rounded-[14px] px-6 transition-colors duration-300 data-[state=open]:border-transparent data-[state=open]:bg-brand data-[state=open]:text-white max-md:px-4"
			>
				<AccordionTrigger class="group py-6 font-display text-[22px] font-normal hover:no-underline max-md:text-[18px]">
					{{ q.q }}
					<template #icon>
						<span class="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white group-data-[state=open]:bg-white group-data-[state=open]:text-brand">
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
const faq = [
	{ q: "Apa sebenarnya yang dilakukan Aethereal Shield?", a: "Shield adalah ekstensi browser yang memblokir situs phishing kripto dan menahan permintaan wallet yang berbahaya, seperti izin token tanpa batas atau tanda tangan Permit. Setiap peringatan dijelaskan dalam Bahasa Indonesia, lengkap dengan saran apa yang sebaiknya kamu lakukan." },
	{ q: "Wallet apa saja yang didukung?", a: "MetaMask, Rabby, OKX Wallet, dan wallet EVM lain di Chrome dan Brave. Dukungan Solana direncanakan untuk versi berikutnya." },
	{ q: "Apakah Shield bisa melihat seed phrase atau saldo saya?", a: "Tidak. Shield tidak membaca seed phrase, private key, saldo, atau alamat wallet kamu, dan tidak mengirim data apa pun keluar dari perangkat." },
	{ q: "Situs resmi saya ikut diblokir. Bagaimana?", a: "Klik \"Ini situs resmi? Laporkan kesalahan\" di halaman peringatan. Situs yang terbukti resmi kami masukkan ke daftar aman di pembaruan berikutnya." },
	{ q: "Kalau sudah pasang Shield, apakah saya pasti aman?", a: "Tidak ada alat yang menjamin itu. Shield mengurangi risiko dari situs palsu dan permintaan wallet yang paling sering dipakai penipu, tapi kamu tetap perlu teliti. Drainer yang sengaja menargetkan Shield bisa melewati penjaga transaksinya." },
	{ q: "Bisa dipakai di HP atau Firefox?", a: "Belum. Saat ini Shield untuk Chrome dan Brave di desktop." },
];
</script>
