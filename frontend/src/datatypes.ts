import { z } from "zod"

export const powerRankingSchema = z.object({
  id: z.string(),
  rank: z.number(),
  rankChange: z.number(),
  team: z.string(),
  code: z.string(),
  confederation: z.enum([
    "UEFA",
    "CONMEBOL",
    "CONCACAF",
    "AFC",
    "CAF",
    "OFC",
  ]),
  group: z.enum([
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
  ]),
  baseElo: z.number(),
  played: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  goalsScored: z.number(),
  goalsAgainst: z.number(),
  goalDifference: z.number(),
  xgFor: z.number(),
  yellowCards: z.number(),
  redCards: z.number(),
  form: z.array(z.enum(["W", "D", "L"])).length(5),
})

export type FormResult = "W" | "D" | "L"

export type PowerRankingRow = z.infer<typeof powerRankingSchema>

export interface PowerRankingTableProps {
  data?: PowerRankingRow[]
  className?: string
}

export type ConfederationFilter =
  | "all"
  | PowerRankingRow["confederation"]

export interface FormBadgeProps {
  result: FormResult
}

export interface TeamFormProps {
  form: FormResult[]
}

export interface RankChangeBadgeProps {
  change: number
}

export type LiveRushMatchStatus = "finished" | "live" | "upcoming"

export interface LiveRushMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  kickoffLabel: string
  status: LiveRushMatchStatus
  group?: string
}

export type LiveRushTab = "all" | LiveRushMatchStatus

export interface LiveRushTabOption {
  value: LiveRushTab
  label: string
}

export interface LiveRushStatusCounts {
  finished: number
  live: number
  upcoming: number
}

export interface LiveRushProps {
  matches?: LiveRushMatch[]
  dateLabel?: string
}

export interface LiveRushMatchCardProps {
  match: LiveRushMatch
  className?: string
}

export interface LiveRushMatchGridProps {
  matches: LiveRushMatch[]
}

export const GROUPS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const

export type GroupKey = (typeof GROUPS)[number]

export interface StandingRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalDifference: number
  points: number
}

export interface StandingsTableProps {
  group: GroupKey
  rows: StandingRow[]
}

export interface GroupStageStandingsProps {
  className?: string
}

export interface TopGoalScorer {
  name: string
  initials: string
  nationality: string
  goals: number
  avatar: string
}

export interface TopAssistScorer {
  name: string
  initials: string
  nationality: string
  assists: number
  avatar?: string
}

export interface TopSaveScorer {
  name: string
  initials: string
  nationality: string
  saves: number
  avatar?: string
}

export type TopPerformerTuple = [
  TopGoalScorer[],
  TopAssistScorer[],
  TopSaveScorer[],
]

export interface PerformerRow {
  name: string
  initials: string
  nationality: string
  value: number
  avatar?: string
}

export interface PerformerListProps {
  performers: PerformerRow[]
}

export interface TopPerformersProps {
  className?: string
}

export type MatchWinner = "home" | "away" | "draw"
