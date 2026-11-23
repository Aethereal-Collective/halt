<template>
	<main id="main-content" class="bg-ink pt-28 pb-24 text-white">
		<article class="mx-auto max-w-[760px] px-4">
			<nav class="mb-6 text-sm text-white/50" aria-label="Breadcrumb">
				<NuxtLink :to="localePath('/')" class="hover:text-white">Halt</NuxtLink>
				<span class="mx-2" aria-hidden="true">/</span>
				<span class="text-white/80" aria-current="page">{{ g.crumb }}</span>
			</nav>

			<h1 class="text-[clamp(34px,4vw,52px)] font-bold leading-[1.12] tracking-[-0.04em]">{{ g.h1 }}</h1>
			<p class="mt-5 text-[18px] leading-[1.7] text-white/75">{{ g.intro }}</p>

			<section v-for="sec in g.sections" :key="sec.heading" class="mt-12">
				<h2 class="text-[26px] font-bold tracking-[-0.03em]">{{ sec.heading }}</h2>
				<p v-for="(p, i) in sec.paragraphs" :key="i" class="mt-3 text-[16px] leading-[1.75] text-white/80">{{ p }}</p>
			</section>

			<section class="mt-14 border-t border-white/15 pt-10">
				<h2 class="text-[26px] font-bold tracking-[-0.03em]">{{ g.faqTitle }}</h2>
				<div class="mt-6 divide-y divide-white/15 border-y border-white/15">
					<div v-for="item in g.faq" :key="item.q" class="py-5">
						<h3 class="text-[18px] font-semibold">{{ item.q }}</h3>
						<p class="mt-2 leading-[1.7] text-white/75">{{ item.a }}</p>
					</div>
				</div>
			</section>

			<div class="mt-14 rounded-2xl border border-white/15 bg-white/[0.04] p-7">
				<h2 class="text-[22px] font-bold tracking-[-0.03em]">{{ g.ctaTitle }}</h2>
				<p class="mt-2 text-white/75">{{ g.ctaBody }}</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<InstallButton tone="light" />
					<NuxtLink :to="localePath('/')" class="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
						{{ g.back }}
					</NuxtLink>
				</div>
			</div>
		</article>
	</main>
</template>

<script setup lang="ts">
const { locale } = useI18n();
const localePath = useLocalePath();

