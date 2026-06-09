"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
    Star,
    Target,
    Award,
    Sparkles,
    Shield,
    Eye,
    Activity,
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
import { type PlayerRow, getPlayerMatchHistory } from "@/pages/players-page"

const chartConfig = {
    rating: {
        label: "Match Rating",
        color: "var(--chart-1)",
    },
    goals: {
        label: "Goals",
        color: "var(--chart-2)",
    },
    assists: {
        label: "Assists",
        color: "var(--chart-3)",
    },
    ga: {
        label: "G/A",
        color: "var(--chart-4)",
    },
    tackles: {
        label: "Tackles",
        color: "var(--chart-2)",
    },
    interceptions: {
        label: "Interceptions",
        color: "var(--chart-3)",
    },
    saves: {
        label: "Saves",
        color: "var(--chart-2)",
    },
    cleanSheet: {
        label: "Clean Sheet",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig

interface StatOption {
    key: string
    label: string
    color: string
    colorClass: string
    type: "average" | "total"
    icon: "rating" | "goals" | "assists" | "ga" | "tackles" | "interceptions" | "saves" | "cleanSheet"
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
                    key: "saves",
                    label: t("playerDetailsPage.savesTab", { defaultValue: "Total Saves" }),
                    color: "var(--color-saves)",
                    colorClass: "text-amber-500",
                    type: "total",
                    icon: "saves"
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
                    key: "goals",
                    label: t("playerDetailsPage.goalsTab", { defaultValue: "Total Goals" }),
                    color: "var(--color-goals)",
                    colorClass: "text-rose-500",
                    type: "total",
                    icon: "goals"
                },
                {
                    key: "assists",
                    label: t("playerDetailsPage.assistsTab", { defaultValue: "Total Assists" }),
                    color: "var(--color-assists)",
                    colorClass: "text-violet-500",
                    type: "total",
                    icon: "assists"
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
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-md text-xs space-y-1.5 min-w-[155px]">
                <div className="font-bold border-b pb-1 mb-1 flex justify-between items-center gap-4 border-border/40">
                    <span>{data.matchName}</span>
                    <span className="text-muted-foreground">vs. {data.opponent}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="font-semibold text-emerald-500 font-mono">{data.rating.toFixed(2)}</span>
                </div>

                {position === "DEF" && (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Tackles:</span>
                            <span className="font-semibold text-blue-500 font-mono">{data.tackles}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Interceptions:</span>
                            <span className="font-semibold text-blue-500 font-mono">{data.interceptions}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/20 pt-1 mt-1 font-semibold text-foreground">
                            <span>Def. Actions:</span>
                            <span className="font-mono">{data.defensiveActions}</span>
                        </div>
                    </>
                )}

                {position === "GK" && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Saves:</span>
                        <span className="font-semibold text-amber-500 font-mono">{data.saves}</span>
                    </div>
                )}

                {(position === "FWD" || position === "MID") && (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Goals:</span>
                            <span className="font-semibold text-rose-500 font-mono">⚽ {data.goals}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Assists:</span>
                            <span className="font-semibold text-rose-500 font-mono">👟 {data.assists}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/20 pt-1 mt-1 font-semibold text-foreground">
                            <span>G/A:</span>
                            <span className="font-mono">{data.ga}</span>
                        </div>
                    </>
                )}

                {data.cleanSheet !== undefined && (
                    <div className="flex justify-between items-center text-[10px] border-t border-border/20 pt-1">
                        <span className="text-muted-foreground">Clean Sheet:</span>
                        <span className="font-medium text-foreground">{data.cleanSheet === 1 ? "✅ Yes" : "❌ No"}</span>
                    </div>
                )}
                <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/20 pt-1">
                    <span>Minutes Played:</span>
                    <span>⏱️ {data.minutesPlayed}'</span>
                </div>
            </div>
        )
    }
    return null
}

