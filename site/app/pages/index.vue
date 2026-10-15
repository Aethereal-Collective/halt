<template>
	<main>
		<section class="hero wrap">
			<div>
				<p class="eyebrow">Ekstensi browser untuk pengguna kripto Indonesia</p>
				<h1>Berhenti sebelum aset kripto kamu dikuras.</h1>
				<p class="lead">
					Aethereal Shield memblokir situs tiruan exchange dan dApp, lalu menahan permintaan wallet yang berbahaya sebelum kamu tanda tangan.
					Peringatannya dalam Bahasa Indonesia yang jelas.
				</p>
				<div class="cta">
					<a v-if="cwsUrl" :href="cwsUrl" class="btn primary">Pasang di Chrome</a>
					<span v-else class="btn primary disabled" aria-disabled="true">Segera di Chrome Web Store</span>
					<a href="#cara-kerja" class="btn ghost">Lihat cara kerjanya</a>
				</div>
				<p class="muted small">Chrome dan Brave · Berjalan di perangkat kamu · Bukan jaminan keamanan</p>
			</div>
			<div class="mock danger" aria-label="Contoh peringatan situs palsu">
				<h2>⚠️ Situs ini kemungkinan phishing</h2>
				<p><b>indodaz.com</b></p>
				<ul><li>Alamat situs ini meniru Indodax, tapi bukan situs resmi Indodax.</li></ul>
				<div class="todo">Jangan sambungkan wallet atau ketik seed phrase di sini. Buka situs resmi dari bookmark atau ketik alamatnya sendiri.</div>
				<div class="row"><span class="b-primary">Keluar dari situs ini</span><span class="b-ghost">Saya paham risikonya, lanjutkan</span></div>
			</div>
		</section>

		<section class="stats wrap">
			<div><b>160.000+</b><span>domain phishing kripto dikenali</span></div>
			<div><b>7</b><span>jenis permintaan wallet berisiko diperiksa</span></div>
			<div><b>0</b><span>data kamu yang dikirim ke server</span></div>
		</section>

		<section id="cara-kerja" class="wrap split">
			<div>
				<p class="eyebrow">Lapis 1</p>
				<h2>Situs palsu diblokir sebelum kamu sempat mengetik</h2>
				<p>Penipu menyebar tautan tiruan lewat grup WhatsApp, Telegram, DM "admin", dan iklan pencarian. Shield memeriksa setiap alamat yang kamu buka:</p>
				<ul class="checks">
					<li><b>Daftar phishing</b> berisi lebih dari 160.000 domain yang sudah dilaporkan.</li>
					<li><b>Nama tiruan</b> seperti <code>indodaz.com</code>, <code>metarnask.io</code>, atau huruf mirip <code>îndodax.com</code>.</li>
					<li><b>Pola mencurigakan</b> seperti <code>metamask-wallet-restore.com</code>, dikenali oleh model yang berjalan di perangkat kamu.</li>
				</ul>
			</div>
			<ul class="examples" aria-label="Contoh alamat yang dikenali">
				<li><code>indodaz.com</code><span class="tag red">meniru Indodax</span></li>
				<li><code>tokocrpyto.com</code><span class="tag red">meniru Tokocrypto</span></li>
				<li><code>plntu.co.id</code><span class="tag red">meniru Pintu</span></li>
				<li><code>pancakesvvap.finance</code><span class="tag red">meniru PancakeSwap</span></li>
				<li><code>indodax.com</code><span class="tag green">resmi</span></li>
			</ul>
		</section>

		<section class="wrap split reverse">
			<div>
				<p class="eyebrow">Lapis 2</p>
				<h2>Transaksi berbahaya ditahan dulu, kamu yang memutuskan</h2>
				<p>Drainer jarang mencuri langsung. Mereka meminta izin atau tanda tangan yang terlihat biasa. Shield menahan permintaan ini dan menjelaskan akibatnya:</p>
				<ul class="checks">
					<li>Izin token <b>tanpa batas</b> (approve, increaseAllowance)</li>
					<li>Izin memindahkan <b>semua NFT</b> (setApprovalForAll)</li>
					<li>Tanda tangan <b>Permit dan Permit2</b> tanpa biaya gas</li>
					<li>Listing NFT yang membuat kamu <b>tidak menerima apa pun</b></li>
					<li>Tanda tangan mentah <b>eth_sign</b></li>
				</ul>
				<p class="muted">Klik <b>Tolak</b> dan dApp menerima penolakan biasa. Wallet kamu tidak pernah terbuka.</p>
			</div>
			<div class="mock danger" aria-label="Contoh peringatan transaksi">
				<h2>⚠️ Permintaan berbahaya</h2>
				<p>Situs ini meminta izin TANPA BATAS untuk memindahkan token kamu.</p>
				<ul>
					<li>Penerima izin: 0x7a2c…91fe</li>
					<li>Token/kontrak: USDT</li>
					<li>Jumlah: TANPA BATAS</li>
				</ul>
				<div class="todo">Tolak, kecuali kamu yakin ini situs resmi. Kalau perlu, izinkan sejumlah yang mau kamu pakai saja.</div>
				<div class="row"><span class="b-primary">Tolak</span><span class="b-ghost">Lanjutkan ke wallet</span></div>
			</div>
		</section>

		<section class="wrap privacy">
			<p class="eyebrow">Privasi</p>
			<h2>Semua berjalan di perangkat kamu</h2>
			<p>Shield tidak punya server dan tidak membuat permintaan jaringan. Riwayat browsing, alamat wallet, saldo, dan seed phrase kamu tidak pernah dikirim ke mana pun. Tidak perlu akun.</p>
			<NuxtLink to="/privacy">Baca kebijakan privasi →</NuxtLink>
		</section>

		<section class="wrap note">
			<h2>Batasan yang perlu kamu tahu</h2>
			<p>
				Shield <b>bukan jaminan keamanan</b>. Situs penipuan baru bisa belum dikenali, dan drainer yang sengaja menargetkan Shield bisa melewati penjaga transaksinya.
				Tetap simpan situs resmi di bookmark, cek ulang isi transaksi di wallet, dan jangan pernah memberikan seed phrase kepada siapa pun.
			</p>
		</section>

		<section id="faq" class="wrap faq">
			<h2>Pertanyaan umum</h2>
			<details v-for="q in faq" :key="q.q">
				<summary>{{ q.q }}</summary>
				<p>{{ q.a }}</p>
			</details>
		</section>
	</main>
