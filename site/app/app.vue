<template>
	<header class="nav wrap">
		<NuxtLink to="/" class="brand"><img src="~/assets/icon.png" alt="" width="28" height="28" />Aethereal Shield</NuxtLink>
		<nav>
			<NuxtLink to="/#cara-kerja">Cara kerja</NuxtLink>
			<NuxtLink to="/#faq">FAQ</NuxtLink>
		</nav>
	</header>
	<NuxtPage />
	<footer class="wrap foot">
		<p>Aethereal Shield adalah produk <a href="https://aethereal.top">Aethereal</a>, Jakarta.</p>
		<p>
			<NuxtLink to="/privacy">Kebijakan privasi</NuxtLink> ·
			<a :href="reportUrl" target="_blank" rel="noopener noreferrer">Laporkan situs</a>
		</p>
		<p class="muted">Daftar phishing dari MetaMask eth-phishing-detect dan Polkadot.js phishing (Apache-2.0). Model lokal juga dilatih dengan Phishing.Database (MIT) dan Majestic Million (CC BY 3.0).</p>
	</footer>
</template>

<script setup>
const { reportUrl } = useAppConfig();
</script>
