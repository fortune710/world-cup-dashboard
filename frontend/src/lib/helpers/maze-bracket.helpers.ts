import { logger } from "@/lib/logger"
import type {
  BracketMatchViewModel,
  BracketRoundKey,
  BracketRoundViewModel,
  BracketTeamViewModel,
} from "@/lib/helpers/bracket.helpers"

export type MazeSide = "top" | "right" | "bottom" | "left"
export type MazeTier = "R32" | "R16" | "QF" | "SF" | "F" | "C"

export interface MazeNode {
  id: string
  side?: MazeSide
  round: MazeTier
  c: number
  r: number
  x: number
  y: number
  parent?: string
}

export interface MazeCorridor {
  childId: string
  parentId: string
  round: MazeTier
  points: string
  /** polyline vertices child → bend → parent, in 0-1000 svg units */
  pts: [number, number][]
}

export interface MazeGeometry {
  nodes: Record<string, MazeNode>
  order: string[]
  corridors: MazeCorridor[]
  children: Record<string, string[]>
  wallsD: string
}

const MAZE_GRID_SIZE = 37
const MAZE_DECORATIVE_SEED = 20260704

function buildMazeGeometry(): MazeGeometry {
  const N = MAZE_GRID_SIZE
  const s = 1000 / N
  const cellCenter = (c: number, r: number): [number, number] => [(c + 0.5) * s, (r + 0.5) * s]

  const nodes: Record<string, MazeNode> = {}
  const order: string[] = []
  const SIDES: MazeSide[] = ["top", "right", "bottom", "left"]
  // rings keep 4 grid cells between consecutive junctions all the way to the
  // trophy, so a team flag can park on a corridor short of its next junction
  // marker without covering the marker it departed from. The SF ring shares
  // inset 10 with the QF ring — same distance from the wall, different cells.
  const rings: { round: MazeTier; inset: number; cols: number[] }[] = [
    { round: "R32", inset: 2, cols: [4, 8, 12, 16, 20, 24, 28, 32] },
    { round: "R16", inset: 6, cols: [6, 14, 22, 30] },
    { round: "QF", inset: 10, cols: [10, 26] },
    { round: "SF", inset: 10, cols: [18] },
  ]

  const cellFor = (side: MazeSide, inset: number, col: number): [number, number] => {
    if (side === "top") return [col, inset]
    if (side === "right") return [36 - inset, col]
    if (side === "bottom") return [36 - col, 36 - inset]
    return [inset, 36 - col]
  }

  SIDES.forEach((side) => {
    rings.forEach((ring) => {
      ring.cols.forEach((col, i) => {
        const [c, r] = cellFor(side, ring.inset, col)
        const [x, y] = cellCenter(c, r)
        const id = `${side}-${ring.round}-${i}`
        nodes[id] = { id, side, round: ring.round, c, r, x, y }
        order.push(id)
      })
    })
    for (let i = 0; i < 8; i++) nodes[`${side}-R32-${i}`].parent = `${side}-R16-${i >> 1}`
    for (let i = 0; i < 4; i++) nodes[`${side}-R16-${i}`].parent = `${side}-QF-${i >> 1}`
    for (let i = 0; i < 2; i++) nodes[`${side}-QF-${i}`].parent = `${side}-SF-0`
  })

  const mk = (id: string, c: number, r: number, round: MazeTier) => {
    const [x, y] = cellCenter(c, r)
    nodes[id] = { id, round, c, r, x, y }
    order.push(id)
  }
  mk("fa", 18, 14, "F")
  mk("fb", 18, 22, "F")
  mk("champ", 18, 18, "C")
  nodes["top-SF-0"].parent = "fa"
  nodes["right-SF-0"].parent = "fa"
  nodes["bottom-SF-0"].parent = "fb"
  nodes["left-SF-0"].parent = "fb"
  nodes["fa"].parent = "champ"
  nodes["fb"].parent = "champ"

  const corridors: MazeCorridor[] = []
  const children: Record<string, string[]> = {}
  const legs: { a: [number, number]; b: [number, number]; e: [number, number] }[] = []
  Object.values(nodes).forEach((n) => {
    if (!n.parent) return
    const p = nodes[n.parent]
    let bc: number
    let br: number
    if (n.side === "left" || n.side === "right") {
      if (n.round !== "SF") {
        bc = p.c
        br = n.r
      } else {
        bc = n.c
        br = p.r
      }
    } else {
      bc = n.c
      br = p.r
    }
    const [bx, by] = cellCenter(bc, br)
    corridors.push({
      childId: n.id,
      parentId: p.id,
      round: n.round,
      points: `${n.x},${n.y} ${bx},${by} ${p.x},${p.y}`,
      pts: [
        [n.x, n.y],
        [bx, by],
        [p.x, p.y],
      ],
    })
    legs.push({ a: [n.c, n.r], b: [bc, br], e: [p.c, p.r] })
    ;(children[p.id] = children[p.id] || []).push(n.id)
  })

  // ---- carve maze corridors into a walkable grid ----
  const carved = new Set<string>()
  const open = new Set<string>()
  const key = (c: number, r: number) => `${c},${r}`
  const edgeKey = (a: [number, number], b: [number, number]) => {
    const swap = a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])
    const p = swap ? b : a
    const q = swap ? a : b
    return `${p[0]},${p[1]}|${q[0]},${q[1]}`
  }
  const carveLine = (a: [number, number], b: [number, number]) => {
    const dc = Math.sign(b[0] - a[0])
    const dr = Math.sign(b[1] - a[1])
    let c = a[0]
    let r = a[1]
    carved.add(key(c, r))
    while (c !== b[0] || r !== b[1]) {
      const pc = c
      const pr = r
      c += dc
      r += dr
      carved.add(key(c, r))
      open.add(edgeKey([pc, pr], [c, r]))
    }
  }
  legs.forEach((leg) => {
    carveLine(leg.a, leg.b)
    carveLine(leg.b, leg.e)
  })
  for (let c = 17; c <= 19; c++) {
    for (let r = 17; r <= 19; r++) {
      carved.add(key(c, r))
      if (c < 19) open.add(edgeKey([c, r], [c + 1, r]))
      if (r < 19) open.add(edgeKey([c, r], [c, r + 1]))
    }
  }

  // decorative dead-end passages (deterministic, purely cosmetic)
  let seed = MAZE_DECORATIVE_SEED
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const stack = [...carved].map((k) => k.split(",").map(Number) as [number, number])
  for (let i = stack.length - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0
    const tmp = stack[i]
    stack[i] = stack[j]
    stack[j] = tmp
  }
  const dirs: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  while (stack.length) {
    const cur = stack[stack.length - 1]
    const nbs = dirs
      .map((d) => [cur[0] + d[0], cur[1] + d[1]] as [number, number])
      .filter((nb) => nb[0] >= 0 && nb[0] < N && nb[1] >= 0 && nb[1] < N && !carved.has(key(nb[0], nb[1])))
    if (!nbs.length) {
      stack.pop()
      continue
    }
    const nb = nbs[(rnd() * nbs.length) | 0]
    open.add(edgeKey(cur, nb))
    carved.add(key(nb[0], nb[1]))
    stack.push(nb)
  }

  // ---- render remaining (uncarved) grid lines as maze walls ----
  let d = ""
  for (let c = 0; c < N - 1; c++) {
    let r = 0
    while (r < N) {
      if (!open.has(edgeKey([c, r], [c + 1, r]))) {
        let r2 = r
        while (r2 + 1 < N && !open.has(edgeKey([c, r2 + 1], [c + 1, r2 + 1]))) r2++
        d += `M${((c + 1) * s).toFixed(1)} ${(r * s).toFixed(1)}V${((r2 + 1) * s).toFixed(1)}`
        r = r2 + 1
      } else {
        r++
      }
    }
  }
  for (let r = 0; r < N - 1; r++) {
    let c = 0
    while (c < N) {
      if (!open.has(edgeKey([c, r], [c, r + 1]))) {
        let c2 = c
        while (c2 + 1 < N && !open.has(edgeKey([c2 + 1, r], [c2 + 1, r + 1]))) c2++
        d += `M${(c * s).toFixed(1)} ${((r + 1) * s).toFixed(1)}H${((c2 + 1) * s).toFixed(1)}`
        c = c2 + 1
      } else {
        c++
      }
    }
  }
  d += "M2 2H998V998H2Z"

  return { nodes, order, corridors, children, wallsD: d }
}