</template>

<script setup>
const { cwsUrl } = useAppConfig();

useSeoMeta({
	title: "Aethereal Shield: lindungi aset kripto dari phishing",
	description: "Ekstensi browser yang memblokir situs phishing kripto dan menahan transaksi wallet berbahaya, dengan peringatan dalam Bahasa Indonesia. Berjalan di perangkat kamu.",
	ogTitle: "Aethereal Shield",
	ogDescription: "Blokir situs phishing kripto dan transaksi wallet berbahaya. Peringatan dalam Bahasa Indonesia.",
});

const faq = [
	{ q: "Wallet apa saja yang didukung?", a: "MetaMask, Rabby, OKX Wallet, dan wallet EVM lain di Chrome dan Brave. Dukungan Solana direncanakan untuk versi berikutnya." },
	{ q: "Apakah Shield bisa melihat seed phrase atau saldo saya?", a: "Tidak. Shield tidak membaca seed phrase, private key, saldo, atau alamat wallet kamu, dan tidak mengirim data apa pun keluar dari perangkat." },
	{ q: "Situs resmi saya ikut diblokir. Bagaimana?", a: "Klik \"Ini situs resmi? Laporkan kesalahan\" di halaman peringatan. Situs yang terbukti resmi kami masukkan ke daftar aman di pembaruan berikutnya." },
	{ q: "Kalau sudah pasang Shield, apakah saya pasti aman?", a: "Tidak ada alat yang menjamin itu. Shield mengurangi risiko dari situs palsu dan permintaan wallet yang paling sering dipakai penipu, tapi kamu tetap perlu teliti." },
	{ q: "Apakah perlu membuat akun?", a: "Tidak. Pasang ekstensinya dan Shield langsung bekerja." },
	{ q: "Bisa dipakai di HP atau Firefox?", a: "Belum. Saat ini Shield untuk Chrome dan Brave di desktop." },
];
</script>
