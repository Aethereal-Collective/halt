<template>
	<main class="bg-ink pt-28 pb-24 text-white">
		<!-- eslint-disable-next-line vue/no-v-html -- our own markdown, rendered at build time -->
		<article class="policy mx-auto max-w-[760px] px-4" v-html="html" />
	</main>
</template>

<script setup lang="ts">
// Single source of truth: the policy lives in docs/privacy-policy.md and is rendered at build time.
import { marked } from "marked";
import policyId from "../../../docs/privacy-policy.md?raw";
import policyEn from "../../../docs/privacy-policy.en.md?raw";

const c = useCopy();
const { locale } = useI18n();
const html = computed(() => marked.parse((locale.value === "en" ? policyEn : policyId).replace(/<!--[\s\S]*?-->/g, "")) as string);
useSeoMeta({ title: () => c.value.seo.privacyTitle, description: () => c.value.seo.privacyDescription });
</script>

<style scoped>
.policy :deep(h1) { font-size: clamp(34px, 4vw, 52px); line-height: 1.15; margin-bottom: 24px; }
.policy :deep(h2) { font-size: 26px; margin: 40px 0 12px; }
.policy :deep(p), .policy :deep(li) { color: rgb(255 255 255 / 0.8); line-height: 1.7; }
.policy :deep(p) { margin-bottom: 14px; }
.policy :deep(ul) { list-style: disc; padding-left: 22px; margin-bottom: 14px; }
.policy :deep(strong) { color: #fff; }
.policy :deep(code) { background: rgb(255 255 255 / 0.1); padding: 1px 6px; border-radius: 6px; font-size: 0.9em; }
.policy :deep(table) { display: block; overflow-x: auto; width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 15px; }
.policy :deep(th), .policy :deep(td) { text-align: left; padding: 10px; border-bottom: 1px solid rgb(255 255 255 / 0.15); vertical-align: top; }
</style>
