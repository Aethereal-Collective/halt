<template>
	<SiteHeader />
	<!-- White page on top; on desktop the bottom margin reveals the fixed footer underneath. -->
	<div id="top" class="relative z-10 bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] lg:mb-[720px]">
		<NuxtPage />
	</div>
	<SiteFooter />
</template>
