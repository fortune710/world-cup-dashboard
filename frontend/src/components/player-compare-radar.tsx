"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { ArrowUpDownIcon } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type PlayerRow } from "@/pages/players-page"
import { positionsToRadarRole, type Classification, type RadarRole } from "@/lib/players/player-mapping"
import { computeRadarData } from "@/lib/players/radar-calculations"
import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"
import { cn } from "@/lib/utils"
import { useInViewAnimation } from "@/hooks/use-in-view-animation"

const COMPARE_COLORS = {
  primary: "var(--primary)",
  compare: "var(--compare-player)",
} as const

const COMPARE_PLAYER_ACCENT_CLASS =
  "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"

const PROFILE_ROW_STAGGER_MS = 65
const PROFILE_ROW_DURATION_MS = 450
const TOURNAMENT_BAR_STAGGER_MS = 80
const TOURNAMENT_BAR_DURATION_MS = 1200

function useCompareEnterAnimation(resetKey: string | number) {
  const reduceMotion = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  )
  const [active, setActive] = React.useState(reduceMotion)

  React.useEffect(() => {
    if (reduceMotion) {
      setActive(true)
      return
    }

    setActive(false)
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setActive(true))
    })

    return () => cancelAnimationFrame(frame)
  }, [resetKey, reduceMotion])

  return { active, reduceMotion }
}

