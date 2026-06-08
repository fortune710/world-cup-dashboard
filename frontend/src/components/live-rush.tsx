"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"

import { LiveRushMatchCard } from "@/components/live-rush-match-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LiveRushTab } from "@/datatypes"
import type { LiveRushMatchGridProps, LiveRushProps } from "@/datatypes"
import {
  getLiveRushColSpanClass,
  WC26_MAX_MATCHES_PER_DAY,
} from "@/lib/live-rush-layout"
import {
  countByStatus,
  filterMatchesByTab,
  LIVE_RUSH_TABS,
  liveRushDemoMatches,
  tabTriggerLabel,
} from "@/lib/helpers/live-rush.helpers"
import { cn } from "@/lib/utils"
import { CalendarDaysIcon } from "lucide-react"

export { liveRushDemoMatches } from "@/lib/helpers/live-rush.helpers"

const LIVE_RUSH_TAB_I18N: Record<LiveRushTab, string> = {
  all: "liveRush.tabs.all",
  finished: "liveRush.tabs.finished",
  live: "liveRush.tabs.live",
  upcoming: "liveRush.tabs.upcoming",
}

const LiveRushMatchGrid = React.memo(function LiveRushMatchGrid({
  matches,
}: LiveRushMatchGridProps) {
  const { t } = useTranslation()
  const matchCount = Math.min(matches.length, WC26_MAX_MATCHES_PER_DAY)

  if (matches.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        {t("liveRush.noMatches")}
      </p>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2",
        "@xl/main:grid-cols-12 @xl/main:gap-2"
      )}
    >
      {matches.map((match, index) => (
        <LiveRushMatchCard
          key={match.id}
          match={match}
          className={getLiveRushColSpanClass(matchCount, index)}
        />
      ))}
    </div>
  )
})

export const LiveRush = React.memo(function LiveRush({
  matches = liveRushDemoMatches,
  dateLabel,
}: LiveRushProps) {
  const { t } = useTranslation()
  const resolvedDateLabel = dateLabel ?? t("liveRush.demoDate")
  const [activeTab, setActiveTab] = React.useState<LiveRushTab>("all")
  const counts = React.useMemo(() => countByStatus(matches), [matches])

  const rushTabs = React.useMemo(
    () =>
      LIVE_RUSH_TABS.map(({ value }) => ({
        value,
        label: t(LIVE_RUSH_TAB_I18N[value]),
      })),
    [t]
  )

  const tabMatches = React.useMemo(
    () =>
      Object.fromEntries(
        LIVE_RUSH_TABS.map(({ value }) => [
          value,
          filterMatchesByTab(matches, value),
        ])
      ),
    [matches]
  )

  const handleTabChange = React.useCallback((value: string) => {
    setActiveTab(value as LiveRushTab)
  }, [])

  return (
    <section className="flex flex-col gap-4 px-4 lg:px-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{t("liveRush.title")}</h2>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDaysIcon className="size-3.5 shrink-0" />
              {resolvedDateLabel}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TabsList className="hidden max-w-full overflow-x-auto sm:inline-flex">
              {rushTabs.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {tabTriggerLabel(value, label)}
                </TabsTrigger>
              ))}
            </TabsList>
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger
                className="flex w-40 sm:hidden"
                size="sm"
                aria-label={t("common.selectMatchFilter")}
              >
                <SelectValue placeholder={t("common.allMatches")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {rushTabs.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="rounded-lg"
                  >
                    {tabTriggerLabel(value, label, counts)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {LIVE_RUSH_TABS.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-0">
            <LiveRushMatchGrid matches={tabMatches[value]} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
})
