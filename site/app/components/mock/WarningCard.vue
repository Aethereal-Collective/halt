<!-- Mirrors the real in-page warning from extension/src/content.js. Keep the copy in sync. -->
<template>
	<div class="w-full rounded-2xl border border-[#3f3f46] bg-[#18181b] p-6 text-left text-[15px] leading-normal text-[#fafafa] max-sm:p-4 max-sm:text-[13px]">
		<template v-if="kind === 'domain'">
			<p class="mb-2 font-display text-[20px] font-medium text-[#f87171] max-sm:text-[16px]">⚠️ Situs ini kemungkinan phishing</p>
			<p class="font-semibold">indodaz.com</p>
			<ul class="my-2 list-disc pl-5"><li>Alamat situs ini meniru Indodax, tapi bukan situs resmi Indodax.</li></ul>
			<p class="mt-3 rounded-[10px] bg-[#27272a] p-3 text-[14px] text-[#d4d4d8] max-sm:text-[12px]">Jangan sambungkan wallet atau ketik seed phrase di sini. Buka situs resmi dari bookmark atau ketik alamatnya sendiri.</p>
			<div class="mt-5 flex gap-2"><span class="flex-1 rounded-[10px] bg-[#fafafa] px-3 py-2.5 text-center font-semibold text-[#09090b]">Keluar dari situs ini</span><span class="flex-1 rounded-[10px] border border-[#3f3f46] px-3 py-2.5 text-center text-[#a1a1aa]">Saya paham risikonya</span></div>
		</template>
		<template v-else>
			<p class="mb-2 font-display text-[20px] font-medium text-[#f87171] max-sm:text-[16px]">⚠️ Permintaan berbahaya</p>
			<p>Situs ini meminta izin TANPA BATAS untuk memindahkan token kamu.</p>
			<ul class="my-2 list-disc pl-5"><li>Penerima izin: 0x7a2c…91fe</li><li>Token: USDT</li><li>Jumlah: TANPA BATAS</li></ul>
			<p class="mt-3 rounded-[10px] bg-[#27272a] p-3 text-[14px] text-[#d4d4d8] max-sm:text-[12px]">Tolak, kecuali kamu yakin ini situs resmi. Kalau perlu, izinkan sejumlah yang mau kamu pakai saja.</p>
			<div class="mt-5 flex gap-2"><span class="flex-1 rounded-[10px] bg-[#fafafa] px-3 py-2.5 text-center font-semibold text-[#09090b]">Tolak</span><span class="flex-1 rounded-[10px] border border-[#3f3f46] px-3 py-2.5 text-center text-[#a1a1aa]">Lanjutkan ke wallet</span></div>
		</template>
	</div>
</template>

<script setup lang="ts">
defineProps<{ kind: "domain" | "tx" }>();
</script>
