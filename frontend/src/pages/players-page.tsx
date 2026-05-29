import { useTranslation } from "react-i18next"

export function PlayersPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("routes.players")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("pages.players.description")}
      </p>
    </div>
  )
}
