import { logger } from "@/lib/logger"

export type MatchdayStatisticName =
  | "rating"
  | "goal_contributions"
  | "pass_accuracy"

export interface MatchdayStatisticApiRow {
  stat_name: string
  value: number
  player_name: string
}

export interface MatchdayStatisticCardData {
  statName: MatchdayStatisticName
  value: number
  playerName: string
}

export interface MatchdayStatisticsCards {
  rating: MatchdayStatisticCardData
  goalContributions: MatchdayStatisticCardData
  passAccuracy: MatchdayStatisticCardData
}

export type MatchdayStatisticsCardKey = keyof MatchdayStatisticsCards

const DEFAULT_CARD = {
  statName: "rating" as MatchdayStatisticName,
  value: 0,
  playerName: "-",
}

export function buildMatchdayStatisticsApiPath(matchDate: string): string {
  const path = `/matches/${matchDate}/statistics`
  logger.info({
    message: "Built matchday statistics API path",
    match_date: matchDate,
    path,
  })
  return path
}

export function formatMatchdayStatisticValue(
  statName: MatchdayStatisticName,
  value: number
): string {
  const formatted =
    statName === "rating"
      ? value.toFixed(1)
      : statName === "pass_accuracy"
        ? `${Math.round(value)}%`
        : `${Math.round(value)}`

  logger.info({
    message: "Formatted matchday statistic value",
    stat_name: statName,
    raw_value: value,
    formatted_value: formatted,
  })
  return formatted
}

export function buildMatchdayStatisticsCards(
  rows: MatchdayStatisticApiRow[]
): MatchdayStatisticsCards {
  logger.info({
    message: "Building matchday statistics cards",
    row_count: rows.length,
  })

  const cards: MatchdayStatisticsCards = {
    rating: { ...DEFAULT_CARD, statName: "rating" },
    goalContributions: { ...DEFAULT_CARD, statName: "goal_contributions" },
    passAccuracy: { ...DEFAULT_CARD, statName: "pass_accuracy" },
  }
  const validStatNames = new Set<MatchdayStatisticName>([
    "rating",
    "goal_contributions",
    "pass_accuracy",
  ])

  for (const row of rows) {
    if (!validStatNames.has(row.stat_name as MatchdayStatisticName)) {
      logger.warn({
        message: "Skipping unexpected matchday statistic row",
        stat_name: row.stat_name,
        player_name: row.player_name,
      })
      continue
    }

    const cardKey =
      row.stat_name === "rating"
        ? "rating"
        : row.stat_name === "goal_contributions"
          ? "goalContributions"
          : "passAccuracy"

    cards[cardKey] = {
      statName: row.stat_name as MatchdayStatisticName,
      value: Number(row.value ?? 0),
      playerName: row.player_name || "-",
    }
  }

  logger.info({
    message: "Built matchday statistics cards",
    rating_value: cards.rating.value,
    goal_contributions_value: cards.goalContributions.value,
    pass_accuracy_value: cards.passAccuracy.value,
  })
  return cards
}
