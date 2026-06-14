import { describe, expect, it } from "bun:test"

import {
  buildMatchesApiPath,
  mapMatchApiRowsToLiveRushMatches,
} from "./match.helpers"

describe("match helpers", () => {
  it("buildMatchesApiPath includes the date segment and optional status", () => {
    expect(buildMatchesApiPath("2026-06-11")).toBe("/matches/2026-06-11")
    expect(buildMatchesApiPath("2026-06-11", "live")).toBe(
      "/matches/2026-06-11?status=live"
    )
  })

  it("mapMatchApiRowsToLiveRushMatches maps match rows into live rush matches", () => {
    const matches = mapMatchApiRowsToLiveRushMatches([
      {
        id: 1,
        home_team: { name: "Mexico" },
        away_team: { name: "Poland" },
        home_team_code: "MEX",
        away_team_code: "POL",
        home_score: 2,
        away_score: 1,
        kickoff_utc: "2026-06-11T18:00:00",
        status: "completed",
        group: "A",
      },
    ])

    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({
      id: "1",
      homeTeam: "Mexico",
      awayTeam: "Poland",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      group: "A",
    })
  })
})
