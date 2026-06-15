import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const LOCALES = [
  "en", "es", "pt", "fr", "de", "it", "nl", "pl",
  "sv", "da", "fi", "cs", "ro", "el", "tr", "ru",
  "ar", "he", "ja", "ko", "zh",
];

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const raw = (cookieStore as any).get?.("locale")?.value ?? "es";
  const locale = LOCALES.includes(raw) ? raw : "es";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
