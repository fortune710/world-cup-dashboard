"use client"
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import * as React from "react"
import { useTranslation } from "react-i18next"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { Star, Info } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { type PlayerRow, getPlayerMatchHistory } from "@/pages/players-page"
import { usePlayers } from "@/hooks/use-players"

interface MetricConfig {
    key: string
    label: string
    color: string
    colorClass: string
}

type DetailedPos = "GK" | "CB" | "FB" | "CM" | "AMW" | "ST"

const POSITION_METRICS: Record<DetailedPos, MetricConfig[]> = {
    GK: [
        { key: "shotStopping", label: "Shot Stop %", color: "var(--chart-1)", colorClass: "text-purple-500" },
        { key: "goalsPrevented", label: "Goals Prev. / 90", color: "var(--chart-2)", colorClass: "text-purple-400" },
        { key: "longBallAcc", label: "Long Ball Acc. %", color: "var(--chart-3)", colorClass: "text-indigo-500" },
        { key: "passSafety", label: "Pass Safety %", color: "var(--chart-4)", colorClass: "text-indigo-400" },
        { key: "highClaims", label: "High Claims %", color: "var(--chart-5)", colorClass: "text-blue-500" },
        { key: "sweeperDist", label: "Sweeper Dist. (m)", color: "var(--chart-1)", colorClass: "text-cyan-500" },
        { key: "positioningAcc", label: "Positioning Acc. (m)", color: "var(--chart-2)", colorClass: "text-cyan-400" },
        { key: "gkOBV", label: "GK OBV / 90", color: "var(--chart-3)", colorClass: "text-emerald-500" }
    ],
    CB: [
        { key: "aerialWin", label: "Aerial Win %", color: "var(--chart-1)", colorClass: "text-emerald-500" },
        { key: "aerialWins", label: "PAdj Aerial Wins", color: "var(--chart-2)", colorClass: "text-emerald-400" },
        { key: "tacklesInterceptions", label: "PAdj Tkl+Int / 90", color: "var(--chart-3)", colorClass: "text-teal-500" },
        { key: "tackleDribbledPast", label: "Tackle Win %", color: "var(--chart-4)", colorClass: "text-teal-400" },
        { key: "blocks", label: "Blocks / Shot", color: "var(--chart-5)", colorClass: "text-blue-500" },
        { key: "defensiveOBV", label: "Def. Action OBV", color: "var(--chart-1)", colorClass: "text-cyan-500" },
        { key: "passOBV", label: "Pass OBV / 90", color: "var(--chart-2)", colorClass: "text-indigo-500" },
        { key: "pressuredPass", label: "Pressured Pass % Δ", color: "var(--chart-3)", colorClass: "text-violet-500" }
    ],
    FB: [
        { key: "xa", label: "xA / 90", color: "var(--chart-1)", colorClass: "text-rose-500" },
        { key: "crosses", label: "Acc. Crosses / 90", color: "var(--chart-2)", colorClass: "text-rose-400" },
        { key: "deepProg", label: "Deep Prog. / 90", color: "var(--chart-3)", colorClass: "text-orange-500" },
        { key: "progCarries", label: "Prog. Carries / 90", color: "var(--chart-4)", colorClass: "text-amber-500" },
        { key: "passOBV", label: "Pass OBV / 90", color: "var(--chart-5)", colorClass: "text-emerald-500" },
        { key: "tacklesInterceptions", label: "PAdj Tkl+Int / 90", color: "var(--chart-1)", colorClass: "text-teal-500" },
        { key: "tackleDribbledPast", label: "Tackle Win %", color: "var(--chart-2)", colorClass: "text-blue-500" },
        { key: "defensiveOBV", label: "Def. Action OBV", color: "var(--chart-3)", colorClass: "text-indigo-500" }
    ],
    CM: [
        { key: "totalOBV", label: "Total OBV / 90", color: "var(--chart-1)", colorClass: "text-emerald-500" },
        { key: "deepProg", label: "Deep Prog. / 90", color: "var(--chart-2)", colorClass: "text-teal-500" },
        { key: "progCarries", label: "Prog. Carries / 90", color: "var(--chart-3)", colorClass: "text-blue-500" },
        { key: "openPlayXA", label: "Open-Play xA / 90", color: "var(--chart-4)", colorClass: "text-indigo-500" },
        { key: "keyPasses", label: "Key Passes / 90", color: "var(--chart-5)", colorClass: "text-violet-500" },
        { key: "pressures", label: "PAdj Pressures / 90", color: "var(--chart-1)", colorClass: "text-pink-500" },
        { key: "tacklesInterceptions", label: "PAdj Tkl+Int / 90", color: "var(--chart-2)", colorClass: "text-orange-500" },
        { key: "defensiveOBV", label: "Def. Action OBV", color: "var(--chart-3)", colorClass: "text-amber-500" }
    ],
    AMW: [
        { key: "npxg", label: "npxG / 90", color: "var(--chart-1)", colorClass: "text-rose-500" },
        { key: "shotOBV", label: "Shot OBV / 90", color: "var(--chart-2)", colorClass: "text-rose-400" },
        { key: "xgShot", label: "xG / Shot", color: "var(--chart-3)", colorClass: "text-orange-500" },
        { key: "openPlayXA", label: "Open-Play xA / 90", color: "var(--chart-4)", colorClass: "text-amber-500" },
        { key: "boxTouches", label: "Box Touches / 90", color: "var(--chart-5)", colorClass: "text-yellow-500" },
        { key: "dribbles", label: "Dribbles / 90", color: "var(--chart-1)", colorClass: "text-emerald-500" },
        { key: "touchesOppHalf", label: "Opp. Half Touches", color: "var(--chart-2)", colorClass: "text-blue-500" },
        { key: "pressureRegains", label: "Press Regains / 90", color: "var(--chart-3)", colorClass: "text-indigo-500" }
    ],
    ST: [
        { key: "npxg", label: "npxG / 90", color: "var(--chart-1)", colorClass: "text-rose-500" },
        { key: "shotOBV", label: "Shot OBV / 90", color: "var(--chart-2)", colorClass: "text-rose-400" },
        { key: "xgShot", label: "xG / Shot", color: "var(--chart-3)", colorClass: "text-orange-500" },
        { key: "boxTouches", label: "Box Touches / 90", color: "var(--chart-4)", colorClass: "text-amber-500" },
        { key: "shotTouch", label: "Shot Touch %", color: "var(--chart-5)", colorClass: "text-yellow-500" },
        { key: "xa", label: "xA / 90", color: "var(--chart-1)", colorClass: "text-emerald-500" },
        { key: "pressureRegains", label: "Press Regains / 90", color: "var(--chart-2)", colorClass: "text-blue-500" },
        { key: "aerialWins", label: "Aerial Wins / 90", color: "var(--chart-3)", colorClass: "text-indigo-500" }
    ]
}

