import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

/** Persists the UI language (read server-side by next-intl). Call router.refresh() afterwards. */
export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
