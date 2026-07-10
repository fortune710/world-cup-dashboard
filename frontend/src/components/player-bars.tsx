"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Trophy } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { type PlayerRow } from "@/pages/players-page"
import { positionsToRadarRole, type Classification, type RadarRole } from "@/lib/players/player-mapping"
import { computeRadarData } from "@/lib/players/radar-calculations"
import { applyPercentiles } from "@/lib/players/radar-percentiles"
import type { MetricType } from "@/lib/players/radar-metrics"

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

    const rows = React.useMemo(() => {
        return spokesToRender.map((spoke) => {
            const barPct = spoke.percentile ?? normalizeAbsolute(spoke.rawValue, spoke.key)
            const tier = getPercentileTier(spoke.percentile ?? null)
            const formattedValue = formatMetricValue(spoke.key, spoke.rawValue, spoke.type)
            const formattedAvg = formatMetricValue(spoke.key, spoke.averageValue ?? null, spoke.type)
            const detailText = spoke.percentile !== null && spoke.percentile !== undefined
                ? `${spoke.percentile}th percentile${spoke.averageValue !== null && spoke.averageValue !== undefined ? ` · Peer avg ${formattedAvg}` : ""}`
                : "Small sample (raw value)"

            return {
                key: spoke.key,
                label: spoke.label,
                barPct,
                fill: tier.hex,
                tierLabel: tier.label,
                displayValue: spoke.percentile !== null && spoke.percentile !== undefined
                    ? `${spoke.percentile}%`
                    : formattedValue,
                detailText,
            }
        })
    }, [spokesToRender])

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
            <CardContent className="flex-1 pb-4 min-h-[350px]">
                <div className="flex w-full flex-col items-start gap-4">
                    {rows.map((row) => (
                        <div key={row.key} className="flex w-full flex-col items-start gap-1">
                            <div className="flex w-full items-center justify-between text-xs font-medium">
                                <span>{row.label}</span>
                                <span className="font-mono" style={{ color: row.fill }}>{row.displayValue}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full"
                                    style={{ width: `${row.barPct}%`, backgroundColor: row.fill }}
                                />
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                                {row.detailText}
                            </div>
                        </div>
                    ))}
                </div>
                {radarData.tier === "show_only" && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        Small sample — based on {player.statistics?.minutes_played ?? player.minutesPlayed}min played
                    </p>
                )}
                {!peersLoading && result.peerCountBelowThreshold && radarData.tier !== "show_only" && (
                    <p className="text-xs text-amber-500 mt-4 text-center">
                        {t("playerDetailsPage.fewPeers", { defaultValue: "Percentile rank hidden — fewer than 5 qualified peers" })}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
