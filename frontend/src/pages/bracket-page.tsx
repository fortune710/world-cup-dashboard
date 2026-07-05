import * as React from "react"
import { useTranslation } from "react-i18next"
import { Play, RotateCcw } from "lucide-react"

import { BracketTimeline } from "@/components/bracket-timeline"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import type { BracketTeamViewModel } from "@/lib/helpers/bracket.helpers"
import {
  advanceSimPick,
  buildMazeAssignments,
  corridorLength,
  getMazeGeometry,
  pointNearCorridorEnd,
  teamPathNodes,
  type MazeTier,
} from "@/lib/helpers/maze-bracket.helpers"
import { useBracket } from "@/hooks/use-bracket"
import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"
import { getTeamColor } from "@/lib/teams/team-colors"
import worldCupTrophyUrl from "@/assets/world-cup-trophy.svg"

// flag size (cqmin) by the node a team occupies — it shrinks as teams go
// deeper, where junctions sit closer together
const FLAG_SIZE_BY_TIER: Partial<Record<MazeTier, number>> = {
  R32: 4.6,
  R16: 4.0,
  QF: 3.6,
  SF: 3.3,
  F: 3.1,
}
// junction markers: a node of tier X is where the match of the PREVIOUS
// round is played (two R32 entrants meet at an R16-tier node, and so on)
const MARKER_BY_TIER: Partial<
  Record<MazeTier, { size: number; label: string; title: string }>
> = {
  R16: { size: 3.2, label: "R32", title: "Round of 32 tie" },
  QF: { size: 3.6, label: "R16", title: "Round of 16 tie" },
  SF: { size: 4.0, label: "QF", title: "Quarter-final" },
  F: { size: 4.4, label: "SF", title: "Semi-final" },
}
const TROPHY_SIZE_CQMIN = 10
// gap (svg units) between a parked flag's edge and the junction marker's
// edge — flags hang back from the meeting point rather than crowding it
const FLAG_SET_BACK = 14

interface ConfettiPiece {
  id: number
  left: number
  size: number
  color: string
  dur: number
  delay: number
}

function generateConfetti(teamColor: string | null): ConfettiPiece[] {
  const colors = [teamColor ?? "#e9b949", "#e9b949", "#ffe08a", "#ffffff"]
  return Array.from({ length: 70 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 5 + Math.random() * 7,
    color: colors[(Math.random() * colors.length) | 0],
    dur: 2.3 + Math.random() * 1.8,
    delay: Math.random() * 0.7,
  }))
}

function TeamFlagImage({
  team,
  width,
  className,
}: {
  team: BracketTeamViewModel
  width: 20 | 40 | 80 | 160 | 320
  className?: string
}) {
  return (
    <img
      src={getTeamFlagUrl({ idCountry: team.code, teamName: team.name }, width)}
      alt={team.name}
      className={className}
    />
  )
}

