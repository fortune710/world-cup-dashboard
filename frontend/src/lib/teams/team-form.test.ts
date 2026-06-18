import { describe, expect, it } from "bun:test"

import { teamForm } from "./team-form"

describe("teamForm", () => {
  it("builds form from match names when caller passes team code and name", () => {
    const form = teamForm(
      [
        {
          id: "1",
          homeTeam: "United States",
          awayTeam: "Mexico",
          homeScore: 2,
          awayScore: 1,
          kickoffUtc: "2026-06-20T18:00:00Z",
          kickoffLabel: "FT",
          status: "finished",
          group: "D",
        },
        {
          id: "2",
          homeTeam: "Spain",
          awayTeam: "USA",
          homeScore: 1,
          awayScore: 1,
          kickoffUtc: "2026-06-15T18:00:00Z",
          kickoffLabel: "FT",
          status: "finished",
          group: "D",
        },
        {
          id: "3",
          homeTeam: "France",
          awayTeam: "USA",
          homeScore: 0,
          awayScore: 0,
          kickoffUtc: "2026-06-10T18:00:00Z",
          kickoffLabel: "20:00",
          status: "upcoming",
          group: "I",
        },
      ],
      { code: "USA", name: "United States" }
    )

    expect(form).toHaveLength(2)
    expect(form).toEqual([
      {
        matchId: "1",
        result: "W",
        opponentId: "Mexico",
        score: "2-1",
        date: "2026-06-20T18:00:00Z",
      },
      {
        matchId: "2",
        result: "D",
        opponentId: "Spain",
        score: "1-1",
        date: "2026-06-15T18:00:00Z",
      },
    ])
  })
})
