import { useTranslation } from "react-i18next"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = ["light", "dark", "system"] as const

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === "dark") {
    return <MoonIcon />
  }

  if (theme === "system") {
    return <MonitorIcon />
  }

  return <SunIcon />
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("theme.label")}
        >
          <ThemeIcon theme={theme} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (THEME_OPTIONS.includes(value as (typeof THEME_OPTIONS)[number])) {
              setTheme(value as (typeof THEME_OPTIONS)[number])
            }
          }}
        >
          <DropdownMenuRadioItem value="light">
            <SunIcon className="size-4 opacity-70" />
            {t("theme.light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon className="size-4 opacity-70" />
            {t("theme.dark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon className="size-4 opacity-70" />
            {t("theme.system")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