const getDetailedPosition = (player: PlayerRow): DetailedPos => {
    if (player.position === "GK") return "GK"
    if (player.position === "DEF") {
        if (player.name.includes("Trent") || player.name.includes("Alexander")) return "FB"
        return "CB"
    }
    if (player.position === "MID") {
        return "CM"
    }
    if (player.position === "FWD") {
        if (player.name.includes("Haaland") || player.name.includes("Ronaldo") || player.name.includes("Lautaro") || player.name.includes("Mart%C3%ADnez") || player.name.includes("Martínez")) return "ST"
        return "AMW"
    }
    return "ST"
}

const getPlayerStatValue = (p: PlayerRow, key: string): number => {
    const minutes = p.minutesPlayed || 1
    const games = p.gamesPlayed || 1
    const history = getPlayerMatchHistory(p)
    const goalsPer90 = (p.goals / minutes) * 90
    const assistsPer90 = (p.assists / minutes) * 90
    const xgPer90 = (p.xg / minutes) * 90
    const xaPer90 = (p.xa / minutes) * 90

    const seed = p.id
    const random = (s: number) => {
        const x = Math.sin(s) * 10000
        return x - Math.floor(x)
    }

    switch (key) {
        case "rating":
            return p.rating
        case "goals":
            return goalsPer90
        case "assists":
            return assistsPer90
        case "xg":
            return xgPer90
        case "xa":
            return xaPer90
        case "apps":
            return p.gamesPlayed
        case "minutes":
            return p.minutesPlayed / games

        // GK Specific
        case "shotStopping":
            return Math.max(60, Math.min(95, 70 + (p.rating - 8.0) * 10 + random(seed + 1) * 5))
        case "goalsPrevented":
            return Math.max(-0.5, (p.rating - 8.2) * 0.5 + random(seed + 2) * 0.15)
        case "longBallAcc":
            return Math.max(50, Math.min(95, 65 + (p.rating - 8.0) * 8 + random(seed + 3) * 6))
        case "passSafety": {
            const passDanger = Math.max(5, Math.min(30, 15 - (p.rating - 8.0) * 4 + random(seed + 4) * 3))
            return 100 - passDanger
        }
        case "highClaims":
            return Math.max(60, Math.min(98, 75 + (p.rating - 8.0) * 7 + random(seed + 5) * 5))
        case "sweeperDist":
            return Math.max(8, Math.min(20, 12 + (p.rating - 8.0) * 3 + random(seed + 6) * 2))
        case "positioningAcc": {
            const positioningError = Math.max(0.4, Math.min(2.0, 1.2 - (p.rating - 8.0) * 0.2 + random(seed + 7) * 0.1))
            return 3 - positioningError
        }
        case "gkOBV":
            return Math.max(-0.2, (p.rating - 8.0) * 0.12 + random(seed + 8) * 0.05)

        // CB Specific
        case "aerialWin":
            return Math.max(55, Math.min(92, 68 + (p.rating - 8.0) * 12 + random(seed + 1) * 5))
        case "aerialWins":
            if (getDetailedPosition(p) === "ST") {
                return Math.max(0.5, 1.8 + (p.rating - 8.0) * 1.5 + random(seed + 6) * 0.6)
            }
            return Math.max(1.2, 2.5 + (p.rating - 8.0) * 1.5 + random(seed + 2) * 0.5)
        case "tacklesInterceptions": {
            const tkl = history.reduce((acc, m) => acc + (m.tackles || 0), 0)
            const int = history.reduce((acc, m) => acc + (m.interceptions || 0), 0)
            return Math.max(2.0, ((tkl + int) / minutes) * 90)
        }
        case "tackleDribbledPast":
            return Math.max(50, Math.min(95, 70 + (p.rating - 8.0) * 10 + random(seed + 4) * 4))
        case "blocks":
            return Math.max(0.4, 0.8 + (p.rating - 8.0) * 0.4 + random(seed + 5) * 0.15)
        case "defensiveOBV":
            return Math.max(-0.1, (p.rating - 8.0) * 0.18 + random(seed + 6) * 0.05)
        case "passOBV":
            return Math.max(-0.05, 0.15 + (p.rating - 8.0) * 0.1 + random(seed + 7) * 0.04)
        case "pressuredPass":
            return Math.max(-6.0, Math.min(2.0, -1.5 + (p.rating - 8.0) * 1.5 + random(seed + 8) * 0.5))

        // FB Specific
        case "crosses":
            return Math.max(0.5, 1.8 + assistsPer90 * 2.5 + random(seed + 1) * 0.5)
        case "deepProg":
            return Math.max(2.0, 5.2 + assistsPer90 * 3.5 + random(seed + 2) * 1.0)
        case "progCarries":
            return Math.max(1.0, 3.0 + goalsPer90 * 2.5 + random(seed + 3) * 0.8)

        // CM Specific
        case "totalOBV":
            return Math.max(0.1, 0.35 + (p.rating - 8.0) * 0.15 + random(seed + 1) * 0.06)
        case "openPlayXA":
            return xaPer90 * 0.85
        case "keyPasses":
            return Math.max(0.6, 1.5 + assistsPer90 * 2.2 + random(seed + 4) * 0.4)
        case "pressures":
            return Math.max(10, 16.5 + (p.rating - 8.0) * 3.0 + random(seed + 5) * 2.0)

        // AMW Specific
        case "npxg":
            return xgPer90 * 0.9
        case "shotOBV":
            return Math.max(0.05, 0.28 + goalsPer90 * 0.15 + random(seed + 1) * 0.05)
        case "xgShot":
            return Math.max(0.05, Math.min(0.25, xgPer90 / Math.max(1, (3 + random(seed + 2) * 2))))
        case "boxTouches":
            return Math.max(2.0, 5.8 + goalsPer90 * 4.0 + random(seed + 3) * 1.5)
        case "dribbles":
            return Math.max(1.5, 4.2 + goalsPer90 * 2.5 + random(seed + 4) * 1.2)
        case "touchesOppHalf":
            return Math.max(20, 32 + (p.rating - 8.0) * 10 + random(seed + 5) * 5)
        case "pressureRegains":
            return Math.max(1.0, 2.8 + (p.rating - 8.0) * 0.8 + random(seed + 6) * 0.4)

        // ST Specific
        case "shotTouch":
            return Math.max(8, Math.min(40, 18 + goalsPer90 * 8 + random(seed + 4) * 4))

        case "contributions":
            return goalsPer90 + assistsPer90
        case "cleanSheets":
            return ((p.cleanSheets || 0) / games) * 100

        default:
            return 0
    }
}

