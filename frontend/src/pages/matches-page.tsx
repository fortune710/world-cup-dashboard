import * as React from "react"
import { useTranslation } from "react-i18next"
import { CalendarDaysIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { LiveRushMatchGrid } from "@/components/live-rush"
import { Spinner } from "@/components/ui/spinner"
import { logger } from "@/lib/logger"
import { useMatchesList } from "@/hooks/use-matches-list"

export function MatchesPage() {
  const { t } = useTranslation()
  const { groups, loading, error, hasData } = useMatchesList()

  React.useEffect(() => {
    logger.info({
      message: "Matches page rendered",
      loading,
      has_error: Boolean(error),
      has_data: hasData,
      group_count: groups.length,
    })
  }, [error, groups.length, hasData, loading])

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("routes.matches")}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("pages.matches.description")}
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-foreground/10 bg-card/70 p-6 text-sm text-muted-foreground">
          <Spinner className="mr-2" />
          {t("matches.loading", { defaultValue: "Loading matches..." })}
        </div>
      ) : error && !hasData ? (
        <div className="rounded-3xl border border-foreground/10 bg-card/70 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-foreground/10 bg-card/70 p-6 text-sm text-muted-foreground">
          {t("matches.empty", { defaultValue: "No matches available." })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const dateLabel = new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(`${group.dateKey}T00:00:00`))

            return (
              <section
                key={group.dateKey}
                className="rounded-3xl py-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="size-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">{dateLabel}</h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
                    {group.matches.length}
                  </Badge>
                </div>

                <LiveRushMatchGrid matches={group.matches} />
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
