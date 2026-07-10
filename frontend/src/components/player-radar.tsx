"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
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
import { type PlayerRow } from "@/pages/players-page"
import { positionsToRadarRole, type Classification, type RadarRole } from "@/lib/players/player-mapping"
import { computeRadarData } from "@/lib/players/radar-calculations"
import { applyPercentiles } from "@/lib/players/radar-percentiles"
import type { MetricType } from "@/lib/players/radar-metrics"
import { useInViewAnimation } from "@/hooks/use-in-view-animation"


const formatMetricValue = (key: string, val: number | null, type?: MetricType): string => {
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
    if (type === "per90") {
        return `${val.toFixed(2)}/90`
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


const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        const rawFormatted = formatMetricValue(data.key, data.rawValue, data.type)
        const suffix = (data.percentile !== null && data.percentile !== undefined)
            ? `${data.percentile}th percentile`
            : `small sample`

        const avgDisplay = data.averageValue !== null && data.averageValue !== undefined
            ? ` | Avg: ${formatMetricValue(data.key, data.averageValue, data.type)}`
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
    const { ref: inViewRef, active: inView } = useInViewAnimation<HTMLDivElement>()

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

    const isPercentileReady = !result.peerCountBelowThreshold

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
            type: spoke.type,
            rawValue: spoke.rawValue,
            percentile: spoke.percentile,
            averageValue: spoke.averageValue,
            playerNormalized: spoke.percentile ?? normalizeAbsolute(spoke.rawValue, spoke.key),
            avgNormalized: isPercentileReady ? 50 : null,
            fullMark: 100,
        }))
    }, [spokesToRender, isPercentileReady])

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
        <div ref={inViewRef}>
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
            <CardContent className="pb-0 flex-1 flex flex-col justify-center min-h-[350px]">
                <div className="flex-1 flex flex-col items-center justify-center">
                    {!inView ? (
                        <div className="mx-auto aspect-square w-full max-w-[315px]" />
                    ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square w-full max-w-[315px]"
                    >
                        <RadarChart
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius="65%"
                            margin={{ top: 10, right: 35, bottom: 10, left: 35 }}
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
                                isAnimationActive
                                animationDuration={1000}
                                animationEasing="ease-out"
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
                                    isAnimationActive
                                    animationDuration={1000}
                                    animationEasing="ease-out"
                                />
                            )}
                        </RadarChart>
                    </ChartContainer>
                    )}
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
            </CardContent>
        </Card>
        </div>
    )
}
