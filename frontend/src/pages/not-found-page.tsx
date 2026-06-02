import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("routes.notFound")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("pages.notFound.message")}
      </p>
      <Button asChild>
        <Link to="/">{t("pages.notFound.backToLive")}</Link>
      </Button>
    </div>
  )
}
