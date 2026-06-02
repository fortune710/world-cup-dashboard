import { useTranslation } from "react-i18next"
import { LanguagesIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setLocale } from "@/lib/i18n/config"
import {
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n/locales"
import { cn } from "@/lib/utils"

type LanguageSwitcherProps = {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const currentLocale = SUPPORTED_LOCALES.includes(i18n.language as SupportedLocale)
    ? (i18n.language as SupportedLocale)
    : "en"

  return (
    <Select
      value={currentLocale}
      onValueChange={(value) => {
        setLocale(value)
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn("w-[10.5rem]", className)}
        aria-label={t("language.label")}
      >
        <LanguagesIcon className="size-4 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LOCALE_CONFIG[locale].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