const formatMetricValue = (key: string, val: number): string => {
    if (key === "rating") return val.toFixed(2)
    if (["shotStopping", "longBallAcc", "passSafety", "highClaims", "aerialWin", "tackleDribbledPast", "cleanSheets", "shotTouch"].includes(key)) {
        return `${val.toFixed(1)}%`
    }
    if (key === "pressuredPass") {
        return `${val > 0 ? "+" : ""}${val.toFixed(1)}%`
    }
    if (key === "sweeperDist") return `${val.toFixed(1)}m`
    if (key === "positioningAcc") return `${val.toFixed(2)}m`
    if (key === "apps") return `${val}`
    if (key === "minutes") return `${val.toFixed(0)}m`
    return val.toFixed(2)
}

const getPercentileTier = (percentile: number) => {
    if (percentile >= 90) {
        return {
            label: "Elite",
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
            barColor: "bg-emerald-500",
            glowClass: "shadow-[0_0_10px_rgba(16,185,129,0.3)]",
            hex: "#10b981",
        }
    }
    if (percentile >= 70) {
        return {
            label: "Above Avg",
            colorClass: "text-blue-500",
            bgClass: "bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400",
            barColor: "bg-blue-500",
            glowClass: "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
            hex: "#3b82f6",
        }
    }
    if (percentile >= 40) {
        return {
            label: "Average",
            colorClass: "text-amber-500",
            bgClass: "bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400",
            barColor: "bg-amber-500",
            glowClass: "shadow-[0_0_10px_rgba(245,158,11,0.3)]",
            hex: "#f59e0b",
        }
    }
    return {
        label: "Below Avg",
        colorClass: "text-rose-500",
        bgClass: "bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400",
        barColor: "bg-rose-500",
        glowClass: "shadow-[0_0_10px_rgba(244,63,94,0.3)]",
        hex: "#f43f5e",
    }
}

