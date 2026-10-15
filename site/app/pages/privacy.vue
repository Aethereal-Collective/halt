<template>
	<main class="wrap prose" v-html="html" />
</template>

<script setup>
// Single source of truth: the policy lives in docs/privacy-policy.md and is rendered at build time.
import { marked } from "marked";
import policy from "../../../docs/privacy-policy.md?raw";

const html = marked.parse(policy.replace(/<!--[\s\S]*?-->/g, ""));
useSeoMeta({ title: "Kebijakan Privasi · Aethereal Shield", description: "Aethereal Shield tidak mengirim data apa pun keluar dari perangkat kamu." });
</script>