export function BracketPage() {
  const { t } = useTranslation()
  const { rounds, loading, error, hasData } = useBracket()

  const geometry = React.useMemo(() => getMazeGeometry(), [])
  const { nodeTeams, championTeam } = React.useMemo(
    () => buildMazeAssignments(geometry, rounds),
    [geometry, rounds]
  )

  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [pinnedId, setPinnedId] = React.useState<string | null>(null)
  const [celebrating, setCelebrating] = React.useState(false)
  const [confetti, setConfetti] = React.useState<ConfettiPiece[]>([])
  const [simulating, setSimulating] = React.useState(false)
  const [simPicks, setSimPicks] = React.useState<
    Record<string, BracketTeamViewModel>
  >({})

  // in simulation mode only the round-of-32 entrants carry over from the
  // real bracket; everything downstream comes from the user's picks
  const effectiveNodeTeams = React.useMemo(() => {
    if (!simulating) return nodeTeams
    const map = new Map<string, BracketTeamViewModel>()
    nodeTeams.forEach((team, id) => {
      if (geometry.nodes[id].round === "R32") map.set(id, team)
    })
    Object.entries(simPicks).forEach(([id, team]) => map.set(id, team))
    return map
  }, [simulating, simPicks, nodeTeams, geometry])

  const effectiveChampion = simulating
    ? (simPicks["champ"] ?? null)
    : championTeam

  const activeId = hoveredId ?? pinnedId
  const activeTeam = celebrating
    ? effectiveChampion
    : activeId
      ? (effectiveNodeTeams.get(activeId) ?? null)
      : null
  const activeSet = teamPathNodes(effectiveNodeTeams, activeTeam?.identityKey)
  const activeColor =
    (activeTeam && getTeamColor(activeTeam.code)) || "var(--color-primary)"

  React.useEffect(() => {
    logger.info({
      message: "Bracket maze page state updated",
      loading,
      has_error: Boolean(error),
      has_data: hasData,
      round_count: rounds.length,
      simulating,
      champion_code: effectiveChampion?.code ?? null,
    })
  }, [loading, error, hasData, rounds.length, simulating, effectiveChampion])

  const handleSimulate = () => {
    setSimulating(true)
    setSimPicks({})
    setCelebrating(false)
    setConfetti([])
    setHoveredId(null)
    setPinnedId(null)
    logger.info({ message: "Bracket knockout simulation started" })
  }

  const handleReset = () => {
    setSimulating(false)
    setSimPicks({})
    setCelebrating(false)
    setConfetti([])
    setHoveredId(null)
    setPinnedId(null)
  }

  const advanceTeam = (id: string) => {
    const team = effectiveNodeTeams.get(id)
    const parentId = geometry.nodes[id].parent
    if (!team || !parentId) return
    setSimPicks((prev) => advanceSimPick(geometry, prev, id, team))
    logger.info({
      message: "Bracket simulation pick",
      team_code: team.code,
      from_node: id,
      to_node: parentId,
    })
    if (parentId === "champ") {
      setConfetti(generateConfetti(getTeamColor(team.code)))
      setCelebrating(true)
      setHoveredId(null)
      setPinnedId(null)
    }
  }

  const corridorByChild = React.useMemo(
    () => new Map(geometry.corridors.map((c) => [c.childId, c])),
    [geometry]
  )

  const visualMarkers = React.useMemo(() => {
    return geometry.order.flatMap((id) => {
      const node = geometry.nodes[id]
      const marker = MARKER_BY_TIER[node.round]
      if (!marker) return []
      // a junction is on a team's road both when the team went through it and
      // when it is the stage the team currently sits at (its child holds the
      // team), so neither end of the highlighted run dims out
      const active = activeSet
        ? activeSet.has(id) ||
          (geometry.children[id] ?? []).some((kid) => activeSet.has(kid))
        : false
      return [
        {
          id,
          left: node.x / 10,
          top: node.y / 10,
          size: marker.size,
          label: marker.label,
          title: marker.title,
          active,
          dim: Boolean(activeSet) && !active,
        },
      ]
    })
  }, [geometry, activeSet])

  const visualFlags = React.useMemo(() => {
    return geometry.order.flatMap((id) => {
      const node = geometry.nodes[id]
      if (node.round === "C") return []
      const team = effectiveNodeTeams.get(id)
      if (!team) return []
      const size = FLAG_SIZE_BY_TIER[node.round] ?? FLAG_SIZE_BY_TIER.R32!

      // entrants sit on their entry node; advancing teams park on their
      // corridor a little short of the junction where their next tie is
      // played, hanging back so the marker and both opponents stay clear
      let x = node.x
      let y = node.y
      const corridor =
        node.round !== "R32" ? corridorByChild.get(id) : undefined
      if (corridor) {
        const parentTier = geometry.nodes[corridor.parentId].round
        const parentRadius =
          parentTier === "C"
            ? TROPHY_SIZE_CQMIN * 5
            : (MARKER_BY_TIER[parentTier]?.size ?? 3) * 5
        const childRadius = (MARKER_BY_TIER[node.round]?.size ?? 3) * 5
        const flagRadius = size * 5
        const total = corridorLength(corridor.pts)
        const desired = parentRadius + flagRadius + FLAG_SET_BACK
        // hang back from the junction, but never so far that the flag covers
        // the marker at the corridor's other end; if the corridor is too
        // short for both, keeping clear of the destination marker wins
        const childLimit = total - (childRadius + flagRadius + 2)
        let dist = Math.min(desired, childLimit)
        if (dist < parentRadius + flagRadius + 2)
          dist = Math.min(desired, total - 6)
        ;[x, y] = pointNearCorridorEnd(corridor.pts, dist)
      }

      const active = activeSet ? activeSet.has(id) : false
      return [
        {
          id,
          left: x / 10,
          top: y / 10,
          size,
          team,
          active,
          dim: Boolean(activeSet) && !active,
        },
      ]
    })
  }, [geometry, corridorByChild, effectiveNodeTeams, activeSet])

  const visualCorridors = React.useMemo(
    () =>
      geometry.corridors.map((c) => {
        // the child node's team travelled this corridor to reach the junction
        // where it plays next (or was knocked out), so its road extends all
        // the way to that meeting point in the team's own color
        const childTeam = effectiveNodeTeams.get(c.childId)
        return {
          ...c,
          traversed: Boolean(childTeam),
          teamColor:
            (childTeam && getTeamColor(childTeam.code)) ||
            "var(--color-primary)",
          active: Boolean(activeSet && activeSet.has(c.childId)),
        }
      }),
    [geometry, effectiveNodeTeams, activeSet]
  )

  const renderMode: "loading" | "error" | "content" = loading
    ? "loading"
    : error && !hasData
      ? "error"
      : "content"

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("routes.bracket")}
          </h1>
          <p className="max-w-[36rem] text-sm text-muted-foreground">
            {t("pages.bracket.description")}
          </p>
          <p className="max-w-[36rem] text-xs text-muted-foreground/80">
            Lit corridors show how far each team has come. Hover or focus a flag
            to spotlight one team's run — or simulate the knockout and click
            flags to send your picks through.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            onClick={handleSimulate}
            disabled={rounds.length === 0}
          >
            <Play /> {simulating ? "Restart simulation" : "Simulate knockout"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw /> Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 md:gap-6 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-4 rounded-3xl border border-foreground/10 bg-card/70 p-4 md:p-6">
          {renderMode === "loading" ? (
            <Skeleton className="aspect-square w-full max-w-[860px] rounded-[20px]" />
          ) : renderMode === "error" ? (
            <div className="w-full p-6 text-sm text-destructive">
              {error ?? "Unable to load bracket data."}
            </div>
          ) : rounds.length === 0 ? (
            <div className="w-full p-6 text-sm text-muted-foreground">
              No knockout matches available yet.
            </div>
          ) : (
            <>
              <div className="[container-type:size] relative aspect-square w-full max-w-[860px]">
                <svg
                  viewBox="0 0 1000 1000"
                  className="pointer-events-none absolute inset-0 block h-full w-full"
                >
                  <rect
                    x="0"
                    y="0"
                    width="1000"
                    height="1000"
                    rx="20"
                    className="fill-card"
                  />
                  {visualCorridors.map((c) => {
                    const showProgress = !activeSet && c.traversed
                    return (
                      <polyline
                        key={c.childId}
                        points={c.points}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke={
                          c.active || showProgress
                            ? c.teamColor
                            : "var(--color-border)"
                        }
                        strokeWidth={c.active || showProgress ? 10 : 8}
                        opacity={
                          activeSet
                            ? c.active
                              ? 1
                              : 0.12
                            : showProgress
                              ? 0.85
                              : 0.3
                        }
                        className="transition-[stroke,stroke-width,opacity] duration-300 ease-in-out"
                      />
                    )
                  })}
                  <path
                    d={geometry.wallsD}
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="square"
                    className="stroke-foreground/40"
                  />
                </svg>

                {visualMarkers.map((m) => (
                  <div
                    key={`marker-${m.id}`}
                    title={m.title}
                    className="absolute flex items-center justify-center rounded-full bg-[#e9b949] font-bold text-[#211d16] transition-opacity duration-300 ease-in-out"
                    style={{
                      left: `${m.left}%`,
                      top: `${m.top}%`,
                      width: `${m.size}cqmin`,
                      height: `${m.size}cqmin`,
                      transform: "translate(-50%, -50%)",
                      fontSize: "1.05cqmin",
                      letterSpacing: "0.02em",
                      opacity: m.dim ? 0.25 : 1,
                      boxShadow: "0 0 0 3px var(--color-card)",
                    }}
                  >
                    {m.label}
                  </div>
                ))}

                {visualFlags.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    title={simulating ? `Advance ${n.team.name}` : n.team.name}
                    aria-label={
                      simulating ? `Advance ${n.team.name}` : n.team.name
                    }
                    aria-pressed={simulating ? undefined : pinnedId === n.id}
                    disabled={celebrating}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onFocus={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onBlur={() => setHoveredId(null)}
                    onClick={() =>
                      simulating
                        ? advanceTeam(n.id)
                        : setPinnedId((prev) => (prev === n.id ? null : n.id))
                    }
                    className={cn(
                      "absolute rounded-full border border-border bg-card p-0 transition-[opacity,border-color,border-width] duration-300 ease-in-out disabled:cursor-default"
                    )}
                    style={{
                      left: `${n.left}%`,
                      top: `${n.top}%`,
                      width: `${n.size}cqmin`,
                      height: `${n.size}cqmin`,
                      transform: "translate(-50%, -50%)",
                      opacity: n.dim ? 0.25 : 1,
                      borderWidth: n.active ? 2 : 1,
                      borderColor: n.active ? activeColor : undefined,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                    }}
                  >
                    <TeamFlagImage
                      team={n.team}
                      width={40}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </button>
                ))}

                <div
                  title="Final"
                  className="absolute flex flex-col items-center justify-center gap-[0.4cqmin] rounded-full border-2 border-[#e9b949] bg-card"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${TROPHY_SIZE_CQMIN}cqmin`,
                    height: `${TROPHY_SIZE_CQMIN}cqmin`,
                    transform: "translate(-50%, -50%)",
                    boxShadow: celebrating
                      ? `0 0 0 4px var(--color-card), 0 0 30px ${activeColor}`
                      : "0 0 0 4px var(--color-card)",
                    animation: celebrating
                      ? "maze-champion-pulse 1.25s ease-in-out infinite"
                      : undefined,
                  }}
                >
                  <img
                    src={worldCupTrophyUrl}
                    alt="World Cup trophy"
                    className="block h-[62%] w-auto"
                  />
                  {effectiveChampion ? (
                    <TeamFlagImage
                      team={effectiveChampion}
                      width={40}
                      className="h-[2.25cqmin] w-[3cqmin] rounded-[2px] border border-black/30 object-cover"
                    />
                  ) : null}
                </div>

                {celebrating &&
                  confetti.map((p) => (
                    <div
                      key={p.id}
                      className="pointer-events-none absolute top-[-24px] rounded-[1px]"
                      style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        animation: `maze-confetti-fall ${p.dur}s linear ${p.delay}s forwards`,
                      }}
                    />
                  ))}
              </div>

              <div className="flex min-h-[34px] flex-wrap items-center justify-center gap-2.5 text-xs text-muted-foreground">
                {celebrating && effectiveChampion ? (
                  <div
                    className="flex items-center gap-3"
                    style={{ animation: "maze-banner-in 0.5s ease both" }}
                  >
                    <TeamFlagImage
                      team={effectiveChampion}
                      width={80}
                      className="h-[25px] w-[34px] rounded border border-black/20 object-cover"
                    />
                    <span className="text-[11px] font-semibold tracking-[0.3em] uppercase">
                      World Champions
                    </span>
                    <span className="text-lg font-bold text-foreground sm:text-2xl">
                      {effectiveChampion.name}
                    </span>
                  </div>
                ) : activeTeam ? (
                  <>
                    <span
                      className="text-sm font-bold"
                      style={{ color: activeColor }}
                    >
                      {activeTeam.name}
                    </span>
                    <span>— tournament run so far</span>
                  </>
                ) : simulating ? (
                  <span>
                    Pick your winners — click a flag to advance it through the
                    maze.
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      Round of 32
                    </span>
                    <span>→</span>
                    <span>16</span>
                    <span>→</span>
                    <span>Quarters</span>
                    <span>→</span>
                    <span>Semis</span>
                    <span>→</span>
                    <span>Final</span>
                    <span>→</span>
                    <span className="font-bold text-primary">Trophy</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="w-full shrink-0 rounded-3xl border border-foreground/10 bg-card/70 p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)] lg:w-80 lg:overflow-y-auto">
          <h2 className="text-sm font-semibold tracking-tight">
            Progression timeline
          </h2>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
            Round by round: who went through, who went home, and which ties
            needed penalties.
          </p>
          {renderMode === "loading" ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : (
            <BracketTimeline rounds={rounds} />
          )}
        </aside>
      </div>
    </div>
  )
}