let cachedGeometry: MazeGeometry | null = null

export function getMazeGeometry(): MazeGeometry {
  if (!cachedGeometry) cachedGeometry = buildMazeGeometry()
  return cachedGeometry
}

export interface MazeAssignment {
  nodeTeams: Map<string, BracketTeamViewModel>
  championTeam: BracketTeamViewModel | null
}

function winnerOf(match: BracketMatchViewModel): BracketTeamViewModel | null {
  if (match.winnerSide === "home") return match.homeTeam
  if (match.winnerSide === "away") return match.awayTeam
  return null
}

/** Knockout rounds that exist in the maze, lowest first ("3rd" has no slot). */
const MAZE_ROUND_SEQ: BracketRoundKey[] = ["R32", "R16", "QF", "SF", "final"]

/**
 * Maze tier at which a subtree rooted at a match of the given round embeds:
 * the match's two teams sit at that node's children, its winner at the node.
 */
const ROOT_TIER_FOR_ROUND: Partial<Record<BracketRoundKey, MazeTier>> = {
  R32: "R16",
  R16: "QF",
  QF: "SF",
  SF: "F",
  final: "C",
}

interface MatchUnit {
  match: BracketMatchViewModel
  round: BracketRoundKey
  homeFeeder: MatchUnit | null
  awayFeeder: MatchUnit | null
}

