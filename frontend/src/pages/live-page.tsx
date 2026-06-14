import { useTranslation } from "react-i18next"

import { GroupStageStandings } from "@/components/chart-area-interactive"
import { PowerRankingTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import { LiveRush } from "@/components/live-rush"
import TopPerformers from "@/components/top-performers"
import { useMatches } from "@/hooks/use-matches"
import { Spinner } from "@/components/ui/spinner"

export function LivePage() {
  const { t } = useTranslation()
  const { matches, loading, error, dateLabel } = useMatches()

  return (
    <div className="flex flex-col gap-3 py-4 md:gap-4 md:py-5">
      <h1 className="sr-only">{t("routes.live")}</h1>
      {loading ? (
        <div className="flex items-center justify-center p-6 text-sm text-muted-foreground min-h-[200px]">
          <Spinner className="mr-2" /> {t("liveRush.loadingMatches", { defaultValue: "Loading matches..." })}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-6 text-sm text-destructive min-h-[200px]">
          {t("liveRush.loadFailed", { defaultValue: "Failed to load matches." })}
        </div>
      ) : (
        <LiveRush matches={matches} dateLabel={dateLabel} />
      )}
      <SectionCards />
      <div className="grid grid-cols-1 items-stretch gap-3 px-4 lg:grid-cols-3 lg:px-6">
        <div className="col-span-1 flex lg:col-span-2">
          <GroupStageStandings className="flex-1" />
        </div>
        <div className="col-span-1 flex">
          <TopPerformers className="flex-1" />
        </div>
      </div>
      <PowerRankingTable />
    </div>
  )
}