function formatMarketValue(value: number | null | undefined): string {
  if (value == null || value === 0) return "—"
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`
  return `€${value.toLocaleString()}`
}

function formatProfileValue(value: string | number | null | undefined, suffix = ""): string {
  if (value == null || value === "") return "—"
  return `${value}${suffix}`
}

function normalizeAbsolute(rawValue: number | null, key: string): number {
  if (rawValue === null || rawValue === undefined) return 0

  let pct = 0
  if (key.endsWith("_pct") || key === "pass_acc" || key === "long_ball_acc") {
    pct = rawValue
  } else if (key === "penalty_save_r" || key === "shot_acc" || key === "conversion") {
    pct = rawValue * 100
  } else if (key === "rating") {
    pct = ((rawValue - 6.0) / 3.0) * 100
  } else if (key === "tack_int_p90") {
    pct = (rawValue / 8.0) * 100
  } else if (key === "final3_p90") {
    pct = (rawValue / 15.0) * 100
  } else if (
    key === "goals_p90" ||
    key === "xg_p90" ||
    key === "goals_prevented" ||
    key === "goal_contrib_p90"
  ) {
    pct = (rawValue / 1.5) * 100
  } else if (key === "assists_p90" || key === "xa_p90" || key === "clean_sheets") {
    pct = (rawValue / 1.0) * 100
  } else {
    pct = (rawValue / 5.0) * 100
  }

  return Math.min(100, Math.max(0, pct))
}

function resolvePlayerRole(player: PlayerRow): RadarRole {
  return (
    player.radarRole ||
    positionsToRadarRole(player.positions, player.classification as Classification) ||
    "ST"
  )
}

function buildCompareChartData(primaryPlayer: PlayerRow, comparePlayer: PlayerRow) {
  const role = resolvePlayerRole(primaryPlayer)
  const primaryRadar = computeRadarData(primaryPlayer.statistics!, role)
  const compareRadar = computeRadarData(comparePlayer.statistics!, resolvePlayerRole(comparePlayer))
  const compareByKey = new Map(compareRadar.spokes.map((spoke) => [spoke.key, spoke]))

  return primaryRadar.spokes.map((spoke) => {
    const compareSpoke = compareByKey.get(spoke.key)
    return {
      subject: spoke.label,
      key: spoke.key,
      primaryNormalized: normalizeAbsolute(spoke.rawValue, spoke.key),
      compareNormalized: normalizeAbsolute(compareSpoke?.rawValue ?? null, spoke.key),
      primaryRaw: spoke.rawValue,
      compareRaw: compareSpoke?.rawValue ?? null,
      fullMark: 100,
    }
  })
}

function PlayerCompareSummary({
  player,
  accentClass,
  onSwitchCompare,
}: {
  player: PlayerRow
  accentClass: string
  onSwitchCompare?: () => void
}) {
  const { t } = useTranslation()
  const initials = player.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
  const flagUrl = getTeamFlagUrl({ idCountry: player.country, teamName: "" }, 40)

  return (
    <div className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4">
      <Avatar className="size-12 shrink-0 overflow-hidden rounded-full border border-border/50">
        <AvatarImage src={player.avatar} alt={player.name} className="object-cover" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className={`font-semibold ${accentClass}`}>
              {player.position}
            </Badge>
            <h2 className="truncate text-lg font-semibold tracking-tight">{player.name}</h2>
          </div>
          {onSwitchCompare ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={onSwitchCompare}
                  aria-label={t("playerCompare.switchPlayer", { defaultValue: "Switch compare player" })}
                >
                  <ArrowUpDownIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("playerCompare.switchPlayer", { defaultValue: "Switch compare player" })}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Avatar className="size-5 shrink-0 overflow-hidden rounded-xs border border-border/50">
            <AvatarImage src={flagUrl} alt={player.country} className="object-cover" />
            <AvatarFallback>{player.country}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{player.country}</span>
          <span>· {player.federation}</span>
          <span>· Group {player.group}</span>
        </div>
        <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{player.rating.toFixed(2)}</span> rating
          </span>
          <span>
            <span className="font-semibold text-foreground">{player.goals}</span> goals
          </span>
          <span>
            <span className="font-semibold text-foreground">{player.assists}</span> assists
          </span>
          <span>
            <span className="font-semibold text-foreground">{player.gamesPlayed}</span> apps
          </span>
        </div>
      </div>
    </div>
  )
}

export function PlayerCompareSummaries({
  primaryPlayer,
  comparePlayer,
  onSwitchComparePlayer,
}: {
  primaryPlayer: PlayerRow
  comparePlayer: PlayerRow
  onSwitchComparePlayer?: () => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <PlayerCompareSummary
        player={primaryPlayer}
        accentClass="border-primary/50 bg-primary/10 text-primary"
      />
      <PlayerCompareSummary
        player={comparePlayer}
        accentClass={COMPARE_PLAYER_ACCENT_CLASS}
        onSwitchCompare={onSwitchComparePlayer}
      />
    </div>
  )
}

interface ProfileRowData {
  label: string
  primaryValue: string
  compareValue: string
}

interface ProfileRowProps extends ProfileRowData {
  index: number
  animate: boolean
  reduceMotion: boolean
}

function ProfileRow({
  label,
  primaryValue,
  compareValue,
  index,
  animate,
  reduceMotion,
}: ProfileRowProps) {
  const delay = reduceMotion ? 0 : index * PROFILE_ROW_STAGGER_MS
  const duration = reduceMotion ? 0 : PROFILE_ROW_DURATION_MS

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 border-b border-border/50 py-2.5 text-sm last:border-b-0"
      style={
        reduceMotion
          ? undefined
          : {
              opacity: animate ? 1 : 0,
              transform: animate ? "translateY(0)" : "translateY(-10px)",
              transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
            }
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-end font-medium tabular-nums" style={{ color: COMPARE_COLORS.primary }}>
        {primaryValue}
      </span>
      <span className="truncate text-end font-medium tabular-nums" style={{ color: COMPARE_COLORS.compare }}>
        {compareValue}
      </span>
    </div>
  )
}

export function PlayerProfileCompare({
  primaryPlayer,
  comparePlayer,
  animationKey,
}: {
  primaryPlayer: PlayerRow
  comparePlayer: PlayerRow
  animationKey: string
}) {
  const { t } = useTranslation()
  const { active, reduceMotion } = useCompareEnterAnimation(animationKey)

  const rows: ProfileRowData[] = [
    {
      label: t("playerCompare.profileAge", { defaultValue: "Age" }),
      primaryValue: formatProfileValue(primaryPlayer.age),
      compareValue: formatProfileValue(comparePlayer.age),
    },
    {
      label: t("playerCompare.profileHeight", { defaultValue: "Height" }),
      primaryValue: formatProfileValue(primaryPlayer.heightCm, " cm"),
      compareValue: formatProfileValue(comparePlayer.heightCm, " cm"),
    },
    {
      label: t("playerCompare.profileWeight", { defaultValue: "Weight" }),
      primaryValue: formatProfileValue(primaryPlayer.weightKg, " kg"),
      compareValue: formatProfileValue(comparePlayer.weightKg, " kg"),
    },
    {
      label: t("playerCompare.profileFoot", { defaultValue: "Preferred foot" }),
      primaryValue: formatProfileValue(primaryPlayer.foot),
      compareValue: formatProfileValue(comparePlayer.foot),
    },
    {
      label: t("playerCompare.profileClub", { defaultValue: "Club" }),
      primaryValue: formatProfileValue(primaryPlayer.clubName),
      compareValue: formatProfileValue(comparePlayer.clubName),
    },
    {
      label: t("playerCompare.profileMarketValue", { defaultValue: "Market value" }),
      primaryValue: formatMarketValue(primaryPlayer.marketValue),
      compareValue: formatMarketValue(comparePlayer.marketValue),
    },
    {
      label: t("playerCompare.profilePositions", { defaultValue: "Positions" }),
      primaryValue: formatProfileValue(primaryPlayer.positions),
      compareValue: formatProfileValue(comparePlayer.positions),
    },
  ]

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold tracking-tight">
          {t("playerCompare.profileTitle", { defaultValue: "Player profile" })}
        </CardTitle>
        <CardDescription>
          {t("playerCompare.profileDescription", { defaultValue: "Physical and background details" })}
        </CardDescription>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{t("playerCompare.field", { defaultValue: "Field" })}</span>
          <span className="truncate text-end">{primaryPlayer.name.split(" ").pop()}</span>
          <span className="truncate text-end">{comparePlayer.name.split(" ").pop()}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {rows.map((row, index) => (
          <ProfileRow
            key={row.label}
            {...row}
            index={index}
            animate={active}
            reduceMotion={reduceMotion}
          />
        ))}
      </CardContent>
    </Card>
  )
}

interface TournamentStatData {
  label: string
  primaryValue: number
  compareValue: number
  format?: (value: number) => string
}

interface TournamentStatBarProps extends TournamentStatData {
  index: number
  animate: boolean
  reduceMotion: boolean
}

function TournamentStatBar({
  label,
  primaryValue,
  compareValue,
  format = (v) => String(v),
  index,
  animate,
  reduceMotion,
}: TournamentStatBarProps) {
  const total = Math.max(primaryValue, compareValue, 0.001)
  const primaryPct = (primaryValue / total) * 100
  const comparePct = (compareValue / total) * 100
  const primaryWins = primaryValue > compareValue
  const compareWins = compareValue > primaryValue
  const delay = reduceMotion ? 0 : index * TOURNAMENT_BAR_STAGGER_MS
  const duration = reduceMotion ? 0 : TOURNAMENT_BAR_DURATION_MS
  const barTransition = reduceMotion
    ? undefined
    : `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center justify-between gap-2 text-xs"
        style={
          reduceMotion
            ? undefined
            : {
                opacity: animate ? 1 : 0,
                transform: animate ? "translateY(0)" : "translateY(6px)",
                transition: `opacity 350ms ease-out ${delay}ms, transform 350ms ease-out ${delay}ms`,
              }
        }
      >
        <span className="font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2 tabular-nums">
          <span
            className={cn("font-semibold", primaryWins && "text-foreground")}
            style={{ color: primaryWins ? COMPARE_COLORS.primary : undefined }}
          >
            {format(primaryValue)}
          </span>
          <span className="text-muted-foreground">vs</span>
          <span
            className={cn("font-semibold", compareWins && "text-foreground")}
            style={{ color: compareWins ? COMPARE_COLORS.compare : undefined }}
          >
            {format(compareValue)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{
              width: animate ? `${primaryPct}%` : "0%",
              backgroundColor: COMPARE_COLORS.primary,
              transition: barTransition,
            }}
          />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{
              width: animate ? `${comparePct}%` : "0%",
              backgroundColor: COMPARE_COLORS.compare,
              transition: barTransition,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function PlayerTournamentCompare({
  primaryPlayer,
  comparePlayer,
}: {
  primaryPlayer: PlayerRow
  comparePlayer: PlayerRow
}) {
  const { t } = useTranslation()
  const { ref: inViewRef, active, reduceMotion } = useInViewAnimation<HTMLDivElement>()
  const isGoalkeeper =
    primaryPlayer.position === "GK" || comparePlayer.position === "GK"

  const stats: TournamentStatData[] = [
    {
      label: t("playerCompare.tournamentRating", { defaultValue: "Rating" }),
      primaryValue: primaryPlayer.rating,
      compareValue: comparePlayer.rating,
      format: (v) => v.toFixed(2),
    },
    {
      label: t("playerCompare.tournamentGoals", { defaultValue: "Goals" }),
      primaryValue: primaryPlayer.goals,
      compareValue: comparePlayer.goals,
    },
    {
      label: t("playerCompare.tournamentAssists", { defaultValue: "Assists" }),
      primaryValue: primaryPlayer.assists,
      compareValue: comparePlayer.assists,
    },
    {
      label: t("playerCompare.tournamentXg", { defaultValue: "Expected goals (xG)" }),
      primaryValue: primaryPlayer.xg,
      compareValue: comparePlayer.xg,
      format: (v) => v.toFixed(2),
    },
    {
      label: t("playerCompare.tournamentMinutes", { defaultValue: "Minutes" }),
      primaryValue: primaryPlayer.minutesPlayed,
      compareValue: comparePlayer.minutesPlayed,
    },
    {
      label: t("playerCompare.tournamentApps", { defaultValue: "Appearances" }),
      primaryValue: primaryPlayer.gamesPlayed,
      compareValue: comparePlayer.gamesPlayed,
    },
  ]

  if (isGoalkeeper) {
    stats.splice(3, 0, {
      label: t("playerCompare.tournamentSaves", { defaultValue: "Saves" }),
      primaryValue: primaryPlayer.saves ?? 0,
      compareValue: comparePlayer.saves ?? 0,
    })
    stats.splice(4, 0, {
      label: t("playerCompare.tournamentCleanSheets", { defaultValue: "Clean sheets" }),
      primaryValue: primaryPlayer.cleanSheets ?? 0,
      compareValue: comparePlayer.cleanSheets ?? 0,
    })
  }

  return (
    <div ref={inViewRef}>
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold tracking-tight">
          {t("playerCompare.tournamentTitle", { defaultValue: "Tournament output" })}
        </CardTitle>
        <CardDescription>
          {t("playerCompare.tournamentDescription", {
            defaultValue: "Direct stat comparison across the World Cup",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pb-4">
        {stats.map((stat, index) => (
          <TournamentStatBar
            key={stat.label}
            {...stat}
            index={index}
            animate={active}
            reduceMotion={reduceMotion}
          />
        ))}
      </CardContent>
    </Card>
    </div>
  )
}

interface ChartRadarCompareProps {
  primaryPlayer: PlayerRow
  comparePlayer: PlayerRow
}

export function ChartRadarCompare({ primaryPlayer, comparePlayer }: ChartRadarCompareProps) {
  const { t } = useTranslation()
  const { ref: inViewRef, active: inView } = useInViewAnimation<HTMLDivElement>()

  const chartConfig = React.useMemo(
    () =>
      ({
        primaryNormalized: {
          label: primaryPlayer.name,
          color: COMPARE_COLORS.primary,
        },
        compareNormalized: {
          label: comparePlayer.name,
          color: COMPARE_COLORS.compare,
        },
      }) satisfies ChartConfig,
    [primaryPlayer.name, comparePlayer.name]
  )

  const chartData = React.useMemo(() => {
    if (!primaryPlayer.statistics || !comparePlayer.statistics) return []
    return buildCompareChartData(primaryPlayer, comparePlayer)
  }, [primaryPlayer, comparePlayer])

  const positionNameMap: Record<RadarRole, string> = {
    GK: "Goalkeeper",
    CB: "Centre-back",
    FB: "Full-back / Wing-back",
    DM: "Defensive Midfielder",
    CM: "Central Midfielder",
    AMW: "Winger / Attacking Midfielder",
    ST: "Striker / Centre-forward",
  }

  const role = resolvePlayerRole(primaryPlayer)

  return (
    <div ref={inViewRef}>
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold tracking-tight">
          {t("playerCompare.radarTitle", { defaultValue: "Head-to-head profile" })}
        </CardTitle>
        <CardDescription>
          {t("playerCompare.radarDescription", {
            defaultValue: "Normalized per-90 metrics on the {{position}} template",
            position: positionNameMap[role],
          })}
        </CardDescription>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: COMPARE_COLORS.primary }}
            />
            <span className="truncate font-medium">{primaryPlayer.name.split(" ").pop()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: COMPARE_COLORS.compare }}
            />
            <span className="truncate font-medium">{comparePlayer.name.split(" ").pop()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-[320px] flex-1 flex-col items-center justify-center pb-4">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("playerCompare.noStats", { defaultValue: "Stats unavailable for comparison." })}
          </p>
        ) : !inView ? (
          <div className="mx-auto aspect-square w-full max-w-[300px]" />
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[300px]">
            <RadarChart
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius="68%"
              margin={{ top: 8, right: 28, bottom: 8, left: 28 }}
            >
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload as (typeof chartData)[number]
                  return (
                    <div className="rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-md">
                      <div className="mb-1 font-semibold">{data.subject}</div>
                      <div style={{ color: COMPARE_COLORS.primary }}>
                        {primaryPlayer.name}: {data.primaryRaw ?? "N/A"}
                      </div>
                      <div style={{ color: COMPARE_COLORS.compare }}>
                        {comparePlayer.name}: {data.compareRaw ?? "N/A"}
                      </div>
                    </div>
                  )
                }}
              />
              <PolarGrid gridType="circle" className="stroke-border/40" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--color-foreground)", fontSize: 8, fontWeight: 500 }}
              />
              <Radar
                name={primaryPlayer.name}
                dataKey="primaryNormalized"
                stroke={COMPARE_COLORS.primary}
                fill={COMPARE_COLORS.primary}
                fillOpacity={0.2}
                strokeWidth={2.5}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
                dot={{
                  r: 3,
                  fill: COMPARE_COLORS.primary,
                  stroke: "var(--background)",
                  strokeWidth: 1.5,
                }}
              />
              <Radar
                name={comparePlayer.name}
                dataKey="compareNormalized"
                stroke={COMPARE_COLORS.compare}
                fill={COMPARE_COLORS.compare}
                fillOpacity={0.15}
                strokeWidth={2.5}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
                dot={{
                  r: 3,
                  fill: COMPARE_COLORS.compare,
                  stroke: "var(--background)",
                  strokeWidth: 1.5,
                }}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
    </div>
  )
}

export function PlayerCompareAnalysisGrid({
  primaryPlayer,
  comparePlayer,
}: {
  primaryPlayer: PlayerRow
  comparePlayer: PlayerRow
}) {
  const animationKey = `${primaryPlayer.id}-${comparePlayer.id}`

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <PlayerProfileCompare
        primaryPlayer={primaryPlayer}
        comparePlayer={comparePlayer}
        animationKey={animationKey}
      />
      <ChartRadarCompare primaryPlayer={primaryPlayer} comparePlayer={comparePlayer} />
      <PlayerTournamentCompare
        primaryPlayer={primaryPlayer}
        comparePlayer={comparePlayer}
      />
    </div>
  )
}
