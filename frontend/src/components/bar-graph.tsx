"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
    Star,
    Sparkles,
    Shield,
    Eye,
    ShieldCheck
} from "lucide-react"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { type PlayerRow } from "@/pages/players-page"
import { usePlayerMatchHistory } from "@/hooks/use-player-match-history"
import { useInViewAnimation } from "@/hooks/use-in-view-animation"

const chartConfig = {
    rating: {
        label: "Match Rating",
        color: "var(--chart-form-positive)",
    },
    ga: {
        label: "G/A",
        color: "var(--chart-knockout)",
    },
    tackles: {
        label: "Tackles",
        color: "var(--chart-possession)",
    },
    interceptions: {
        label: "Interceptions",
        color: "var(--chart-neutral)",
    },
    cleanSheet: {
        label: "Clean Sheet",
        color: "var(--chart-form-positive)",
    },
} satisfies ChartConfig

interface StatOption {
    key: string
    label: string
    color: string
    colorClass: string
    type: "average" | "total"
    icon: "rating" | "ga" | "tackles" | "interceptions" | "cleanSheet"
}

const ROUND_ABBREVIATIONS: Record<string, string> = {
    "Round of 32": "R32",
    "R32": "R32",
    "Round of 16": "R16",
    "R16": "R16",
    "Quarter-final": "QF",
    "QF": "QF",
    "Semi-final": "SF",
    "SF": "SF",
    "3rd place": "3rd",
    "3rd": "3rd",
    "Final": "F",
    "final": "F",
}

const getAvailableStats = (position: string, t: any): StatOption[] => {
    switch (position) {
        case "GK":
            return [
                {
                    key: "rating",
                    label: t("playerDetailsPage.ratingTab", { defaultValue: "Avg Rating" }),
                    color: "var(--color-rating)",
                    colorClass: "text-emerald-500",
                    type: "average",
                    icon: "rating"
                },
                {
                    key: "cleanSheet",
                    label: t("playerDetailsPage.cleanSheetsTab", { defaultValue: "Clean Sheets" }),
                    color: "var(--color-cleanSheet)",
                    colorClass: "text-blue-500",
                    type: "total",
                    icon: "cleanSheet"
                }
            ]
        case "DEF":
            return [
                {
                    key: "rating",
                    label: t("playerDetailsPage.ratingTab", { defaultValue: "Avg Rating" }),
                    color: "var(--color-rating)",
                    colorClass: "text-emerald-500",
                    type: "average",
                    icon: "rating"
                },
                {
                    key: "tackles",
                    label: t("playerDetailsPage.tacklesTab", { defaultValue: "Total Tackles" }),
                    color: "var(--color-tackles)",
                    colorClass: "text-blue-500",
                    type: "total",
                    icon: "tackles"
                },
                {
                    key: "interceptions",
                    label: t("playerDetailsPage.interceptionsTab", { defaultValue: "Total Interceptions" }),
                    color: "var(--color-interceptions)",
                    colorClass: "text-cyan-500",
                    type: "total",
                    icon: "interceptions"
                },
                {
                    key: "cleanSheet",
                    label: t("playerDetailsPage.cleanSheetsTab", { defaultValue: "Clean Sheets" }),
                    color: "var(--color-cleanSheet)",
                    colorClass: "text-indigo-500",
                    type: "total",
                    icon: "cleanSheet"
                }
            ]
        default: // MID, FWD
            return [
                {
                    key: "rating",
                    label: t("playerDetailsPage.ratingTab", { defaultValue: "Avg Rating" }),
                    color: "var(--color-rating)",
                    colorClass: "text-emerald-500",
                    type: "average",
                    icon: "rating"
                },
                {
                    key: "ga",
                    label: t("playerDetailsPage.gaTab", { defaultValue: "Total G/A" }),
                    color: "var(--color-ga)",
                    colorClass: "text-fuchsia-500",
                    type: "total",
                    icon: "ga"
                }
            ]
    }
}