/**
 * Places real bracket teams onto the maze's fixed geometry, bottom-up.
 *
 * Matches are first linked into subtrees: a round's match is fed by the two
 * lower-round matches its teams came out of, resolved by winner identity —
 * or, when a lower match has no recorded winner (e.g. a draw missing penalty
 * data), by the team's mere presence in the higher round, which implies it
 * advanced. Unlinked matches remain roots. Each root subtree is then embedded
 * into a free maze slot of the matching tier so a team always sits directly
 * above the pair it emerged from, and winners propagate to parent nodes even
 * when the next round's fixture is still TBD.
 */
export function buildMazeAssignments(
  geometry: MazeGeometry,
  rounds: BracketRoundViewModel[]
): MazeAssignment {
  const byRoundKey = new Map(rounds.map((round) => [round.key, round.matches]))
  const nodeTeams = new Map<string, BracketTeamViewModel>()
  const used = new Set<string>()

  // ---- link matches across rounds into subtree units ----
  const roots: MatchUnit[] = []
  let carry: MatchUnit[] = []
  for (const roundKey of MAZE_ROUND_SEQ) {
    const units: MatchUnit[] = (byRoundKey.get(roundKey) ?? [])
      .filter((m) => !m.homeTeam.placeholder || !m.awayTeam.placeholder)
      .map((m) => ({ match: m, round: roundKey, homeFeeder: null, awayFeeder: null }))

    const consumed = new Set<MatchUnit>()
    const link = (team: BracketTeamViewModel): MatchUnit | null => {
      if (team.placeholder) return null
      const byWinner = carry.find(
        (f) => !consumed.has(f) && winnerOf(f.match)?.identityKey === team.identityKey
      )
      const feeder =
        byWinner ??
        carry.find(
          (f) =>
            !consumed.has(f) &&
            winnerOf(f.match) === null &&
            (f.match.homeTeam.identityKey === team.identityKey ||
              f.match.awayTeam.identityKey === team.identityKey)
        ) ??
        null
      if (feeder) consumed.add(feeder)
      return feeder
    }
    for (const unit of units) {
      unit.homeFeeder = link(unit.match.homeTeam)
      unit.awayFeeder = link(unit.match.awayTeam)
    }
    roots.push(...carry.filter((f) => !consumed.has(f)))
    carry = units
  }
  roots.push(...carry)

  // ---- embed root subtrees into free maze slots, highest rounds first ----
  const place = (nodeId: string | undefined, team: BracketTeamViewModel | null | undefined) => {
    if (nodeId && team && !team.placeholder && !nodeTeams.has(nodeId)) nodeTeams.set(nodeId, team)
  }
  const reserveSubtree = (nodeId: string) => {
    used.add(nodeId)
    ;(geometry.children[nodeId] ?? []).forEach(reserveSubtree)
  }
  const embedUnit = (unit: MatchUnit, nodeId: string) => {
    used.add(nodeId)
    place(nodeId, winnerOf(unit.match))
    const kids = geometry.children[nodeId] ?? []
    const sides: [BracketTeamViewModel, MatchUnit | null][] = [
      [unit.match.homeTeam, unit.homeFeeder],
      [unit.match.awayTeam, unit.awayFeeder],
    ]
    sides.forEach(([team, feeder], i) => {
      const kid = kids[i]
      if (!kid) return
      if (feeder) {
        place(kid, team)
        embedUnit(feeder, kid)
      } else if (!team.placeholder) {
        // known team with unknown origin: keep the pair below it empty rather
        // than letting an unrelated leftover match nest under the wrong team
        place(kid, team)
        reserveSubtree(kid)
      }
    })
  }

  const sortedRoots = roots.toSorted(
    (a, b) => MAZE_ROUND_SEQ.indexOf(b.round) - MAZE_ROUND_SEQ.indexOf(a.round)
  )
  for (const unit of sortedRoots) {
    const tier = ROOT_TIER_FOR_ROUND[unit.round]
    const slot = geometry.order.find(
      (id) => geometry.nodes[id].round === tier && !used.has(id)
    )
    if (!slot) {
      logger.warn({
        message: "No free maze slot for bracket match",
        match_id: unit.match.id,
        round: unit.round,
      })
      continue
    }
    embedUnit(unit, slot)
  }

  const finalMatch = (byRoundKey.get("final") ?? [])[0] ?? null
  const finalWinner = finalMatch ? winnerOf(finalMatch) : null
  const championTeam = finalWinner && !finalWinner.placeholder ? finalWinner : null

  logger.info({
    message: "Built maze assignments",
    root_count: roots.length,
    placed_node_count: nodeTeams.size,
    champion_code: championTeam?.code ?? null,
  })

  return { nodeTeams, championTeam }
}

