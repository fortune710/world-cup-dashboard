import type { MatchWinner } from "@/datatypes"

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