const CustomTooltip = ({ active, payload, position }: any) => {
    const { t } = useTranslation()
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-md text-xs space-y-1.5 min-w-[155px]">
                <div className="font-bold border-b pb-1 mb-1 flex justify-between items-center gap-4 border-border/40">
                    <span>{data.matchName}</span>
                    <span className="text-muted-foreground">vs. {data.opponent}</span>
                </div>
                {data.hasStats ? (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                                {t("playerDetailsPage.rating", { defaultValue: "Rating" })}:
                            </span>
                            <span className="font-semibold text-emerald-500 font-mono">{data.rating.toFixed(2)}</span>
                        </div>

                        {position === "DEF" && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">
                                        {t("playerDetailsPage.tackles", { defaultValue: "Tackles" })}:
                                    </span>
                                    <span className="font-semibold text-blue-500 font-mono">{data.tackles}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">
                                        {t("playerDetailsPage.interceptions", { defaultValue: "Interceptions" })}:
                                    </span>
                                    <span className="font-semibold text-blue-500 font-mono">{data.interceptions}</span>
                                </div>
                            </>
                        )}

                        {(position === "FWD" || position === "MID") && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                    {t("playerDetailsPage.gaLabel", { defaultValue: "G/A" })}:
                                </span>
                                <span className="font-semibold text-rose-500 font-mono">{data.ga}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-muted-foreground text-[10px]">
                        {t("playerDetailsPage.noMatchStats", { defaultValue: "No detailed stats recorded" })}
                    </div>
                )}
                {data.cleanSheet !== undefined && (
                    <div className="flex justify-between items-center text-[10px] border-t border-border/20 pt-1">
                        <span className="text-muted-foreground">
                            {t("playerDetailsPage.cleanSheet", { defaultValue: "Clean Sheet" })}:
                        </span>
                        <span className="font-medium text-foreground">
                            {data.cleanSheet === 1
                                ? `✅ ${t("playerDetailsPage.yes", { defaultValue: "Yes" })}`
                                : `❌ ${t("playerDetailsPage.no", { defaultValue: "No" })}`}
                        </span>
                    </div>
                )}
            </div>
        )
    }
    return null
}

