"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp, ShieldAlert } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { EloHistoryPoint } from "@/hooks/use-team-elo-history"

interface TeamEloHistoryChartProps {
  history: EloHistoryPoint[]
  loading: boolean
  error: string | null
}

const chartConfig = {
  rating: {
    label: "ELO Rating",
    color: "var(--chart-possession)",
  },
} satisfies ChartConfig

export function TeamEloHistoryChart({ history, loading, error }: TeamEloHistoryChartProps) {
  const { t } = useTranslation()

  const chartData = React.useMemo(() => {
    if (history.length === 0) return []
    const points = [
      {
        opponent: "Start",
        rating: history[0].ratingBefore,
        tooltipLabel: "Initial Rating",
      },
    ]
    history.forEach((h) => {
      let outcome = "Draw"
      if (h.actualScore === 1) outcome = "Won"
      if (h.actualScore === 0) outcome = "Lost"

      points.push({
        opponent: h.opponentCode,
        rating: h.ratingAfter,
        tooltipLabel: `vs ${h.opponentCode} (${outcome})`,
      })
    })
    return points
  }, [history])

  if (loading) {
    return (
      <Card className="h-[320px] flex items-center justify-center text-sm text-muted-foreground animate-pulse border border-border/50 bg-card/30">
        Loading ELO history...
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[320px] flex flex-col items-center justify-center p-6 border border-destructive/20 bg-destructive/10">
        <ShieldAlert className="size-8 text-destructive mb-2" />
        <p className="text-sm text-destructive font-semibold">Error loading ELO history</p>
        <p className="text-xs text-destructive/80 mt-1">{error}</p>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="h-[320px] flex items-center justify-center text-sm text-muted-foreground border border-border/50">
        No ELO history points available for this team.
      </Card>
    )
  }

  // Calculate some stats for the footer
  const startingElo = history[0].ratingBefore
  const currentElo = history[history.length - 1].ratingAfter
  const totalChange = currentElo - startingElo
  const isUp = totalChange >= 0

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle>{t("teamDetailsPage.eloHistoryTitle", { defaultValue: "ELO Rating Progression" })}</CardTitle>
        <CardDescription>
          {t("teamDetailsPage.eloHistoryDesc", { defaultValue: "Match-by-match ELO rating development during the tournament" })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="h-[200px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-rating)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-rating)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="opponent"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[10px] fill-muted-foreground font-medium"
            />
            <YAxis
              domain={["dataMin - 50", "dataMax + 50"]}
              tickLine={false}
              axisLine={false}
              className="text-[10px] fill-muted-foreground font-medium"
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(_, payload) => payload[0]?.payload?.tooltipLabel ?? ""}
                />
              }
            />
            <Area
              name="ELO Rating"
              type="monotone"
              dataKey="rating"
              stroke="var(--color-rating)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorElo)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1.5 text-sm pt-2">
        <div className="flex items-center gap-2 leading-none font-semibold">
          {isUp ? (
            <span className="text-emerald-500 flex items-center gap-1">
              {t("teamDetailsPage.eloUp", { defaultValue: "Trending up" })}
              <TrendingUp className="h-4 w-4" />
              {`+${totalChange.toFixed(1)}`}
            </span>
          ) : (
            <span className="text-destructive flex items-center gap-1">
              {t("teamDetailsPage.eloDown", { defaultValue: "Trending down" })}
              <TrendingUp className="h-4 w-4 rotate-180" />
              {`${totalChange.toFixed(1)}`}
            </span>
          )}
          <span className="text-muted-foreground">
            {t("teamDetailsPage.eloCompare", { defaultValue: "since start of tournament" })}
          </span>
        </div>
        <div className="flex justify-between w-full text-xs text-muted-foreground">
          <span>Starting: {startingElo.toFixed(0)} ELO</span>
          <span>Current: {currentElo.toFixed(0)} ELO</span>
        </div>
      </CardFooter>
    </Card>
  )
}
