export const LOCALE_STORAGE_KEY = "locale"

export const SUPPORTED_LOCALES = [
  "en",
  "ar",
  "es",
  "pt",
  "fr",
  "de",
  "ja",
  "ko",
  "it",
  "nl",
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export interface LocaleConfig {
  lang: SupportedLocale
  dir: "ltr" | "rtl"
  ogLocale: string
  label: string
}

export const LOCALE_CONFIG: Record<SupportedLocale, LocaleConfig> = {
  en: {
    lang: "en",
    dir: "ltr",
    ogLocale: "en_US",
    label: "English",
  },
  ar: {
    lang: "ar",
    dir: "rtl",
    ogLocale: "ar_SA",
    label: "العربية",
  },
  es: {
    lang: "es",
    dir: "ltr",
    ogLocale: "es_ES",
    label: "Español",
  },
  pt: {
    lang: "pt",
    dir: "ltr",
    ogLocale: "pt_BR",
    label: "Português (BR)",
  },
  fr: {
    lang: "fr",
    dir: "ltr",
    ogLocale: "fr_FR",
    label: "Français",
  },
  de: {
    lang: "de",
    dir: "ltr",
    ogLocale: "de_DE",
    label: "Deutsch",
  },
  ja: {
    lang: "ja",
    dir: "ltr",
    ogLocale: "ja_JP",
    label: "日本語",
  },
  ko: {
    lang: "ko",
    dir: "ltr",
    ogLocale: "ko_KR",
    label: "한국어",
  },
  it: {
    lang: "it",
    dir: "ltr",
    ogLocale: "it_IT",
    label: "Italiano",
  },
  nl: {
    lang: "nl",
    dir: "ltr",
    ogLocale: "nl_NL",
    label: "Nederlands",
  },
}

export function isSupportedLocale(value: string | null): value is SupportedLocale {
  if (value === null) {
    return false
  }

  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

export function getLocaleConfig(locale: string): LocaleConfig {
  if (isSupportedLocale(locale)) {
    return LOCALE_CONFIG[locale]
  }

  return LOCALE_CONFIG.en
}
