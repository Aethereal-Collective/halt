import { COPY, type Locale } from "~/utils/copy";

/** Landing copy for the active locale. */
export function useCopy() {
	const { locale } = useI18n();
	return computed(() => COPY[locale.value as Locale] ?? COPY.id);
}