export function ChartAreaInteractive({ player }: { player?: PlayerRow }) {
    const { t } = useTranslation()
    const [activeChart, setActiveChart] = React.useState<string>("rating")
    const [stage, setStage] = React.useState("all")
    const { ref: inViewRef, active: inView, reduceMotion } = useInViewAnimation<HTMLDivElement>()

    const { matches: rawMatches, isLoading: historyLoading, error: historyError } = usePlayerMatchHistory(player?.id)

    const availableStats = React.useMemo(() => {
        if (!player) return []
        return getAvailableStats(player.position, t)
    }, [player?.position, t])

    React.useEffect(() => {
        if (player) {
            setActiveChart("rating")
            setStage("all")
        }
    }, [player?.position])

    const matchHistory = React.useMemo(() => {
        let groupCount = 0
        return rawMatches.map((m) => {
            // Backend round strings aren't consistently cased ("group" vs "Group"),
            // so match case-insensitively rather than against one exact literal.
            const isGroup = (m.round ?? "").toLowerCase() === "group"
            if (isGroup) groupCount += 1
            const matchName = isGroup
                ? `M${groupCount}`
                : (m.round ? (ROUND_ABBREVIATIONS[m.round] ?? m.round) : "Match")
            return {
                matchName,
                isGroup,
                opponent: m.opponent ?? "OPP",
                // null (not 0) when this match's per-player stats haven't been
                // ingested yet, so the chart shows a gap instead of a fake drop to 0.
                rating: m.rating,
                ga: m.goal_contributions,
                tackles: m.tackles,
                interceptions: m.interceptions,
                cleanSheet: m.clean_sheet === null ? undefined : (m.clean_sheet ? 1 : 0),
                hasStats: m.has_player_stats,
            }
        })
    }, [rawMatches])

    const filteredData = React.useMemo(() => {
        if (stage === "group") {
            return matchHistory.filter((m) => m.isGroup)
        }
        if (stage === "knockout") {
            return matchHistory.filter((m) => !m.isGroup)
        }
        return matchHistory
    }, [matchHistory, stage])

    const chartData = filteredData

    const getStatValue = React.useCallback((stat: StatOption) => {
        const withStats = chartData.filter((m) => m.hasStats)
        if (!player || !withStats.length) return "0"
        if (stat.key === "rating") {
            const total = withStats.reduce((acc, curr) => acc + (curr.rating ?? 0), 0)
            return (total / withStats.length).toFixed(2)
        }
        if (stat.key === "cleanSheet") {
            const csCount = chartData.filter((m) => m.cleanSheet === 1).length
            return csCount.toString()
        }
        const total = withStats.reduce((acc, curr) => {
            const val = curr[stat.key as keyof typeof curr]
            return acc + (typeof val === "number" ? val : 0)
        }, 0)
        return total.toString()
    }, [chartData, player])

    const bgKey = React.useMemo(() => {
        if (!player) return "ga"
        switch (player.position) {
            case "GK":
                return "cleanSheet"
            case "DEF":
                return "tackles"
            default:
                return "ga"
        }
    }, [player?.position])

    if (!player) return null

    if (historyLoading) {
        return (
            <Card className="pt-0">
                <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                    {t("playerDetailsPage.loadingMatchHistory", { defaultValue: "Loading match history..." })}
                </CardContent>
            </Card>
        )
    }

    if (historyError) {
        return (
            <Card className="pt-0">
                <CardContent className="flex h-[300px] items-center justify-center text-sm text-destructive">
                    {t("playerDetailsPage.matchHistoryError", { defaultValue: "Failed to load match history" })}
                </CardContent>
            </Card>
        )
    }

    return (
        <div ref={inViewRef}>
        <Card className="pt-0">
            <CardHeader className="flex flex-col items-stretch border-b p-0! lg:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6">
                    <CardTitle className="text-xl font-bold tracking-tight">
                        {t("playerDetailsPage.performanceChartTitle", { defaultValue: "Tournament Performance" })}
                    </CardTitle>
                    <CardDescription>
                        {t("playerDetailsPage.performanceChartDesc", { defaultValue: "Interactive view of match ratings and overall stats" })}
                    </CardDescription>
                </div>
                <div className="flex items-center px-6 pb-4 lg:py-0!">
                    <Select value={stage} onValueChange={setStage}>
                        <SelectTrigger
                            className="w-[160px] rounded-lg lg:ml-auto"
                            aria-label={t("playerDetailsPage.selectStage", { defaultValue: "Select tournament stage" })}
                        >
                            <SelectValue placeholder={t("playerDetailsPage.allMatches", { defaultValue: "All Matches" })} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all" className="rounded-lg">
                                {t("playerDetailsPage.allMatches", { defaultValue: "All Matches" })}
                            </SelectItem>
                            <SelectItem value="group" className="rounded-lg">
                                {t("playerDetailsPage.groupStage", { defaultValue: "Group Stage" })}
                            </SelectItem>
                            {matchHistory.some((m) => !m.isGroup) && (
                                <SelectItem value="knockout" className="rounded-lg">
                                    {t("playerDetailsPage.knockoutStage", { defaultValue: "Knockout Stage" })}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-row flex-wrap border-t lg:border-t-0 lg:border-l border-border shrink-0">
                    {availableStats.map((stat) => (
                        <button
                            key={stat.key}
                            data-active={activeChart === stat.key}
                            className="relative z-30 flex flex-1 min-w-[120px] flex-col justify-center gap-1 border-r last:border-r-0 border-b last:border-b-0 sm:border-b-0 px-4 py-3 sm:px-6 sm:py-4 text-left data-[active=true]:bg-muted/50 transition-colors hover:bg-muted/20 cursor-pointer"
                            onClick={() => setActiveChart(stat.key)}
                        >
                            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 whitespace-nowrap">
                                {stat.icon === "rating" && <Star className="size-3.5 text-emerald-500" />}
                                {stat.icon === "ga" && <Sparkles className="size-3.5 text-fuchsia-500" />}
                                {stat.icon === "tackles" && <Shield className="size-3.5 text-blue-500" />}
                                {stat.icon === "interceptions" && <Eye className="size-3.5 text-cyan-500" />}
                                {stat.icon === "cleanSheet" && <ShieldCheck className="size-3.5 text-indigo-500" />}
                                {stat.label}
                            </span>
                            <span className={`text-lg leading-none font-bold sm:text-2xl ${stat.colorClass}`}>
                                {getStatValue(stat)}
                            </span>
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {chartData.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        {t("playerDetailsPage.noMatchHistory", { defaultValue: "No completed matches yet" })}
                    </div>
                ) : chartData.every((m) => !m.hasStats) ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        {t("playerDetailsPage.noMatchStatsForStage", { defaultValue: "Matches played, but stats haven't been recorded yet for this stage" })}
                    </div>
                ) : (
                <div
                    style={{
                        clipPath: inView ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                        transition: reduceMotion ? undefined : "clip-path 1200ms ease-out",
                    }}
                >
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 10,
                            bottom: 5,
                        }}
                    >
                        <defs>
                            <linearGradient id="fillRating" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-rating)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-rating)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                            <linearGradient id="fillGa" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-ga)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-ga)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                            <linearGradient id="fillTackles" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-tackles)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-tackles)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                            <linearGradient id="fillInterceptions" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-interceptions)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-interceptions)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                            <linearGradient id="fillCleanSheet" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-cleanSheet)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-cleanSheet)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} className="stroke-border/40" />
                        <XAxis
                            dataKey="matchName"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={10}
                            tickFormatter={(value) => ROUND_ABBREVIATIONS[value] ?? value}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                            content={<CustomTooltip position={player.position} />}
                        />
                        {activeChart === "rating" ? (
                            <Area
                                key={`${bgKey}-bg-${stage}`}
                                dataKey={bgKey}
                                type="monotone"
                                stroke={`var(--color-${bgKey})`}
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                fill="none"
                                opacity={0.3}
                                activeDot={false}
                                isAnimationActive
                                animationDuration={1200}
                                animationEasing="ease-out"
                            />
                        ) : (
                            <Area
                                key={`rating-bg-${stage}`}
                                dataKey="rating"
                                type="monotone"
                                stroke="var(--color-rating)"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                fill="none"
                                opacity={0.3}
                                activeDot={false}
                                isAnimationActive
                                animationDuration={1200}
                                animationEasing="ease-out"
                            />
                        )}
                        <Area
                            key={`${activeChart}-${stage}`}
                            dataKey={activeChart}
                            type="monotone"
                            fill={`url(#fill${activeChart.charAt(0).toUpperCase() + activeChart.slice(1)})`}
                            stroke={`var(--color-${activeChart})`}
                            strokeWidth={2}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            isAnimationActive
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ChartContainer>
                </div>
                )}
            </CardContent>
        </Card>
        </div>
    )
}
