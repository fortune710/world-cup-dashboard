"use client"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUpRight, Percent, Star, Target } from "lucide-react"

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { logger } from "@/lib/logger"
import {
  formatMatchdayStatisticValue,
  type MatchdayStatisticsCardKey,
} from "@/lib/helpers/matchday-statistics.helpers"
import { useMatchdayStatistics } from "@/hooks/use-matchday-statistics"

type SectionCardConfig = {
  statKey: MatchdayStatisticsCardKey
  titleKey: string
  trendKey: string
  footnoteKey: string
  Icon: typeof Star
}

const SECTION_CARD_CONFIGS: SectionCardConfig[] = [
  {
    statKey: "rating",
    titleKey: "sectionCards.goalsToday",
    trendKey: "sectionCards.goalsTodayTrend",
    footnoteKey: "sectionCards.goalsTodayFootnote",
    Icon: Star,
  },
  {
    statKey: "goalContributions",
    titleKey: "sectionCards.topXgToday",
    trendKey: "sectionCards.topXgTrend",
    footnoteKey: "sectionCards.topXgFootnote",
    Icon: Target,
  },
  {
    statKey: "passAccuracy",
    titleKey: "sectionCards.cardsToday",
    trendKey: "sectionCards.cardsTrend",
    footnoteKey: "sectionCards.cardsFootnote",
    Icon: Percent,
  },
]

function SectionCardSkeleton() {
  logger.info({
    message: "Rendering section card skeleton",
  })

  return (
    <Card className="@container/card">
      <CardHeader className="gap-3">
        <CardDescription className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <Skeleton className="h-9 w-20" />
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function SectionCards() {
  const { t } = useTranslation()
  const { cards, loading, error } = useMatchdayStatistics()

  useEffect(() => {
    logger.info({
      message: "Section cards state updated",
      loading,
      has_error: Boolean(error),
      has_data: !loading && !error,
    })
  }, [loading, error, cards])

  return (
    <div className="grid grid-cols-1 gap-3 px-4 @xl/main:grid-cols-3 @xl/main:gap-3 lg:px-6">
      {loading
        ? SECTION_CARD_CONFIGS.map(({ statKey }) => (
            <SectionCardSkeleton key={statKey} />
          ))
        : SECTION_CARD_CONFIGS.map(
            ({ statKey, titleKey, trendKey, footnoteKey, Icon }) => {
              const stat = cards[statKey]

              return (
                <Card key={statKey} className="@container/card">
                  <CardHeader className="gap-3">
                    <CardDescription className="flex items-center gap-2">
                      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                      <span>{t(titleKey)}</span>
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {formatMatchdayStatisticValue(stat.statName, stat.value)}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                      <span>{t(footnoteKey, { playerName: stat.playerName })}</span>
                    </div>
                    <div className="text-muted-foreground">{t(trendKey)}</div>
                  </CardFooter>
                </Card>
              )
            }
          )}
    </div>
  )
}
