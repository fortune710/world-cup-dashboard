"use client"

import * as React from "react"

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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"

export { liveRushDemoMatches } from "@/lib/helpers/live-rush.helpers"

const LiveRushMatchGrid = React.memo(function LiveRushMatchGrid({
  matches,
}: LiveRushMatchGridProps) {
  const matchCount = Math.min(matches.length, WC26_MAX_MATCHES_PER_DAY)

  if (matches.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground lg:px-6">
        No matches in this view.
      </p>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 *:data-[slot=card]:shadow-xs",
        "@xl/main:grid-cols-12"
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
  dateLabel = "Saturday, 13 June 2026",
}: LiveRushProps) {
  const [activeTab, setActiveTab] = React.useState<LiveRushTab>("all")
  const counts = React.useMemo(() => countByStatus(matches), [matches])

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
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-4 shrink-0" />
          {dateLabel}
        </p>
      </div>

      <div className="flex flex-col px-4 lg:px-6">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col gap-4"
        >
          <Card className="@container/card">
            <CardHeader>
              <div className="flex flex-col gap-2">
                <CardTitle>Live Rush</CardTitle>
                <CardDescription>
                  <span className="hidden @[540px]/card:block">
                    Live matches for the day
                  </span>
                  <span className="@[540px]/card:hidden">
                    {tabTriggerLabel(
                      activeTab,
                      LIVE_RUSH_TABS.find((tab) => tab.value === activeTab)
                        ?.label ?? "All",
                      counts
                    )}
                  </span>
                </CardDescription>
              </div>
              <CardAction>
                <TabsList className="hidden max-w-full overflow-x-auto @[767px]/card:inline-flex">
                  {LIVE_RUSH_TABS.map(({ value, label }) => (
                    <TabsTrigger key={value} value={value}>
                      {tabTriggerLabel(value, label, counts)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Select value={activeTab} onValueChange={handleTabChange}>
                  <SelectTrigger
                    className="flex w-40 @[767px]/card:hidden"
                    size="sm"
                    aria-label="Select match filter"
                  >
                    <SelectValue placeholder="All matches" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {LIVE_RUSH_TABS.map(({ value, label }) => (
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
              </CardAction>
            </CardHeader>
            <CardContent>
              {LIVE_RUSH_TABS.map(({ value }) => (
                <TabsContent key={value} value={value} className="mt-2">
                  <LiveRushMatchGrid matches={tabMatches[value]} />
                </TabsContent>
              ))}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </section>
  )
})
