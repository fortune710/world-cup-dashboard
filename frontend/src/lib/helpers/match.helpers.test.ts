import { describe, expect, it } from "bun:test"

import {
  buildMatchesApiPath,
  buildMatchesListApiPath,
  getMatchLocalDateKey,
  getCurrentLocalDate,
  groupMatchesByLocalDate,
  mapMatchApiRowsToLiveRushMatches,
} from "./match.helpers"

describe("match helpers", () => {
  it("buildMatchesApiPath includes the date segment and optional status", () => {
    expect(buildMatchesApiPath("2026-06-11")).toBe("/matches/2026-06-11")
    expect(buildMatchesApiPath("2026-06-11", "live")).toBe(
      "/matches/2026-06-11?status=live"
    )
  })

  it("buildMatchesListApiPath includes pagination and optional status", () => {
    expect(buildMatchesListApiPath(2, 100)).toBe("/matches?page=2&page_size=100")
    expect(buildMatchesListApiPath(3, 50, "finished")).toBe(
      "/matches?page=3&page_size=50&status=finished"
    )
  })

  it("getCurrentLocalDate returns the local calendar date for the provided timezone offset", () => {
    expect(
      getCurrentLocalDate(new Date("2026-06-15T02:30:00Z"), 240)
    ).toBe("2026-06-14")
  })

  it("getMatchLocalDateKey returns the local date for a kickoff timestamp", () => {
    expect(getMatchLocalDateKey("2026-06-15T02:30:00Z", 240)).toBe("2026-06-14")
  })

  it("groupMatchesByLocalDate groups matches into local date buckets", () => {
    const groups = groupMatchesByLocalDate([
      {
        id: "1",
        homeTeam: "Mexico",
        awayTeam: "Poland",
        homeScore: 2,
        awayScore: 1,
        kickoffUtc: "2026-06-15T02:30:00Z",
        kickoffLabel: "10:30 PM",
        status: "finished",
        group: "A",
      },
      {
        id: "2",
        homeTeam: "Brazil",
        awayTeam: "Spain",
        homeScore: 0,
        awayScore: 0,
        kickoffUtc: "2026-06-15T03:30:00Z",
        kickoffLabel: "11:30 PM",
        status: "upcoming",
        group: "B",
      },
    ], 240)

    expect(groups).toHaveLength(1)
    expect(groups[0].dateKey).toBe("2026-06-14")
    expect(groups[0].matches).toHaveLength(2)
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
