import type {
  PerformerRow,
  TopAssistScorer,
  TopGoalScorer,
  TopPerformerTuple,
  TopSaveScorer,
  TopPerformersData,
} from "@/datatypes"

export const topPerformers: TopPerformerTuple = [
  [
    {
      name: "Lionel Messi",
      initials: "LM",
      nationality: "Argentina",
      goals: 5,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Kylian Mbappé",
      initials: "KM",
      nationality: "France",
      goals: 4,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Julián Álvarez",
      initials: "JA",
      nationality: "Argentina",
      goals: 4,
      avatar: "https://via.placeholder.com/150",
    },
  ],
  [
    {
      name: "Antoine Griezmann",
      initials: "AG",
      nationality: "France",
      assists: 5,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Kevin De Bruyne",
      initials: "KB",
      nationality: "Belgium",
      assists: 4,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Pedri",
      initials: "PD",
      nationality: "Spain",
      assists: 4,
      avatar: "https://via.placeholder.com/150",
    },
  ],
  [
    {
      name: "Ederson",
      initials: "ED",
      nationality: "Brazil",
      saves: 5,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Kepa Arrizabalaga",
      initials: "KA",
      nationality: "Spain",
      saves: 4,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Manuel Neuer",
      initials: "MN",
      nationality: "Germany",
      saves: 4,
      avatar: "https://via.placeholder.com/150",
    },
  ],
]

export function toGoalPerformerRows(
  performers: TopGoalScorer[]
): PerformerRow[] {
  return performers.map((performer) => ({
    name: performer.name,
    initials: performer.initials,
    nationality: performer.nationality,
    value: performer.goals,
    avatar: performer.avatar,
  }))
}

export function toAssistPerformerRows(
  performers: TopAssistScorer[]
): PerformerRow[] {
  return performers.map((performer) => ({
    name: performer.name,
    initials: performer.initials,
    nationality: performer.nationality,
    value: performer.assists,
    avatar: performer.avatar,
  }))
}

export function toSavePerformerRows(
  performers: TopSaveScorer[]
): PerformerRow[] {
  return performers.map((performer) => ({
    name: performer.name,
    initials: performer.initials,
    nationality: performer.nationality,
    value: performer.saves,
    avatar: performer.avatar,
  }))
}

type TopPerformerApiPlayer = {
  id: number
  name: string
  country_code?: string | null
  image_url?: string | null
  classification?: string | null
  rating?: number | null
  saves?: number | null
}

const countryMetadata: Record<string, { group: string; federation: string }> = {
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
}

const positionMap: Record<string, string> = {
  F: "FWD",
  M: "MID",
  D: "DEF",
  G: "GK",
}

export const TOP_PERFORMERS_ENDPOINTS = {
  goals: "/players/top/goals",
  assists: "/players/top/assists",
  saves: "/players/top/saves",
  rating: "/players/top/rating",
} as const

export function createTopPerformersSWRConfig() {
  return {
    shouldRetryOnError: true,
    errorRetryCount: 3,
    revalidateOnFocus: false,
  } as const
}

function buildPerformerRow(
  player: TopPerformerApiPlayer,
  valueKey: "goals" | "assists" | "saves" | "rating"
): PerformerRow {
  const name = player.name ?? ""
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
  const countryCode = (player.country_code || "").toUpperCase()
  const meta = countryMetadata[countryCode] || { group: "A", federation: "UEFA" }

  return {
    name,
    initials,
    nationality: player.country_code || "",
    value: (player as Record<string, number | null | undefined>)[valueKey] ?? 0,
    avatar: player.image_url || `https://img.sofascore.com/api/v1/player/${player.id}/image`,
    position: positionMap[player.classification || ""] || player.classification || "FWD",
    group: meta.group,
    federation: meta.federation,
    rating: player.rating || 0.0,
  }
}

export function buildTopPerformersData(
  goalsData: TopPerformerApiPlayer[],
  assistsData: TopPerformerApiPlayer[],
  savesData: TopPerformerApiPlayer[],
  ratingData: TopPerformerApiPlayer[]
): TopPerformersData {
  return {
    goals: goalsData.slice(0, 5).map((player) => buildPerformerRow(player, "goals")),
    assists: assistsData.slice(0, 5).map((player) => buildPerformerRow(player, "assists")),
    saves: savesData.slice(0, 5).map((player) => buildPerformerRow(player, "saves")),
    rating: ratingData.slice(0, 5).map((player) => buildPerformerRow(player, "rating")),
  }
}