const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-md text-xs space-y-1.5 min-w-[145px]">
                <div className="font-bold border-b pb-1 mb-1 border-border/40 text-foreground">
                    {data.subject}
                </div>
                <div className="flex justify-between items-center gap-4">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <span className="size-2 rounded-full bg-primary" />
                        Player:
                    </span>
                    <span className="font-mono font-bold text-foreground">
                        {formatMetricValue(data.key, data.playerValue)}
                    </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <span className="size-2 rounded-full bg-muted-foreground/50" />
                        Peer Avg:
                    </span>
                    <span className="font-mono font-semibold text-muted-foreground">
                        {formatMetricValue(data.key, data.avgValue)}
                    </span>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-border/20 pt-1 mt-1 font-semibold">
                    <span className="text-muted-foreground">Percentile:</span>
                    <span className="text-emerald-500 font-mono">{data.percentile}th</span>
                </div>
            </div>
        )
    }
    return null
}

export function ChartRadarGridCircle({ player }: { player: PlayerRow }) {
    const { t } = useTranslation()
    const [selectedDimension, setSelectedDimension] = React.useState<string>("rating")
    const { players, loading, error } = usePlayers(100)

    const pos = React.useMemo(() => getDetailedPosition(player), [player])
    const metrics = React.useMemo(() => POSITION_METRICS[pos] || POSITION_METRICS.ST, [pos])

    React.useEffect(() => {
        if (metrics && metrics.length > 0) {
            setSelectedDimension(metrics[0].key)
        }
    }, [player?.id, metrics])

    const chartConfig = React.useMemo(() => ({
        playerNormalized: {
            label: player.name,
            color: "var(--primary)",
        },
        avgNormalized: {
            label: "Position Avg",
            color: "var(--muted-foreground)",
        },
    }) satisfies ChartConfig, [player.name])

    const positionPlayers = React.useMemo(() => {
        if (loading || error) return []
        return players.filter((p) => getDetailedPosition(p) === pos)
    }, [players, pos, loading, error])

    const chartData = React.useMemo(() => {
        /**
         * Compute a percentile rank for `value` within `sorted` (ascending).
         * Uses linear interpolation between adjacent ranks so it scales
         * smoothly from 3 peers to 3 000.
         *
         * Edge cases:
         *   n = 0  → 50          (no data, neutral)
         *   n = 1  → 50 if tied, else 0 or 100
         *   all tied → 50        (everyone equal)
         *   value ≤ min → 0
         *   value ≥ max → 100
         */
        const computePercentile = (value: number, sorted: number[]): number => {
            const n = sorted.length
            if (n === 0) return 50
            if (n === 1) {
                if (value === sorted[0]) return 50
                return value < sorted[0] ? 0 : 100
            }
            // All values identical
            if (sorted[0] === sorted[n - 1]) return 50

            // Clamp to bounds
            if (value <= sorted[0]) return 0
            if (value >= sorted[n - 1]) return 100

            // Find where `value` sits between sorted[i] and sorted[i+1]
            // then interpolate a fractional index and map to 0–100.
            let lo = 0
            let hi = n - 1
            while (lo < hi - 1) {
                const mid = Math.floor((lo + hi) / 2)
                if (sorted[mid] <= value) lo = mid
                else hi = mid
            }

            // `lo` is the largest index where sorted[lo] <= value
            // Interpolate between lo and hi
            const range = sorted[hi] - sorted[lo]
            const fraction = range > 0 ? (value - sorted[lo]) / range : 0
            const interpolatedIndex = lo + fraction

            // Map the index to a 0–100 percentile
            // With n items, index 0 → 0th percentile, index n-1 → 100th
            return Math.round((interpolatedIndex / (n - 1)) * 100)
        }

        if (loading || error) {
            return metrics.map((metric) => {
                const playerVal = getPlayerStatValue(player, metric.key)
                return {
                    subject: metric.label,
                    key: metric.key,
                    playerValue: playerVal,
                    avgValue: playerVal,
                    playerNormalized: 50,
                    avgNormalized: 50,
                    maxVal: playerVal,
                    minVal: playerVal,
                    percentile: 50,
                    colorClass: metric.colorClass,
                }
            })
        }

        return metrics.map((metric) => {
            const playerVal = getPlayerStatValue(player, metric.key)
            const peerVals = positionPlayers.length > 0
                ? positionPlayers.map((p) => getPlayerStatValue(p, metric.key))
                : [playerVal]
            const maxVal = Math.max(...peerVals)
            const minVal = Math.min(...peerVals)
            const sumVal = peerVals.reduce((a, b) => a + b, 0)
            const avgVal = sumVal / peerVals.length

            const sorted = [...peerVals].sort((a, b) => a - b)
            const percentile = computePercentile(playerVal, sorted)

            // Normalize using min-max scaling (avoid division by zero if max === min)
            const playerNormalized = maxVal !== minVal ? ((playerVal - minVal) / (maxVal - minVal)) * 100 : 50
            const avgNormalized = maxVal !== minVal ? ((avgVal - minVal) / (maxVal - minVal)) * 100 : 50

            return {
                subject: metric.label,
                key: metric.key,
                playerValue: playerVal,
                avgValue: avgVal,
                playerNormalized,
                avgNormalized,
                maxVal,
                minVal,
                percentile,
                colorClass: metric.colorClass,
            }
        })
    }, [player, metrics, positionPlayers, loading, error])

    const activeMetricData = React.useMemo(() => {
        return chartData.find((d) => d.key === selectedDimension) || chartData[0]
    }, [chartData, selectedDimension])

    const activeTier = React.useMemo(() => {
        return getPercentileTier(activeMetricData.percentile)
    }, [activeMetricData.percentile])

    const positionNameMap: Record<DetailedPos, string> = {
        GK: "Goalkeeper",
        CB: "Centre-back",
        FB: "Full-back / Wing-back",
        CM: "Central Midfielder",
        AMW: "Winger / Attacking Midfielder",
        ST: "Striker / Centre-forward"
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold tracking-tight">
                    {t("playerDetailsPage.positionProfile", { defaultValue: "Position Profile" })}
                </CardTitle>
                <CardDescription>
                    {t("playerDetailsPage.comparingPlayers", {
                        playerName: player.name,
                        position: positionNameMap[pos],
                        defaultValue: "Comparing {{playerName}} to {{position}}s (Per 90 mins)"
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-0 flex-1 flex flex-col justify-between">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground min-h-[300px]">
                        {t("playerDetailsPage.loading", { defaultValue: "Loading position profile..." })}
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-sm text-destructive min-h-[300px]">
                        {t("playerDetailsPage.error", { defaultValue: "Failed to load peer data." })}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 flex items-center justify-center">
                            <ChartContainer
                                config={chartConfig}
                                className="mx-auto aspect-square w-full max-w-[315px]"
                            >
                                <RadarChart
                                    data={chartData}
                                    className="cursor-pointer"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius="65%"
                                    margin={{ top: 10, right: 35, bottom: 10, left: 35 }}
                                    onClick={(state) => {
                                        if (state && state.activeLabel) {
                                            const matched = chartData.find((d) => d.subject === state.activeLabel)
                                            if (matched) {
                                                setSelectedDimension(matched.key)
                                            }
                                        }
                                    }}
                                >
                                    <ChartTooltip
                                        cursor={false}
                                        content={<CustomRadarTooltip />}
                                    />
                                    <PolarGrid gridType="circle" className="stroke-border/40" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: "var(--color-foreground)", fontSize: 9, fontWeight: 500 }}
                                    />
                                    <Radar
                                        name={player.name}
                                        dataKey="playerNormalized"
                                        stroke="var(--primary)"
                                        fill="var(--primary)"
                                        fillOpacity={0.25}
                                        strokeWidth={2.5}
                                        dot={{
                                            r: 4,
                                            fill: "var(--primary)",
                                            stroke: "var(--background)",
                                            strokeWidth: 1.5,
                                            fillOpacity: 1,
                                        }}
                                    />
                                    <Radar
                                        name="Position Average"
                                        dataKey="avgNormalized"
                                        stroke="var(--muted-foreground)"
                                        strokeDasharray="4 4"
                                        fill="none"
                                        strokeWidth={1.5}
                                        dot={{
                                            r: 3,
                                            fill: "var(--muted-foreground)",
                                            stroke: "var(--background)",
                                            strokeWidth: 1,
                                            fillOpacity: 0.8,
                                        }}
                                    />
                                </RadarChart>
                            </ChartContainer>
                        </div>

                        {/* Dimension pills row */}
                        <div className="flex flex-wrap gap-1.5 justify-center py-3 border-t border-border/20">
                            {chartData.map((d) => {
                                const dTiers = getPercentileTier(d.percentile)
                                return (
                                    <button
                                        key={d.key}
                                        onClick={() => setSelectedDimension(d.key)}
                                        className={cn(
                                            "px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-all cursor-pointer flex items-center gap-1",
                                            selectedDimension === d.key
                                                ? cn("text-white shadow-xs", dTiers.barColor, "border-transparent")
                                                : "bg-muted/40 hover:bg-muted/70 text-muted-foreground border-border/60"
                                        )}
                                    >
                                        {d.key === "rating" && <Star className="size-3" />}
                                        {d.subject}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Percentile Visualizer Line */}
                        <div className="space-y-3 border-t border-border/20 pt-4 pb-4 px-1">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-xs font-bold tracking-tight text-foreground uppercase flex items-center gap-1.5">
                                        <Info className="size-3.5 text-primary" />
                                        {t("playerDetailsPage.metricRank", {
                                            subject: activeMetricData.subject,
                                            defaultValue: "{{subject}} Rank"
                                        })}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">
                                        {t("playerDetailsPage.relativeToPeers", {
                                            count: positionPlayers.length,
                                            playerName: player.name,
                                            position: positionNameMap[pos],
                                            defaultValue: "Relative to {{count}} {{position}} peers"
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                                        activeTier.bgClass
                                    )}>
                                        {activeTier.label} ({activeMetricData.percentile}th)
                                    </span>
                                </div>
                            </div>

                            <div className="relative pt-4 pb-2">
                                {/* Track */}
                                <div className="h-2 w-full rounded-full bg-muted/60 dark:bg-muted/30 relative overflow-visible">
                                    {/* Player range fill */}
                                    <div
                                        className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-300", activeTier.barColor)}
                                        style={{ width: `${activeMetricData.percentile}%` }}
                                    />

                                    {/* Midpoint line indicator at 50% */}
                                    <div className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-foreground/20 dark:bg-foreground/30 z-0" style={{ left: "50%" }} />

                                    {/* Average Pin (placed at 50% midpoint) */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 z-10"
                                        style={{ left: "50%" }}
                                    >
                                        <div className="size-3 -ml-1.5 rounded-full border-2 border-background bg-muted-foreground shadow-xs cursor-help" />
                                    </div>

                                    {/* Player Pin (placed at player's percentile) */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 z-20"
                                        style={{ left: `${activeMetricData.percentile}%` }}
                                    >
                                        <div className={cn(
                                            "size-5 -ml-2.5 rounded-full border border-background shadow-md flex items-center justify-center text-[9px] font-extrabold text-white cursor-help transition-all duration-300 hover:scale-110",
                                            activeTier.barColor,
                                            activeTier.glowClass
                                        )}>
                                            {activeMetricData.percentile}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono font-medium relative mt-2">
                                <span>0% (Min: {formatMetricValue(activeMetricData.key, activeMetricData.minVal ?? 0)})</span>
                                <span className="absolute left-1/2 -translate-x-1/2 text-foreground font-bold">
                                    50% (Avg: {formatMetricValue(activeMetricData.key, activeMetricData.avgValue)})
                                </span>
                                <span>100% (Max: {formatMetricValue(activeMetricData.key, activeMetricData.maxVal)})</span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

        </Card>
    )
}



