import type {
  LiveRushMatch,
  LiveRushStatusCounts,
  LiveRushTab,
  LiveRushTabOption,
} from "@/datatypes"
import { WC26_MAX_MATCHES_PER_DAY } from "@/lib/live-rush-layout"

export const LIVE_RUSH_TABS: LiveRushTabOption[] = [
  { value: "all", label: "All" },
  { value: "finished", label: "Finished" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
]

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

export function countByStatus(matches: LiveRushMatch[]): LiveRushStatusCounts {
  let finished = 0
  let live = 0
  let upcoming = 0

  for (const match of matches) {
    if (match.status === "finished") {
      finished += 1
    } else if (match.status === "live") {
      live += 1
    } else {
      upcoming += 1
    }
  }

  return { finished, live, upcoming }
}

export function filterMatchesByTab(
  matches: LiveRushMatch[],
  tab: LiveRushTab
): LiveRushMatch[] {
  const slate = matches.slice(0, WC26_MAX_MATCHES_PER_DAY)

  if (tab === "all") {
    return slate
  }

  return slate.filter((match) => match.status === tab)
}

export function tabTriggerLabel(
  tab: LiveRushTab,
  label: string,
  counts?: LiveRushStatusCounts
): string {
  if (tab === "all") {
    return label
  }

  const count =
    tab === "finished"
      ? (counts?.finished ?? 0)
      : tab === "live"
        ? (counts?.live ?? 0)
        : (counts?.upcoming ?? 0)

  return count > 0 ? `${label} (${count})` : label
}

export function getLiveRushFooterMessage(
  status: LiveRushMatch["status"]
): string {
  if (status === "finished") {
    return "Full time — rush locked"
  }

  if (status === "live") {
    return "In play — goals count now"
  }

  return "Kickoff pending — picks open"
}
