import { useTranslation } from "react-i18next"
import { LanguagesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setLocale } from "@/lib/i18n/config"
import {
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n/locales"

type LanguageSwitcherProps = {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const currentLocale = SUPPORTED_LOCALES.includes(i18n.language as SupportedLocale)
    ? (i18n.language as SupportedLocale)
    : "en"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className={className}
          aria-label={t("language.label")}
        >
          <LanguagesIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={currentLocale}
          onValueChange={(value) => {
            setLocale(value)
          }}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {LOCALE_CONFIG[locale].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
