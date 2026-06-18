import type { FormResult } from "@/datatypes"
import type { FormType } from "@/lib/teams/team-form"
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
  form: (FormResult | FormType)[] | null
  group: string
  eloRank?: number
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

/**
 * Maps a team name or FIFA country code to its 2-letter ISO 3166-1 alpha-2 code
 * to fetch flag WebP images from flagcdn.com.
 */
export function getTeamFlagUrl(
  team: { idCountry?: string | null; teamName: string },
  width: 20 | 40 | 80 | 160 | 320 = 80
): string {
  const nameKey = team.teamName.toLowerCase().trim()
  const idKey = team.idCountry?.toUpperCase().trim() ?? ""

  const isoMap: Record<string, string> = {
    // Group A
    mexico: "mx", MEX: "mx",
    "south korea": "kr", KOR: "kr",
    "south africa": "za", RSA: "za",
    czechia: "cz", "czech republic": "cz", CZE: "cz",
    // Group B
    canada: "ca", CAN: "ca",
    switzerland: "ch", SUI: "ch",
    qatar: "qa", QAT: "qa",
    bosnia: "ba", "bosnia and herzegovina": "ba", BIH: "ba",
    // Group C
    brazil: "br", BRA: "br",
    morocco: "ma", MAR: "ma",
    scotland: "gb-sct", SCO: "gb-sct",
    haiti: "ht", HAI: "ht",
    // Group D
    usa: "us", "united states": "us", USA: "us",
    australia: "au", AUS: "au",
    paraguay: "py", PAR: "py",
    turkiye: "tr", "türkiye": "tr", turkey: "tr", TUR: "tr",
    // Group E
    germany: "de", GER: "de",
    ecuador: "ec", ECU: "ec",
    "ivory coast": "ci", "cote d'ivoire": "ci", "cote d ivoire": "ci", CIV: "ci",
    curacao: "cw", curaçao: "cw", CUW: "cw",
    // Group F
    netherlands: "nl", NED: "nl",
    japan: "jp", JPN: "jp",
    tunisia: "tn", TUN: "tn",
    sweden: "se", SWE: "se",
    // Group G
    belgium: "be", BEL: "be",
    iran: "ir", IRN: "ir",
    egypt: "eg", EGY: "eg",
    "new zealand": "nz", NZL: "nz",
    // Group H
    spain: "es", ESP: "es",
    uruguay: "uy", URU: "uy",
    "saudi arabia": "sa", KSA: "sa",
    "cape verde": "cv", "cabo verde": "cv", CPV: "cv",
    // Group I
    france: "fr", FRA: "fr",
    senegal: "sn", SEN: "sn",
    norway: "no", NOR: "no",
    iraq: "iq", IRQ: "iq",
    // Group J
    argentina: "ar", ARG: "ar",
    austria: "at", AUT: "at",
    algeria: "dz", ALG: "dz",
    jordan: "jo", JOR: "jo",
    // Group K
    portugal: "pt", POR: "pt",
    colombia: "co", COL: "co",
    uzbekistan: "uz", UZB: "uz",
    "dr congo": "cd", "democratic republic of the congo": "cd", COD: "cd",
    // Group L
    england: "gb-eng", ENG: "gb-eng",
    croatia: "hr", CRO: "hr",
    panama: "pa", PAN: "pa",
    ghana: "gh", GHA: "gh",
    // Mock standings teams
    poland: "pl", POL: "pl",
    denmark: "dk", DNK: "dk",
    "costa rica": "cr", CRC: "cr",
    serbia: "rs", SRB: "rs",
    cameroon: "cm", CMR: "cm",
    italy: "it", ITA: "it",
    chile: "cl", CHI: "cl",
    nigeria: "ng", NGA: "ng",
    peru: "pe", PER: "pe",
    honduras: "hn", HON: "hn",
    jamaica: "jm", JAM: "jm",
    wales: "gb-wls", WAL: "gb-wls",
  }

  const code = isoMap[idKey] ?? isoMap[nameKey] ?? "un"
  return `https://flagcdn.com/w${width}/${code}.webp`
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

export const countryMetadata: Record<string, { group: string; federation: string }> = {
  MEX: { group: "A", federation: "CONCACAF" },
  KOR: { group: "A", federation: "AFC" },
  RSA: { group: "A", federation: "CAF" },
  CZE: { group: "A", federation: "UEFA" },
  POL: { group: "A", federation: "UEFA" },
  CAN: { group: "B", federation: "CONCACAF" },
  SUI: { group: "B", federation: "UEFA" },
  QAT: { group: "B", federation: "AFC" },
  BIH: { group: "B", federation: "UEFA" },
  BRA: { group: "C", federation: "CONMEBOL" },
  MAR: { group: "C", federation: "CAF" },
  SCO: { group: "C", federation: "UEFA" },
  HAI: { group: "C", federation: "CONCACAF" },
  USA: { group: "D", federation: "CONCACAF" },
  AUS: { group: "D", federation: "AFC" },
  PAR: { group: "D", federation: "CONMEBOL" },
  TUR: { group: "D", federation: "UEFA" },
  GER: { group: "E", federation: "UEFA" },
  ECU: { group: "E", federation: "CONMEBOL" },
  CIV: { group: "E", federation: "CAF" },
  CUW: { group: "E", federation: "CONCACAF" },
  NED: { group: "F", federation: "UEFA" },
  JPN: { group: "F", federation: "AFC" },
  TUN: { group: "F", federation: "CAF" },
  SWE: { group: "F", federation: "UEFA" },
  BEL: { group: "G", federation: "UEFA" },
  IRN: { group: "G", federation: "AFC" },
  EGY: { group: "G", federation: "CAF" },
  NZL: { group: "G", federation: "OFC" },
  ESP: { group: "H", federation: "UEFA" },
  URU: { group: "H", federation: "CONMEBOL" },
  KSA: { group: "H", federation: "AFC" },
  CPV: { group: "H", federation: "CAF" },
  FRA: { group: "I", federation: "UEFA" },
  SEN: { group: "I", federation: "CAF" },
  NOR: { group: "I", federation: "UEFA" },
  IRQ: { group: "I", federation: "AFC" },
  ARG: { group: "J", federation: "CONMEBOL" },
  AUT: { group: "J", federation: "UEFA" },
  ALG: { group: "J", federation: "CAF" },
  JOR: { group: "J", federation: "AFC" },
  POR: { group: "K", federation: "UEFA" },
  COL: { group: "K", federation: "CONMEBOL" },
  UZB: { group: "K", federation: "AFC" },
  COD: { group: "K", federation: "CAF" },
  ENG: { group: "L", federation: "UEFA" },
  CRO: { group: "L", federation: "UEFA" },
  PAN: { group: "L", federation: "CONCACAF" },
  GHA: { group: "L", federation: "CAF" },
};