/**
 * Applies one user pick in simulation mode: the team at `fromNodeId` advances
 * to its parent junction slot. If that displaces a previously picked team,
 * every consecutive ancestor still carrying the displaced team is cleared,
 * so a changed pick can never leave a team advanced beyond a round it no
 * longer wins.
 */
export function advanceSimPick(
  geometry: MazeGeometry,
  picks: Record<string, BracketTeamViewModel>,
  fromNodeId: string,
  team: BracketTeamViewModel
): Record<string, BracketTeamViewModel> {
  const parentId = geometry.nodes[fromNodeId]?.parent
  if (!parentId) return picks
  const next = { ...picks }
  const displaced = next[parentId]
  next[parentId] = team
  if (displaced && displaced.identityKey !== team.identityKey) {
    let ancestor = geometry.nodes[parentId].parent
    while (ancestor && next[ancestor]?.identityKey === displaced.identityKey) {
      delete next[ancestor]
      ancestor = geometry.nodes[ancestor].parent
    }
  }
  return next
}

/**
 * The point on a corridor polyline that lies `distFromEnd` units before its
 * last vertex, walking backwards along the segments. Clamps to the polyline
 * start. Used to park a team's flag just short of the junction it is
 * heading into, so the junction marker stays visible.
 */
export function pointNearCorridorEnd(
  pts: [number, number][],
  distFromEnd: number
): [number, number] {
  let remaining = distFromEnd
  for (let i = pts.length - 1; i > 0; i--) {
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i]
    const len = Math.hypot(bx - ax, by - ay)
    if (len === 0) continue
    if (remaining <= len) {
      const t = (len - remaining) / len
      return [ax + (bx - ax) * t, ay + (by - ay) * t]
    }
    remaining -= len
  }
  return pts[0]
}

export function corridorLength(pts: [number, number][]): number {
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  }
  return total
}

/**
 * All maze nodes a team occupies — its road from the round of 32 up to
 * wherever it was eliminated (or the trophy). Corridors light up only
 * between consecutive occupied nodes, so a path never extends past the
 * round a team went out in.
 */
export function teamPathNodes(
  nodeTeams: Map<string, BracketTeamViewModel>,
  identityKey: string | null | undefined
): Set<string> | null {
  if (!identityKey) return null
  const set = new Set<string>()
  nodeTeams.forEach((team, id) => {
    if (team.identityKey === identityKey) set.add(id)
  })
  return set.size > 0 ? set : null
}
