import { describe, expect, it } from "bun:test"

import { buildBracketViewModel, type BracketMatchApi, type BracketRoundApi } from "./bracket.helpers"
import {
  advanceSimPick,
  buildMazeAssignments,
  corridorLength,
  getMazeGeometry,
  pointNearCorridorEnd,
  teamPathNodes,
} from "./maze-bracket.helpers"
import type { BracketTeamViewModel } from "./bracket.helpers"

function team(code: string): BracketMatchApi["home_team"] {
  return { name: `Team ${code}`, code }
}

function match(
  id: number,
  round: string,
  home: string,
  away: string,
  overrides: Partial<BracketMatchApi> = {}
): BracketMatchApi {
  return {
    id,
    round,
    home_team: team(home),
    away_team: team(away),
    home_team_code: home,
    away_team_code: away,
    home_score: 1,
    away_score: 0,
    home_pen: null,
    away_pen: null,
    kickoff_utc: "2026-06-11T12:00:00Z",
    status: "completed",
    phase: "knockout",
    group: null,
    ...overrides,
  }
}

const code = (n: number) => `T${String(n).padStart(2, "0")}`

/** "Home always wins" fixture across all 5 knockout rounds, champion = T00. */
function buildFullBracketRounds(): BracketRoundApi[] {
  const r32 = Array.from({ length: 16 }, (_, i) => match(i, "R32", code(2 * i), code(2 * i + 1)))
  const r16 = Array.from({ length: 8 }, (_, k) => match(100 + k, "R16", code(4 * k), code(4 * k + 2)))
  const qf = Array.from({ length: 4 }, (_, j) => match(200 + j, "QF", code(8 * j), code(8 * j + 4)))
  const sf = Array.from({ length: 2 }, (_, m) => match(300 + m, "SF", code(16 * m), code(16 * m + 8)))
  const final = [match(400, "final", code(0), code(16))]

  return [
    { round: "R32", matches: r32 },
    { round: "R16", matches: r16 },
    { round: "QF", matches: qf },
    { round: "SF", matches: sf },
    { round: "final", matches: final },
  ]
}

describe("maze bracket geometry", () => {
  it("builds a stable 63-node tree rooted at champ", () => {
    const geometry = getMazeGeometry()
    expect(geometry.order.length).toBe(63)
    expect(geometry.children["champ"]).toEqual(["fa", "fb"])
    expect(geometry.nodes["fa"].parent).toBe("champ")
    expect(geometry.wallsD.length).toBeGreaterThan(0)
  })

  it("is deterministic across calls (cached singleton)", () => {
    expect(getMazeGeometry()).toBe(getMazeGeometry())
  })

  it("keeps every corridor long enough to park a flag clear of both junctions", () => {
    const geometry = getMazeGeometry()
    geometry.corridors.forEach((c) => {
      // 4 grid cells at 1000/37 units per cell
      expect(corridorLength(c.pts)).toBeGreaterThanOrEqual(108)
    })
  })
})

describe("advanceSimPick", () => {
  const vm = (code: string): BracketTeamViewModel => ({
    code,
    name: `Team ${code}`,
    placeholder: false,
    identityKey: code.toLowerCase(),
  })

  it("advances a team to its parent junction slot", () => {
    const geometry = getMazeGeometry()
    const picks = advanceSimPick(geometry, {}, "top-R32-0", vm("AAA"))
    expect(picks["top-R16-0"]?.code).toBe("AAA")
  })

  it("clears downstream picks when a changed pick displaces a team", () => {
    const geometry = getMazeGeometry()
    // AAA advances R32 → R16 → QF, then the sibling entrant BBB is picked instead
    let picks = advanceSimPick(geometry, {}, "top-R32-0", vm("AAA"))
    picks = advanceSimPick(geometry, picks, "top-R16-0", vm("AAA"))
    expect(picks["top-QF-0"]?.code).toBe("AAA")
    picks = advanceSimPick(geometry, picks, "top-R32-1", vm("BBB"))
    expect(picks["top-R16-0"]?.code).toBe("BBB")
    expect(picks["top-QF-0"]).toBeUndefined()
  })

  it("keeps unrelated branches intact when a pick changes", () => {
    const geometry = getMazeGeometry()
    let picks = advanceSimPick(geometry, {}, "top-R32-2", vm("CCC"))
    picks = advanceSimPick(geometry, picks, "top-R32-0", vm("AAA"))
    picks = advanceSimPick(geometry, picks, "top-R32-1", vm("BBB"))
    expect(picks["top-R16-1"]?.code).toBe("CCC")
    expect(picks["top-R16-0"]?.code).toBe("BBB")
  })

  it("crowns a champion when a finalist advances from the final slot", () => {
    const geometry = getMazeGeometry()
    const picks = advanceSimPick(geometry, {}, "fa", vm("AAA"))
    expect(picks["champ"]?.code).toBe("AAA")
  })

  it("is a no-op for the champion node itself", () => {
    const geometry = getMazeGeometry()
    const picks = { champ: vm("AAA") }
    expect(advanceSimPick(geometry, picks, "champ", vm("AAA"))).toBe(picks)
  })
})

