import { describe, expect, it } from "bun:test"

import {
  buildBracketApiPath,
  buildBracketViewModel,
  getBracketMatchWinnerSide,
  isBracketMatchCompleted,
} from "./bracket.helpers"

describe("bracket helpers", () => {
  it("buildBracketApiPath returns the bracket endpoint without trailing slash", () => {
    expect(buildBracketApiPath()).toBe("/bracket")
  })

  it("buildBracketViewModel orders rounds and preserves team progress", () => {
    const rounds = buildBracketViewModel([
      {
        round: "QF",
        matches: [
          {
            id: 3,
            round: "QF",
            home_team: { name: "Alpha United", code: null },
            away_team: { name: "Winner Beta", code: "WBT" },
            home_team_code: null,
            away_team_code: "WBT",
            home_score: 2,
            away_score: 1,
            home_pen: null,
            away_pen: null,
            kickoff_utc: "2026-06-25T12:00:00Z",
            status: "completed",
            phase: "knockout",
            group: null,
          },
        ],
      },
      {
        round: "R32",
        matches: [
          {
            id: 1,
            round: "R32",
            home_team: { name: "Alpha United", code: null },
            away_team: { name: "Beta FC", code: "BET" },
            home_team_code: null,
            away_team_code: "BET",
            home_score: 1,
            away_score: 0,
            home_pen: null,
            away_pen: null,
            kickoff_utc: "2026-06-11T12:00:00Z",
            status: "completed",
            phase: "knockout",
            group: null,
          },
        ],
      },
      {
        round: "R16",
        matches: [
          {
            id: 2,
            round: "R16",
            home_team: { name: "Alpha United", code: null },
            away_team: { name: "Gamma City", code: "GAM" },
            home_team_code: null,
            away_team_code: "GAM",
            home_score: 2,
            away_score: 0,
            home_pen: null,
            away_pen: null,
            kickoff_utc: "2026-06-18T12:00:00Z",
            status: "completed",
            phase: "knockout",
            group: null,
          },
        ],
      },
    ])

    expect(rounds.map((round) => round.key)).toEqual(["R32", "R16", "QF"])
    expect(rounds[0].matches[0].homeTeam.code).toBe("TBD")
    expect(rounds[0].matches[0].homeTeam.name).toBe("Alpha United")
    expect(rounds[0].matches[0].advancementLabel).toBe("R16")
    expect(rounds[1].matches[0].advancementLabel).toBe("QF")
    expect(rounds[2].matches[0].advancementLabel).toBeNull()
    expect(rounds[0].matches[0].isCompleted).toBe(true)
  })

  it("isBracketMatchCompleted recognizes finished statuses", () => {
    expect(isBracketMatchCompleted("completed")).toBe(true)
    expect(isBracketMatchCompleted("finished")).toBe(true)
    expect(isBracketMatchCompleted("scheduled")).toBe(false)
  })

  it("getBracketMatchWinnerSide uses penalties when scores are level", () => {
    expect(
      getBracketMatchWinnerSide({
        id: 4,
        round: "final",
        home_score: 1,
        away_score: 1,
        home_pen: 4,
        away_pen: 2,
        status: "completed",
      })
    ).toBe("home")
  })

  it("buildBracketViewModel flags in-progress matches as live", () => {
    const rounds = buildBracketViewModel([
      {
        round: "R16",
        matches: [
          {
            id: 9,
            round: "R16",
            home_team: { name: "Canada", code: "CAN" },
            away_team: { name: "Morocco", code: "MAR" },
            home_score: 0,
            away_score: 2,
            status: "live",
          },
        ],
      },
    ])

    expect(rounds[0].matches[0].isLive).toBe(true)
    expect(rounds[0].matches[0].isCompleted).toBe(false)
  })
})
