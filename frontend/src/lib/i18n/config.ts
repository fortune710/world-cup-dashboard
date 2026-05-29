import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import {
  getLocaleConfig,
  isSupportedLocale,
  LOCALE_STORAGE_KEY,
} from "@/lib/i18n/locales"
import { ar } from "@/lib/i18n/resources/ar"
import { de } from "@/lib/i18n/resources/de"
import { en } from "@/lib/i18n/resources/en"
import { es } from "@/lib/i18n/resources/es"
import { fr } from "@/lib/i18n/resources/fr"
import { it } from "@/lib/i18n/resources/it"
import { ja } from "@/lib/i18n/resources/ja"
import { ko } from "@/lib/i18n/resources/ko"
import { nl } from "@/lib/i18n/resources/nl"
import { pt } from "@/lib/i18n/resources/pt"

function getInitialLocale(): string {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (isSupportedLocale(stored)) {
    return stored
  }

  return "en"
}

export function applyDocumentLocale(locale: string): void {
  const { lang, dir } = getLocaleConfig(locale)
  document.documentElement.lang = lang
  document.documentElement.dir = dir
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    es: { translation: es },
    pt: { translation: pt },
    fr: { translation: fr },
    de: { translation: de },
    ja: { translation: ja },
    ko: { translation: ko },
    it: { translation: it },
    nl: { translation: nl },
  },
  lng: getInitialLocale(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

applyDocumentLocale(i18n.language)

i18n.on("languageChanged", applyDocumentLocale)

export function setLocale(locale: string): void {
  if (!isSupportedLocale(locale)) {
    return
  }

  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  void i18n.changeLanguage(locale)
}

export { i18n }
