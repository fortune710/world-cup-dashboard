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

const UTC_TIMESTAMP_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i

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

function parseKickoffUtc(
  kickoffUtc: string | null | undefined
): Date | null {
  if (!kickoffUtc) {
    logger.warn({
      message: "Missing kickoff time while parsing kickoff timestamp",
      kickoff_utc: kickoffUtc ?? null,
    })
    return null
  }

  const normalizedKickoffUtc = UTC_TIMESTAMP_PATTERN.test(kickoffUtc)
    ? kickoffUtc
    : `${kickoffUtc}Z`
  const kickoffDate = new Date(normalizedKickoffUtc)

  if (Number.isNaN(kickoffDate.getTime())) {
    logger.warn({
      message: "Invalid kickoff time while parsing kickoff timestamp",
      kickoff_utc: kickoffUtc,
      normalized_kickoff_utc: normalizedKickoffUtc,
    })
    return null
  }

  logger.info({
    message: "Parsed kickoff timestamp",
    kickoff_utc: kickoffUtc,
    normalized_kickoff_utc: normalizedKickoffUtc,
  })

  return kickoffDate
}

function resolveMatchTimeZone(timeZone?: string): string {
  const resolvedTimeZone =
    timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"

  logger.info({
    message: "Resolved match time zone",
    time_zone: resolvedTimeZone,
  })

  return resolvedTimeZone
}

function formatLocalDateKey(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    logger.warn({
      message: "Failed to format local date key from kickoff timestamp",
      time_zone: timeZone,
    })
    return date.toISOString().slice(0, 10)
  }

  const dateKey = `${year}-${month}-${day}`

  logger.info({
    message: "Formatted local date key",
    time_zone: timeZone,
    date_key: dateKey,
  })

  return dateKey
}

function buildKickoffLabel(
  status: LiveRushMatch["status"],
  kickoffUtc: string | null | undefined,
  timeZone?: string
): string {
  if (status === "finished") {
    return "FT"
  }

  if (status === "live") {
    return "Live"
  }

  const kickoffDate = parseKickoffUtc(kickoffUtc)
  if (!kickoffDate) {
    return ""
  }

  const resolvedTimeZone = resolveMatchTimeZone(timeZone)
  const kickoffLabel = kickoffDate.toLocaleTimeString([], {
    timeZone: resolvedTimeZone,
    hour: "2-digit",
    minute: "2-digit",
  })

  logger.info({
    message: "Built kickoff label",
    kickoff_utc: kickoffUtc ?? null,
    time_zone: resolvedTimeZone,
    kickoff_label: kickoffLabel,
  })

  return kickoffLabel
}

export function buildMatchesApiPath(matchDate: string, status?: string, timezone?: string) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (timezone) params.set("timezone", timezone)
  const query = params.size > 0 ? `?${params.toString()}` : ""
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
  timeZoneOrOffset?: string | number
): string | null {
  const kickoffDate = parseKickoffUtc(kickoffUtc)
  if (!kickoffDate) {
    return null
  }

  if (typeof timeZoneOrOffset === "number") {
    const localDate = new Date(
      kickoffDate.getTime() - timeZoneOrOffset * 60000
    )
    const dateKey = localDate.toISOString().slice(0, 10)

    logger.info({
      message: "Resolved match local date key from timezone offset",
      kickoff_utc: kickoffUtc,
      timezone_offset_minutes: timeZoneOrOffset,
      date_key: dateKey,
    })

    return dateKey
  }

  const resolvedTimeZone = resolveMatchTimeZone(timeZoneOrOffset)
  const dateKey = formatLocalDateKey(kickoffDate, resolvedTimeZone)

  logger.info({
    message: "Resolved match local date key",
    kickoff_utc: kickoffUtc,
    time_zone: resolvedTimeZone,
    date_key: dateKey,
  })

  return dateKey
}

export function groupMatchesByLocalDate(
  matches: LiveRushMatch[],
  timeZoneOrOffset?: string | number
): MatchDayGroup[] {
  logger.info({
    message: "Grouping matches by local date",
    match_count: matches.length,
  })

  const groupedMatches = new Map<string, LiveRushMatch[]>()

  matches.forEach((match) => {
    const dateKey = getMatchLocalDateKey(
      match.kickoffUtc,
      timeZoneOrOffset
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
