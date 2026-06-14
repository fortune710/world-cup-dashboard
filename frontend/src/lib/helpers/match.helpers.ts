import type { LiveRushMatch, MatchWinner } from "@/datatypes"

type MatchApiRow = {
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

export function mapMatchApiRowsToLiveRushMatches(rows: MatchApiRow[]): LiveRushMatch[] {
  return rows.map((row) => {
    const status = normalizeMatchStatus(row.status)

    return {
      id: String(row.id),
      homeTeam: row.home_team?.name || row.home_team_code || "",
      awayTeam: row.away_team?.name || row.away_team_code || "",
      homeScore: row.home_score ?? 0,
      awayScore: row.away_score ?? 0,
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
