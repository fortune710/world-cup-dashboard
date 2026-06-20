"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Trophy } from "lucide-react"

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
            hex: "#10b981", // Emerald 500
        }
    }
    if (val >= 70) {
        return {
            label: "Above Avg",
            hex: "#3b82f6", // Blue 500
        }
    }
    if (val >= 40) {
        return {
            label: "Average",
            hex: "#f59e0b", // Amber 500
        }
    }
    return {
        label: "Below Avg",
        hex: "#f43f5e", // Rose 500
    }
}

const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        const percentileDisplay = data.percentile !== null && data.percentile !== undefined
            ? `${data.percentile}th percentile`
            : `Small sample (raw value)`
        const avgDisplay = data.averageValue !== null && data.averageValue !== undefined
            ? ` | Peer Avg: ${data.formattedAvg}`
            : ''
        return (
            <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-md text-xs">
                <div className="font-semibold text-foreground mb-1">
                    {data.name}
                </div>
                <div className="space-y-0.5 font-mono">
                    <div>Value: <span className="font-bold">{data.formattedValue}</span></div>
                    <div className="text-muted-foreground text-[10px]">
                        {percentileDisplay}{avgDisplay}
                    </div>
                    {data.percentile !== null && (
                        <div className="text-[10px] font-semibold mt-1" style={{ color: data.fill }}>
                            Tier: {data.tierLabel}
                        </div>
                    )}
                </div>
            </div>
        )
    }
    return null
}

interface ChartPlayerPercentilesProps {
    player: PlayerRow
    peers?: any[]
    peersLoading?: boolean
}

export function ChartPlayerPercentiles({
    player,
    peers = [],
    peersLoading = false,
}: ChartPlayerPercentilesProps) {
    const { t } = useTranslation()

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

    const positionNameMap: Record<RadarRole, string> = {
        GK: "Goalkeeper",
        CB: "Centre-back",
        FB: "Full-back / Wing-back",
        DM: "Defensive Midfielder",
        CM: "Central Midfielder",
        AMW: "Winger / Attacking Midfielder",
        ST: "Striker / Centre-forward"
    }

    const chartConfig = {
        percentileVal: {
            label: "Percentile",
            color: "var(--primary)",
        }
    } satisfies ChartConfig

    const chartData = React.useMemo(() => {
        return spokesToRender.map((spoke) => {
            const val = spoke.percentile ?? normalizeAbsolute(spoke.rawValue, spoke.key)
            const tier = getPercentileTier(spoke.percentile ?? null)
            return {
                name: spoke.label,
                key: spoke.key,
                rawValue: spoke.rawValue,
                percentile: spoke.percentile,
                averageValue: spoke.averageValue,
                formattedValue: formatMetricValue(spoke.key, spoke.rawValue),
                formattedAvg: formatMetricValue(spoke.key, spoke.averageValue ?? null),
                percentileVal: val,
                fill: tier.hex,
                tierLabel: tier.label,
            }
        })
    }, [spokesToRender])

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, payload } = props
        if (!payload) return null
        const labelText = payload.percentile !== null && payload.percentile !== undefined ? `${payload.percentile}%` : payload.formattedValue
        return (
            <text
                x={x + width + 8}
                y={y + 11}
                fill="var(--foreground)"
                fontSize={10}
                fontWeight={600}
                textAnchor="start"
            >
                {labelText}
            </text>
        )
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Trophy className="size-5 text-amber-500" />
                    {t("playerDetailsPage.percentileRanks", { defaultValue: "Percentile Ranks" })}
                </CardTitle>
                <CardDescription>
                    {t("playerDetailsPage.percentileDesc", {
                        position: positionNameMap[role],
                        defaultValue: "Compared to other {{position}}s in the tournament"
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4 min-h-[350px] flex items-center justify-center">
                <ChartContainer config={chartConfig} className="w-full h-full min-h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{
                                left: 5,
                                right: 35,
                                top: 5,
                                bottom: 5,
                            }}
                        >
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tick={{ fill: "var(--color-foreground)", fontSize: 10, fontWeight: 500 }}
                                width={110}
                            />
                            <ChartTooltip
                                cursor={{ fill: "var(--muted)/20" }}
                                content={<CustomBarTooltip />}
                            />
                            <Bar
                                dataKey="percentileVal"
                                radius={[0, 4, 4, 0]}
                                barSize={12}
                                label={renderCustomBarLabel}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