const GUIDE = {
	id: {
		crumb: "Panduan Anti-Phishing",
		seoTitle: "Cara Mencegah Phishing Kripto & Wallet Drainer (MetaMask, Permit2) | Halt",
		seoDesc: "Panduan lengkap mengenali situs phishing kripto, modus wallet drainer (unlimited approve, Permit2, eth_sign, Seaport), dan cara melindungi aset di MetaMask, Rabby, dan OKX Wallet.",
		h1: "Cara Mencegah Phishing Kripto & Wallet Drainer di Browser",
		intro: "Sebagian besar kehilangan aset kripto di Indonesia bukan karena jaringan blockchain diretas, melainkan karena situs tiruan (phishing) dan tanda tangan wallet drainer yang terlihat seperti klaim airdrop biasa.",
		sections: [
			{
				heading: "1. Domain tiruan (Typosquatting & Punycode)",
				paragraphs: [
					"Penipu sering menyebarkan tautan promo exchange atau airdrop di grup WhatsApp, Telegram, dan iklan pencarian dengan alamat yang berbeda satu huruf (misalnya indodaz.com atau huruf mirip Unicode/Punycode).",
					"Selalu buka exchange dan dApp dari bookmark pribadi. Ekstensi anti-phishing seperti Halt mencocokkan setiap domain yang kamu buka terhadap 160.000+ daftar phishing dan model deteksi lokal secara otomatis.",
				],
			},
			{
				heading: "2. Izin token tanpa batas (Unlimited ERC-20 Approve & setApprovalForAll)",
				paragraphs: [
					"Wallet drainer jarang meminta transfer langsung. Mereka meminta transaksi approve() dengan batas jumlah tak terbatas (MAX_UINT256) atau setApprovalForAll(true) untuk seluruh koleksi NFT kamu.",
					"Setelah disetujui, kontrak penipu bisa menarik seluruh saldo token kapan saja tanpa konfirmasi ulang. Biasakan membatasi jumlah izin sesuai transaksi yang dibutuhkan dan mencabut izin lama secara berkala.",
				],
			},
			{
				heading: "3. Tanda tangan tanpa gas (Permit, Permit2, Seaport & eth_sign)",
				paragraphs: [
					"Modus paling populer saat ini memakai tanda tangan off-chain (tanpa biaya gas) seperti EIP-2612 Permit, Uniswap Permit2, order Seaport seharga nol, dan eth_sign.",
					"Karena tidak memotong biaya gas, banyak pengguna mengira tanda tangan tersebut hanya untuk login atau verifikasi airdrop — padahal isinya memberi izin pemindahan aset. Halt menahan permintaan seperti ini sebelum jendela MetaMask/Rabby muncul dan menjelaskan risikonya dalam Bahasa Indonesia.",
				],
			},
			{
				heading: "4. Langkah perlindungan praktis untuk pengguna MetaMask, Rabby & OKX",
				paragraphs: [
					"Pisahkan wallet harian (burner wallet) untuk mencoba dApp baru dari wallet penyimpanan utama. Jangan pernah memasukkan seed phrase di situs web mana pun, dan pasang ekstensi keamanan lokal yang tidak mengirim riwayat browsing kamu ke server pihak ketiga.",
				],
			},
		],
		faqTitle: "Pertanyaan yang Sering Ditanyakan",
		faq: [
			{ q: "Apa itu wallet drainer kripto?", a: "Wallet drainer adalah skrip jahat pada situs phishing yang memancing pengguna menandatangani transaksi approve tanpa batas, Permit/Permit2, atau eth_sign untuk menguras token dan NFT dari wallet EVM." },
			{ q: "Bagaimana cara cek apakah situs kripto aman atau phishing?", a: "Periksa ejaan domain huruf per huruf, hindari klik dari iklan pencarian atau DM Telegram, dan gunakan ekstensi anti-phishing lokal seperti Halt yang memeriksa 160K+ domain phishing secara otomatis di Chrome dan Brave." },
			{ q: "Apakah tanda tangan tanpa gas (Permit2) bisa menguras wallet?", a: "Bisa. Tanda tangan EIP-2612 Permit dan Permit2 memberi izin pengeluaran token secara off-chain yang kemudian dieksekusi oleh penyerang di on-chain." },
		],
		ctaTitle: "Lindungi MetaMask & Rabby kamu secara otomatis",
		ctaBody: "Halt gratis, berjalan 100% di perangkat kamu tanpa pelacakan, dan memblokir situs phishing maupun transaksi drainer sebelum kamu tanda tangan.",
		back: "Kembali ke Beranda",
	},
	en: {
		crumb: "Anti-Phishing Guide",
		seoTitle: "How to Stop Crypto Phishing & Wallet Drainers (MetaMask, Permit2) | Halt",
		seoDesc: "Learn how crypto phishing sites and wallet drainers work — unlimited ERC-20 approvals, Permit2, Seaport zero-price listings, and eth_sign — and how to protect MetaMask, Rabby, and OKX Wallet.",
		h1: "How to Stop Crypto Phishing & Wallet Drainers in Your Browser",
		intro: "Most crypto thefts do not come from broken blockchains. They happen when lookalike phishing sites trick wallet users into signing drainer payloads that look like routine airdrop claims or wallet verifications.",
		sections: [
			{
				heading: "1. Lookalike domains (Typosquatting & Punycode)",
				paragraphs: [
					"Attackers buy search ads or share fake links in Telegram and Discord using domains that differ by a single character or lookalike Unicode characters (IDN homographs).",
					"Always bookmark official exchanges and dApps. Local anti-phishing extensions like Halt check every domain against 160,000+ known phishing domains and an on-device lookalike detector before the page can connect to your wallet.",
				],
			},
			{
				heading: "2. Unlimited token approvals (approve & setApprovalForAll)",
				paragraphs: [
					"Modern wallet drainers rarely ask for a plain transfer. Instead, they request an unlimited ERC-20 approve() or setApprovalForAll(true) for an entire NFT collection.",
					"Once signed, the attacker's contract can sweep your tokens at any time without asking again. Only approve exact amounts and revoke stale allowances regularly.",
				],
			},
			{
				heading: "3. Gasless signatures (Permit, Permit2, Seaport & eth_sign)",
				paragraphs: [
					"Gasless off-chain signatures — including EIP-2612 Permit, Uniswap Permit2, zero-consideration Seaport orders, and legacy eth_sign — are widely abused because users assume a free signature is just a login prompt.",
					"Halt intercepts these high-risk wallet requests before MetaMask, Rabby, or OKX Wallet prompts you and explains what the signature actually authorizes in plain language.",
				],
			},
			{
				heading: "4. Practical defense for Chrome and Brave users",
				paragraphs: [
					"Use a separate burner wallet for new dApps and mints, never enter your seed phrase on any website, and run a local-first security extension that inspects domains and transactions on your device with zero telemetry.",
				],
			},
		],
		faqTitle: "Frequently Asked Questions",
		faq: [
			{ q: "What is a crypto wallet drainer?", a: "A wallet drainer is malicious code on a phishing site that tricks users into signing unlimited token approvals, Permit/Permit2 signatures, zero-price NFT listings, or eth_sign messages to steal assets." },
			{ q: "Can a gasless signature like Permit2 drain my MetaMask wallet?", a: "Yes. EIP-2612 Permit and Permit2 signatures grant token spending permissions off-chain, which an attacker can submit on-chain to transfer your tokens." },
			{ q: "How does Halt protect against crypto phishing without tracking me?", a: "Halt runs its 160K+ phishing blocklist, lookalike detector, and transaction guard entirely inside your browser on Chrome and Brave, sending no browsing history or wallet data to any server." },
		],
		ctaTitle: "Protect MetaMask, Rabby & OKX Wallet automatically",
		ctaBody: "Halt is free, runs 100% locally with zero tracking, and stops phishing domains and wallet drainers before you sign.",
		back: "Back to Home",
	},
} as const;

