"use client"

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
import { type PlayerRow } from "@/pages/players-page"
import { positionsToRadarRole, type Classification, type RadarRole } from "@/lib/players/player-mapping"
import { computeRadarData } from "@/lib/players/radar-calculations"
import { applyPercentiles } from "@/lib/players/radar-percentiles"


const formatMetricValue = (key: string, val: number | null): string => {
    if (val === null || val === undefined) return "N/A"
    if (key === "rating") return val.toFixed(2)
    if (
        key.endsWith("_pct") || 
        key === "pass_acc" || 
        key === "long_ball_acc" ||
        key === "tackle_win_pct" ||
        key === "aerial_win_pct"
    ) {
        return `${val.toFixed(1)}%`
    }
    if (key === "penalty_save_r" || key === "shot_acc" || key === "conversion") {
        return `${(val * 100).toFixed(1)}%`
    }
    return val.toFixed(2)
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
    } else if (key === "goals_p90" || key === "xg_p90" || key === "goals_prevented" || key === "goal_contrib_p90") {
        pct = (rawValue / 1.5) * 100
    } else if (key === "assists_p90" || key === "xa_p90" || key === "clean_sheets") {
        pct = (rawValue / 1.0) * 100
    } else {
        pct = (rawValue / 5.0) * 100
    }
    
    return Math.min(100, Math.max(0, pct))
}

const getPercentileTier = (percentile: number | null) => {
    const val = percentile ?? 50
    if (val >= 90) {
        return {
            label: "Elite",
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
            barColor: "bg-emerald-500",
            glowClass: "shadow-[0_0_10px_rgba(16,185,129,0.3)]",
            hex: "#10b981",
        }
    }
    if (val >= 70) {
        return {
            label: "Above Avg",
            colorClass: "text-blue-500",
            bgClass: "bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400",
            barColor: "bg-blue-500",
            glowClass: "shadow-[0_0_10px_rgba(59,130,246,0.3)]",
            hex: "#3b82f6",
        }
    }
    if (val >= 40) {
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
        const rawFormatted = formatMetricValue(data.key, data.rawValue)
        const suffix = (data.percentile !== null && data.percentile !== undefined)
            ? `${data.percentile}th percentile`
            : `small sample`
            
        const avgDisplay = data.averageValue !== null && data.averageValue !== undefined
            ? ` | Avg: ${formatMetricValue(data.key, data.averageValue)}`
            : ''

        return (
            <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-md text-xs">
                <div className="font-semibold text-foreground">
                    {data.subject}: <span className="font-mono font-bold">{rawFormatted}</span> <span className="text-muted-foreground text-[10px] ml-1">({suffix}{avgDisplay})</span>
                </div>
            </div>
        )
    }
    return null
}

interface ChartRadarGridCircleProps {
    player: PlayerRow
    peers?: any[]
    peersLoading?: boolean
    peersError?: Error | string | null
}

export function ChartRadarGridCircle({ player, peers = [], peersLoading = false, peersError = null }: ChartRadarGridCircleProps) {
    const { t } = useTranslation()
    const [selectedDimension, setSelectedDimension] = React.useState<string>("rating")

    const role = React.useMemo(() => {
        return player.radarRole || positionsToRadarRole(player.positions, player.classification as Classification) || "ST"
    }, [player.radarRole, player.positions, player.classification])

    const radarData = React.useMemo(() => {
        if (!player.statistics) {
            return {
                role,
                minutesPlayed: player.minutesPlayed ?? 0,
                tier: "show_only" as const,
                spokes: [],
            }
        }
        return computeRadarData(player.statistics, role)
    }, [player.statistics, role, player.minutesPlayed])

    const result = React.useMemo(() => {
        const peerList = peersLoading ? [] : peers
        return applyPercentiles(radarData, peerList, role, String(player.id), player.statistics)
    }, [radarData, peers, peersLoading, role, player.id, player.statistics])

    const spokesToRender = result.spokes

    React.useEffect(() => {
        if (spokesToRender.length > 0) {
            const hasDimension = spokesToRender.some((s) => s.key === selectedDimension)
            if (!hasDimension) {
                setSelectedDimension(spokesToRender[0].key)
            }
        }
    }, [spokesToRender, selectedDimension])

    const isPercentileReady = !result.peerCountBelowThreshold && radarData.tier !== 'show_only'

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

    const chartData = React.useMemo(() => {
        return spokesToRender.map((spoke) => ({
            subject: spoke.label,
            key: spoke.key,
            rawValue: spoke.rawValue,
            percentile: spoke.percentile,
            averageValue: spoke.averageValue,
            playerNormalized: spoke.percentile ?? normalizeAbsolute(spoke.rawValue, spoke.key),
            avgNormalized: isPercentileReady ? 50 : null,
            fullMark: 100,
        }))
    }, [spokesToRender, isPercentileReady])

    const activeMetricData = React.useMemo(() => {
        return chartData.find((d) => d.key === selectedDimension) || chartData[0]
    }, [chartData, selectedDimension])

    const activeTier = React.useMemo(() => {
        if (!activeMetricData) return getPercentileTier(50)
        return getPercentileTier(activeMetricData.percentile)
    }, [activeMetricData])

    const positionNameMap: Record<RadarRole, string> = {
        GK: "Goalkeeper",
        CB: "Centre-back",
        FB: "Full-back / Wing-back",
        DM: "Defensive Midfielder",
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
                        position: positionNameMap[role],
                        defaultValue: "Comparing {{playerName}} to {{position}}s (Per 90 mins)"
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-0 flex-1 flex flex-col justify-between min-h-[350px] justify-center">
                <>
                    <div className="flex-1 flex flex-col items-center justify-center">
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
                                    {isPercentileReady && (
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
                                    )}
                                </RadarChart>
                            </ChartContainer>
                            {radarData.tier === 'show_only' && (
                                <p className="text-xs text-muted-foreground mt-1 text-center">
                                    Small sample — based on {player.statistics?.minutes_played ?? player.minutesPlayed}min played
                                </p>
                            )}
                            {!peersLoading && result.peerCountBelowThreshold && radarData.tier !== 'show_only' && !peersError && (
                                <p className="text-xs text-amber-500 mt-1 text-center">
                                    {t("playerDetailsPage.fewPeers", { defaultValue: "Percentile rank hidden — fewer than 5 qualified peers" })}
                                </p>
                            )}
                            {peersError && (
                                <p className="text-xs text-destructive mt-1 text-center">
                                    {t("playerDetailsPage.peersError", { defaultValue: "Failed to load peers data" })}
                                </p>
                            )}
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
                        {isPercentileReady && activeMetricData && (activeMetricData.percentile !== null && activeMetricData.percentile !== undefined) && (
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
                                                count: result.peerCount,
                                                playerName: player.name,
                                                position: positionNameMap[role],
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
                                    <span>0%</span>
                                    <span className="absolute left-1/2 -translate-x-1/2 text-foreground font-bold">
                                        50% (Median)
                                    </span>
                                    <span>100%</span>
                                </div>
                            </div>
                        )}
                    </>
            </CardContent>
        </Card>
    )
}
