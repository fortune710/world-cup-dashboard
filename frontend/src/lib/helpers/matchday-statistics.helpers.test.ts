import { describe, expect, it } from "bun:test"

import {
  buildMatchdayStatisticsApiPath,
  buildMatchdayStatisticsCards,
  formatMatchdayStatisticValue,
} from "./matchday-statistics.helpers"

describe("matchday statistics helpers", () => {
  it("buildMatchdayStatisticsApiPath includes the date segment", () => {
    expect(buildMatchdayStatisticsApiPath("2026-06-11")).toBe(
      "/matches/2026-06-11/statistics"
    )
  })

  it("buildMatchdayStatisticsCards maps leaders to card models", () => {
    const cards = buildMatchdayStatisticsCards([
      { stat_name: "rating", value: 8.7, player_name: "Player One" },
      { stat_name: "goal_contributions", value: 3, player_name: "Player Two" },
      { stat_name: "pass_accuracy", value: 92, player_name: "Player Three" },
    ])

    expect(cards.rating).toMatchObject({
      statName: "rating",
      value: 8.7,
      playerName: "Player One",
    })
    expect(cards.goalContributions).toMatchObject({
      statName: "goal_contributions",
      value: 3,
      playerName: "Player Two",
    })
    expect(cards.passAccuracy).toMatchObject({
      statName: "pass_accuracy",
      value: 92,
      playerName: "Player Three",
    })
  })

  it("formatMatchdayStatisticValue formats rating and percentage values", () => {
    expect(formatMatchdayStatisticValue("rating", 8.72)).toBe("8.7")
    expect(formatMatchdayStatisticValue("goal_contributions", 3)).toBe("3")
    expect(formatMatchdayStatisticValue("pass_accuracy", 92)).toBe("92%")
  })
})