const g = computed(() => (locale.value === "en" ? GUIDE.en : GUIDE.id));
const pageUrl = computed(() => (locale.value === "en" ? "https://halt.aethereal.top/en/guide" : "https://halt.aethereal.top/guide"));

useSeoMeta({
	title: () => g.value.seoTitle,
	description: () => g.value.seoDesc,
	ogTitle: () => g.value.seoTitle,
	ogDescription: () => g.value.seoDesc,
	ogType: "article",
	ogUrl: pageUrl,
});

useHead(() => ({
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify([
				{
					"@context": "https://schema.org",
					"@type": "Article",
					headline: g.value.h1,
					description: g.value.seoDesc,
					inLanguage: locale.value,
					url: pageUrl.value,
					author: { "@type": "Organization", name: "Aethereal", url: "https://aethereal.top" },
					publisher: { "@type": "Organization", name: "Aethereal", url: "https://aethereal.top" },
				},
				{
					"@context": "https://schema.org",
					"@type": "FAQPage",
					inLanguage: locale.value,
					mainEntity: g.value.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
				},
				{
					"@context": "https://schema.org",
					"@type": "BreadcrumbList",
					itemListElement: [
						{ "@type": "ListItem", position: 1, name: "Halt", item: locale.value === "en" ? "https://halt.aethereal.top/en" : "https://halt.aethereal.top/" },
						{ "@type": "ListItem", position: 2, name: g.value.crumb, item: pageUrl.value },
					],
				},
			]),
		},
	],
}));
</script>