export function ChartAreaInteractive({ player }: { player?: PlayerRow }) {
    const { t } = useTranslation()
    const [activeChart, setActiveChart] = React.useState<string>("rating")
    const [stage, setStage] = React.useState("all")

    const availableStats = React.useMemo(() => {
        if (!player) return []
        return getAvailableStats(player.position, t)
    }, [player?.position, t])

    React.useEffect(() => {
        if (player) {
            setActiveChart("rating")
        }
    }, [player?.position])

    const matchHistory = React.useMemo(() => {
        if (!player) return []
        return getPlayerMatchHistory(player)
    }, [player])

    const filteredData = React.useMemo(() => {
        if (stage === "group") {
            return matchHistory.filter((m) => m.matchName.startsWith("Group"))
        }
        if (stage === "knockout") {
            return matchHistory.filter((m) => !m.matchName.startsWith("Group"))
        }
        return matchHistory
    }, [matchHistory, stage])

    const chartData = React.useMemo(() => {
        return filteredData.map((m) => ({
            ...m,
            ga: m.goals + m.assists,
            defensiveActions: (m.tackles || 0) + (m.interceptions || 0),
            cleanSheet: m.cleanSheet !== undefined ? (m.cleanSheet ? 1 : 0) : undefined,
        }))
    }, [filteredData])

    const getStatValue = React.useCallback((stat: StatOption) => {
        if (!player || !chartData.length) return "0"
        if (stat.key === "rating") {
            const total = chartData.reduce((acc, curr) => acc + curr.rating, 0)
            return (total / chartData.length).toFixed(2)
        }
        if (stat.key === "cleanSheet") {
            const csCount = chartData.filter((m) => m.cleanSheet === 1).length
            return csCount.toString()
        }
        const total = chartData.reduce((acc, curr) => {
            const val = curr[stat.key as keyof typeof curr]
            return acc + (typeof val === "number" ? val : 0)
        }, 0)
        return total.toString()
    }, [chartData, player])

    const bgKey = React.useMemo(() => {
        if (!player) return "goals"
        switch (player.position) {
            case "GK":
                return "saves"
            case "DEF":
                return "tackles"
            default:
                return "goals"
        }
    }, [player?.position])

    if (!player) return null

    return (
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
                            aria-label="Select tournament stage"
                        >
                            <SelectValue placeholder="All Matches" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all" className="rounded-lg">
                                {t("playerDetailsPage.allMatches", { defaultValue: "All Matches" })}
                            </SelectItem>
                            <SelectItem value="group" className="rounded-lg">
                                {t("playerDetailsPage.groupStage", { defaultValue: "Group Stage" })}
                            </SelectItem>
                            {matchHistory.some((m) => !m.matchName.startsWith("Group")) && (
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
                                {stat.icon === "goals" && <Target className="size-3.5 text-rose-500" />}
                                {stat.icon === "assists" && <Award className="size-3.5 text-violet-500" />}
                                {stat.icon === "ga" && <Sparkles className="size-3.5 text-fuchsia-500" />}
                                {stat.icon === "tackles" && <Shield className="size-3.5 text-blue-500" />}
                                {stat.icon === "interceptions" && <Eye className="size-3.5 text-cyan-500" />}
                                {stat.icon === "saves" && <Activity className="size-3.5 text-amber-500" />}
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
                            <linearGradient id="fillGoals" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-goals)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-goals)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                            <linearGradient id="fillAssists" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-assists)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-assists)"
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
                            <linearGradient id="fillSaves" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-saves)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-saves)"
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
                            tickFormatter={(value) => {
                                if (value.startsWith("Group Match ")) {
                                    return `M${value.replace("Group Match ", "")}`
                                }
                                if (value === "Round of 16") return "R16"
                                if (value === "Quarter-final") return "QF"
                                if (value === "Semi-final") return "SF"
                                if (value === "Final") return "F"
                                return value
                            }}
                        />
                        <ChartTooltip
                            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                            content={<CustomTooltip position={player.position} />}
                        />
                        {activeChart === "rating" ? (
                            <Area
                                key={`${bgKey}-bg`}
                                dataKey={bgKey}
                                type="monotone"
                                stroke={`var(--color-${bgKey})`}
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                fill="none"
                                opacity={0.3}
                                activeDot={false}
                            />
                        ) : (
                            <Area
                                key="rating-bg"
                                dataKey="rating"
                                type="monotone"
                                stroke="var(--color-rating)"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                fill="none"
                                opacity={0.3}
                                activeDot={false}
                            />
                        )}
                        <Area
                            dataKey={activeChart}
                            type="monotone"
                            fill={`url(#fill${activeChart.charAt(0).toUpperCase() + activeChart.slice(1)})`}
                            stroke={`var(--color-${activeChart})`}
                            strokeWidth={2}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

