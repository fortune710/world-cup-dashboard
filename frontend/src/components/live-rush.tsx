"use client"

import { LiveRushMatchCard } from "@/components/live-rush-match-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getLiveRushColSpanClass,
  WC26_MAX_MATCHES_PER_DAY,
  type LiveRushMatch,
  type LiveRushMatchStatus,
} from "@/lib/live-rush-layout"
import { cn } from "@/lib/utils"
import { CalendarDaysIcon } from "lucide-react"

/** Demo slate: typical 4-match group day (FIFA 13–17 Jun pattern). */
export const liveRushDemoMatches: LiveRushMatch[] = [
  {
    id: "wc26-041",
    homeTeam: "Brazil",
    awayTeam: "Morocco",
    homeScore: 2,
    awayScore: 1,
    kickoffLabel: "FT",
    status: "finished",
    group: "C",
  },
  {
    id: "wc26-042",
    homeTeam: "Qatar",
    awayTeam: "Switzerland",
    homeScore: 1,
    awayScore: 1,
    kickoffLabel: "67'",
    status: "live",
    group: "B",
  },
  {
    id: "wc26-043",
    homeTeam: "Haiti",
    awayTeam: "Scotland",
    homeScore: 0,
    awayScore: 0,
    kickoffLabel: "23'",
    status: "live",
    group: "C",
  },
  {
    id: "wc26-044",
    homeTeam: "Australia",
    awayTeam: "Türkiye",
    kickoffLabel: "21:00",
    status: "upcoming",
    group: "D",
  },
]

type LiveRushTab = "all" | LiveRushMatchStatus

const LIVE_RUSH_TABS: { value: LiveRushTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "finished", label: "Finished" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
]

function countByStatus(matches: LiveRushMatch[]) {
  let finished = 0
  let live = 0
  let upcoming = 0
  for (const match of matches) {
    if (match.status === "finished") finished += 1
    else if (match.status === "live") live += 1
    else upcoming += 1
  }
  return { finished, live, upcoming }
}

function filterMatchesByTab(matches: LiveRushMatch[], tab: LiveRushTab) {
  const slate = matches.slice(0, WC26_MAX_MATCHES_PER_DAY)
  if (tab === "all") return slate
  return slate.filter((match) => match.status === tab)
}

function tabTriggerLabel(
  tab: LiveRushTab,
  label: string,
  counts: ReturnType<typeof countByStatus>
) {
  if (tab === "all") return label
  const count =
    tab === "finished" ? counts.finished : tab === "live" ? counts.live : counts.upcoming
  return count > 0 ? `${label} (${count})` : label
}

function LiveRushMatchGrid({ matches }: { matches: LiveRushMatch[] }) {
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
}

interface LiveRushProps {
  matches?: LiveRushMatch[]
  /** ISO date label for the slate header */
  dateLabel?: string
}

export function LiveRush({
  matches = liveRushDemoMatches,
  dateLabel = "Saturday, 13 June 2026",
}: LiveRushProps) {
  const counts = countByStatus(matches)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-4 shrink-0" />
          {dateLabel}
        </p>
      </div>

      <Tabs defaultValue="all" className="gap-4 px-4 lg:px-6">
        <TabsList>
          {LIVE_RUSH_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {tabTriggerLabel(value, label, counts)}
            </TabsTrigger>
          ))}
        </TabsList>

        {LIVE_RUSH_TABS.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-2">
            <LiveRushMatchGrid matches={filterMatchesByTab(matches, value)} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