describe("pointNearCorridorEnd", () => {
  it("walks back along a straight segment", () => {
    expect(pointNearCorridorEnd([[0, 0], [0, 100]], 30)).toEqual([0, 70])
  })

  it("continues across segment boundaries", () => {
    expect(pointNearCorridorEnd([[0, 0], [0, 50], [50, 50]], 60)).toEqual([0, 40])
  })

  it("clamps at the polyline start", () => {
    expect(pointNearCorridorEnd([[0, 0], [0, 50]], 500)).toEqual([0, 0])
  })

  it("skips zero-length segments", () => {
    expect(pointNearCorridorEnd([[0, 0], [0, 50], [0, 50]], 10)).toEqual([0, 40])
  })
})

function countProgressedCorridors(nodeTeams: Map<string, { identityKey: string }>): number {
  const geometry = getMazeGeometry()
  return geometry.corridors.filter((c) => {
    const child = nodeTeams.get(c.childId)
    const parent = nodeTeams.get(c.parentId)
    return Boolean(child && parent && child.identityKey === parent.identityKey)
  }).length
}

describe("buildMazeAssignments", () => {
  it("threads a fully decided bracket end to end", () => {
    const geometry = getMazeGeometry()
    const rounds = buildBracketViewModel(buildFullBracketRounds())
    const { nodeTeams, championTeam } = buildMazeAssignments(geometry, rounds)

    expect(championTeam?.code).toBe("T00")
    // every node in the 63-node tree resolves when all rounds are decided
    expect(nodeTeams.size).toBe(63)

    const r32Codes = geometry.order
      .filter((id) => geometry.nodes[id].round === "R32")
      .map((id) => nodeTeams.get(id)?.code)
    expect(new Set(r32Codes).size).toBe(32)

    // alignment: every advancing team sits directly above the pair it came from
    geometry.order.forEach((id) => {
      const parentTeam = nodeTeams.get(id)
      const kids = geometry.children[id]
      if (!parentTeam || !kids) return
      expect(
        kids.some((kid) => nodeTeams.get(kid)?.identityKey === parentTeam.identityKey)
      ).toBe(true)
    })

    // exactly one advancement corridor per decided match: 16+8+4+2+1
    expect(countProgressedCorridors(nodeTeams)).toBe(31)
  })

  it("clamps a team's path at its elimination round", () => {
    const geometry = getMazeGeometry()
    const rounds = buildBracketViewModel(buildFullBracketRounds())
    const { nodeTeams, championTeam } = buildMazeAssignments(geometry, rounds)

    // champion: R32 → R16 → QF → SF → F → champ
    expect(teamPathNodes(nodeTeams, championTeam!.identityKey)?.size).toBe(6)
    // T01 lost in R32: only its entry node
    expect(teamPathNodes(nodeTeams, "t01")?.size).toBe(1)
    // T02 won R32, lost R16 to T00: entry node + R16 node
    expect(teamPathNodes(nodeTeams, "t02")?.size).toBe(2)
    expect(teamPathNodes(nodeTeams, "nonexistent")).toBeNull()
  })

  it("propagates R32 winners to R16 slots when later rounds are absent", () => {
    const geometry = getMazeGeometry()
    const rounds = buildBracketViewModel([buildFullBracketRounds()[0]]) // R32 only
    const { nodeTeams, championTeam } = buildMazeAssignments(geometry, rounds)

    expect(championTeam).toBeNull()

    const populatedByRound = new Map<string, number>()
    nodeTeams.forEach((_, id) => {
      const round = geometry.nodes[id].round
      populatedByRound.set(round, (populatedByRound.get(round) ?? 0) + 1)
    })
    expect(populatedByRound.get("R32")).toBe(32)
    expect(populatedByRound.get("R16")).toBe(16)
    expect(populatedByRound.has("QF")).toBe(false)
    expect(countProgressedCorridors(nodeTeams)).toBe(16)
  })

  it("infers advancement through a drawn match from the next round's lineup", () => {
    // mirrors live data: an R32 draw with missing penalty data, but the
    // R16 fixture list names the team that went through
    const [r32Round, r16Round] = buildFullBracketRounds()
    const drawn = r32Round.matches[1] // T02 vs T03
    drawn.home_score = 1
    drawn.away_score = 1
    const r16 = r16Round.matches.map((m) => ({ ...m, home_score: 0, away_score: 0, status: "scheduled" }))
    r16[0].away_team = team("T03") // T03 advanced on (unrecorded) penalties
    r16[0].away_team_code = "T03"

    const geometry = getMazeGeometry()
    const rounds = buildBracketViewModel([
      { round: "R32", matches: r32Round.matches },
      { round: "R16", matches: r16 },
    ])
    const { nodeTeams } = buildMazeAssignments(geometry, rounds)

    // all 32 entrants placed, all 16 R16 participants placed
    expect(nodeTeams.size).toBe(48)

    // T03 sits at an R16 node directly above the drawn pair
    const t03Path = teamPathNodes(nodeTeams, "t03")
    expect(t03Path?.size).toBe(2)
    const r16NodeId = [...t03Path!].find((id) => geometry.nodes[id].round === "R16")
    expect(r16NodeId).toBeDefined()
    const pairCodes = geometry.children[r16NodeId!].map((kid) => nodeTeams.get(kid)?.code)
    expect(pairCodes).toContain("T02")
    expect(pairCodes).toContain("T03")

    // scheduled R16 matches decide nothing: only R32 advancements are lit
    expect(countProgressedCorridors(nodeTeams)).toBe(16)
  })
})
