import type { FormResult } from "@/datatypes"
import { getAdjustedElo, powerRankingRows } from "@/lib/helpers/power-ranking.helpers"

export interface FifaRankingTeamName {
  Description: string
  Locale: string
}

export interface FifaRankingResult {
  ConfederationName: string | null
  IdCountry: string
  PrevPoints: number | null
  PrevRank: number | null
  Rank: number
  RankingMovement: number | null
  RatedMatches: number | null
  TeamName: FifaRankingTeamName[] | null
  TotalPoints: number
}

export interface FifaRankingsResponse {
  Results: FifaRankingResult[]
}

export const FIFA_RANKINGS_URL =
  "https://api.fifa.com/api/v3/fifarankings/rankings/live?gender=1&sportType=0&language=en"

export const WC26_GROUPS = {
  A: ["Mexico", "South Korea", "South Africa", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia"],
  C: ["Brazil", "Morocco", "Scotland", "Haiti"],
  D: ["USA", "Australia", "Paraguay", "Türkiye"],
  E: ["Germany", "Ecuador", "Ivory Coast", "Curaçao"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Iran", "Egypt", "New Zealand"],
  H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Austria", "Algeria", "Jordan"],
  K: ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
  L: ["England", "Croatia", "Panama", "Ghana"],
} as const

const TEAM_KEY_ALIASES: Record<string, readonly string[]> = {
  "bosnia and herzegovina": ["bosnia"],
  "czech republic": ["czechia"],
  "united states": ["usa", "us"],
  turkey: ["turkiye", "türkiye"],
  "dr congo": ["congo dr", "democratic republic of the congo", "d r congo"],
  "cape verde": ["cabo verde"],
  curacao: ["curaçao"],
  "ivory coast": ["cote d ivoire", "cote divoire", "côte d ivoire"],
} as const

export function normalizeTeamKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase()
}

export type Wc26TeamRow = {
  idCountry: string | null
  teamName: string
  fifaRank: number | null
  fifaPoints: number | null
  confederation: string | null
  rankChange: number
  groupStageElo: number | null
  form: FormResult[] | null
  group: string
}

function getTeamDisplayName(team: FifaRankingResult): string {
  const en = team.TeamName?.find((name) => name.Locale === "en-GB")?.Description
  return en ?? team.TeamName?.[0]?.Description ?? team.IdCountry
}

function findFifaRowForTeam(
  fifaTeams: FifaRankingResult[],
  wcName: string
): FifaRankingResult | null {
  const targetKey = normalizeTeamKey(wcName)

  for (const row of fifaTeams) {
    const display = getTeamDisplayName(row)
    const fifaKey = normalizeTeamKey(display)
    if (fifaKey === targetKey) {
      return row
    }

    for (const [canonical, aliases] of Object.entries(TEAM_KEY_ALIASES)) {
      const canonicalKey = normalizeTeamKey(canonical)
      const aliasKeys = aliases.map((alias) => normalizeTeamKey(alias))

      const targetIsCanonical = targetKey === canonicalKey
      const targetIsAlias = aliasKeys.includes(targetKey)
      const fifaIsCanonical = fifaKey === canonicalKey
      const fifaIsAlias = aliasKeys.includes(fifaKey)

      if (
        (targetIsCanonical && fifaIsAlias) ||
        (targetIsAlias && fifaIsCanonical) ||
        (targetIsAlias && fifaIsAlias && canonicalKey === fifaKey)
      ) {
        return row
      }
    }
  }

  return null
}

export function buildWc26TeamRows(fifaTeams: FifaRankingResult[]): Wc26TeamRow[] {
  const powerTeamByName = new Map(
    powerRankingRows.map((row) => [normalizeTeamKey(row.team), row])
  )

  const merged: Wc26TeamRow[] = []

  for (const [group, groupTeams] of Object.entries(WC26_GROUPS)) {
    for (const wcName of groupTeams) {
      const fifaRow = findFifaRowForTeam(fifaTeams, wcName)
      const fifaDisplayName = fifaRow ? getTeamDisplayName(fifaRow) : wcName
      const powerRow =
        powerTeamByName.get(normalizeTeamKey(fifaDisplayName)) ??
        powerTeamByName.get(normalizeTeamKey(wcName)) ??
        null

      const rank = fifaRow?.Rank ?? null
      const points = fifaRow?.TotalPoints ?? null
      const confed = fifaRow?.ConfederationName ?? null
      const rankChange =
        fifaRow && fifaRow.PrevRank != null ? fifaRow.PrevRank - fifaRow.Rank : 0

      merged.push({
        idCountry: fifaRow?.IdCountry ?? null,
        teamName: wcName,
        fifaRank: rank,
        fifaPoints: points,
        confederation: confed,
        rankChange,
        groupStageElo: powerRow ? getAdjustedElo(powerRow) : null,
        form: powerRow?.form ?? null,
        group,
      })
    }
  }

  return merged.toSorted((a, b) => {
    if (a.fifaRank == null && b.fifaRank == null) return 0
    if (a.fifaRank == null) return 1
    if (b.fifaRank == null) return -1
    return a.fifaRank - b.fifaRank
  })
}

export function getTeamRouteId(team: Pick<Wc26TeamRow, "idCountry" | "teamName">): string {
  return team.idCountry ?? team.teamName
}

export function getTeamHref(team: Pick<Wc26TeamRow, "idCountry" | "teamName">): string {
  return `/teams/${encodeURIComponent(getTeamRouteId(team))}`
}

export function findTeamByRouteId(
  teams: Wc26TeamRow[],
  teamId: string | undefined
): Wc26TeamRow | undefined {
  if (!teamId) return undefined

  const decoded = decodeURIComponent(teamId)

  return teams.find((team) => {
    if (
      team.idCountry != null &&
      team.idCountry.toLowerCase() === decoded.toLowerCase()
    ) {
      return true
    }

    if (team.teamName === decoded) return true

    return normalizeTeamKey(team.teamName) === normalizeTeamKey(decoded)
  })
}
