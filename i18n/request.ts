import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

// Locale lives in a cookie (no /en or /hi URL prefixes), falling back to the browser's language.
export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const accept = (await headers()).get("accept-language") ?? "";
  const locale = isLocale(fromCookie) ? fromCookie : accept.toLowerCase().startsWith("hi") ? "hi" : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Asia/Kolkata",
  };
});
