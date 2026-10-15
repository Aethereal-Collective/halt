// v-reveal: fade/slide an element in the first time it scrolls into view.
// Hidden state only applies under html.js (set by an inline head script), so the page reads fine without JS.
export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.directive<HTMLElement, number | undefined>("reveal", {
		getSSRProps: () => ({ "data-reveal": "" }),
		mounted(el, { value: delay = 0 }) {
			el.setAttribute("data-reveal", "");
			el.style.transitionDelay = `${delay}ms`;
			const io = new IntersectionObserver(
				([entry]) => {
					if (!entry?.isIntersecting) return;
					el.classList.add("is-visible");
					io.disconnect();
				},
				{ rootMargin: "0px 0px -10% 0px" },
			);
			io.observe(el);
		},
	});
});
