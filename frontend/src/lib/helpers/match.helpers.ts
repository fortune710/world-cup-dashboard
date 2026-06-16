import { logger } from "@/lib/logger"
import type { LiveRushMatch, MatchWinner } from "@/datatypes"

export type MatchApiRow = {
  id: number | string
  home_team?: { name?: string | null } | null
  away_team?: { name?: string | null } | null
  home_team_code?: string | null
  away_team_code?: string | null
  home_score?: number | null
  away_score?: number | null
  kickoff_utc?: string | null
  status?: string | null
  group?: string | null
}

export interface MatchDayGroup {
  dateKey: string
  matches: LiveRushMatch[]
}

function normalizeMatchStatus(status: string | null | undefined): LiveRushMatch["status"] {
  const value = String(status || "").toLowerCase()

  if (value === "ft" || value === "finished" || value === "ended" || value === "completed") {
    return "finished"
  }

  if (value === "live" || value === "ht" || value === "active" || value.includes("min")) {
    return "live"
  }

  return "upcoming"
}

function buildKickoffLabel(status: LiveRushMatch["status"], kickoffUtc: string | null | undefined): string {
  if (status === "finished") {
    return "FT"
  }

  if (status === "live") {
    return "Live"
  }

  if (!kickoffUtc) {
    return ""
  }

  const date = new Date(kickoffUtc)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function buildMatchesApiPath(matchDate: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ""
  return `/matches/${matchDate}${query}`
}

export function buildMatchesListApiPath(
  page: number,
  pageSize: number,
  status?: string
): string {
  const searchParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })

  if (status) {
    searchParams.set("status", status)
  }

  const path = `/matches?${searchParams.toString()}`
  logger.info({
    message: "Built matches list API path",
    path,
    page,
    page_size: pageSize,
    status: status ?? null,
  })
  return path
}

export function getCurrentLocalDate(
  date: Date = new Date(),
  timezoneOffsetMinutes?: number
): string {
  const offsetMinutes = timezoneOffsetMinutes ?? date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offsetMinutes * 60000)
  const currentLocalDate = localDate.toISOString().slice(0, 10)

  logger.info({
    message: "Resolved current local date",
    source_date: date.toISOString(),
    timezone_offset_minutes: offsetMinutes,
    local_date: currentLocalDate,
  })

  return currentLocalDate
}

export function getMatchLocalDateKey(
  kickoffUtc: string | null | undefined,
  timezoneOffsetMinutes?: number
): string | null {
  if (!kickoffUtc) {
    logger.warn({
      message: "Missing kickoff time while resolving match local date key",
      kickoff_utc: kickoffUtc ?? null,
    })
    return null
  }

  const kickoffDate = new Date(kickoffUtc)
  if (Number.isNaN(kickoffDate.getTime())) {
    logger.warn({
      message: "Invalid kickoff time while resolving match local date key",
      kickoff_utc: kickoffUtc,
    })
    return null
  }

  const offsetMinutes = timezoneOffsetMinutes ?? kickoffDate.getTimezoneOffset()
  const localDate = new Date(kickoffDate.getTime() - offsetMinutes * 60000)
  const dateKey = localDate.toISOString().slice(0, 10)

  logger.info({
    message: "Resolved match local date key",
    kickoff_utc: kickoffUtc,
    timezone_offset_minutes: offsetMinutes,
    date_key: dateKey,
  })

  return dateKey
}

export function groupMatchesByLocalDate(
  matches: LiveRushMatch[],
  timezoneOffsetMinutes?: number
): MatchDayGroup[] {
  logger.info({
    message: "Grouping matches by local date",
    match_count: matches.length,
  })

  const groupedMatches = new Map<string, LiveRushMatch[]>()

  matches.forEach((match) => {
    const dateKey = getMatchLocalDateKey(
      match.kickoffUtc,
      timezoneOffsetMinutes
    )

    if (!dateKey) {
      logger.warn({
        message: "Skipping match without a valid kickoff while grouping by date",
        match_id: match.id,
      })
      return
    }

    const existingMatches = groupedMatches.get(dateKey) ?? []
    groupedMatches.set(dateKey, [...existingMatches, match])
  })

  const grouped = Array.from(groupedMatches.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([dateKey, dateMatches]) => ({
      dateKey,
      matches: [...dateMatches].sort((left, right) =>
        (left.kickoffUtc ?? "").localeCompare(right.kickoffUtc ?? "")
      ),
    }))

  logger.info({
    message: "Grouped matches by local date",
    group_count: grouped.length,
    match_count: grouped.reduce(
      (total, group) => total + group.matches.length,
      0
    ),
  })

  return grouped
}

export function mapMatchApiRowsToLiveRushMatches(rows: MatchApiRow[]): LiveRushMatch[] {
  return rows.map((row) => {
    const status = normalizeMatchStatus(row.status)

    return {
      id: String(row.id),
      homeTeam: row.home_team?.name || row.home_team_code || "",
      awayTeam: row.away_team?.name || row.away_team_code || "",
      homeScore: row.home_score ?? 0,
      awayScore: row.away_score ?? 0,
      kickoffUtc: row.kickoff_utc ?? undefined,
      kickoffLabel: buildKickoffLabel(status, row.kickoff_utc),
      status,
      group: row.group || undefined,
    }
  })
}

export function getMatchWinner(
  homeScore: number,
  awayScore: number
): MatchWinner {
  if (homeScore > awayScore) {
    return "home"
  }

  if (homeScore < awayScore) {
    return "away"
  }

  return "draw"
}
