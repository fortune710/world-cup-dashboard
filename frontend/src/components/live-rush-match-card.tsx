import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LiveRushMatch, LiveRushMatchCardProps, MatchWinner } from "@/datatypes"
import { getLiveRushFooterMessage } from "@/lib/helpers/live-rush.helpers"
import { getMatchWinner } from "@/lib/helpers/match.helpers"
import { cn } from "@/lib/utils"
import { ClockIcon, RadioIcon } from "lucide-react"

function MatchStatusBadge({ match }: { match: LiveRushMatch }) {
  if (match.status === "live") {
    return (
      <Badge variant="default" className="gap-1">
        <RadioIcon data-icon="inline-start" />
        Live
      </Badge>
    )
  }

  if (match.status === "finished") {
    return <Badge variant="outline">FT</Badge>
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <ClockIcon data-icon="inline-start" />
      {match.kickoffLabel}
    </Badge>
  )
}

interface MatchScorelineProps {
  match: LiveRushMatch
  hasScores: boolean
  homeScore: number
  awayScore: number
  winner: MatchWinner | null
}

const MatchScoreline = React.memo(function MatchScoreline({
  match,
  hasScores,
  homeScore,
  awayScore,
  winner,
}: MatchScorelineProps) {
  const homeMuted = winner === "away"
  const awayMuted = winner === "home"
  const homeScoreMuted = winner === "away"
  const awayScoreMuted = winner === "home"

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-1.5 @[360px]/card:hidden">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span
            className={cn(
              "min-w-0 truncate font-semibold",
              homeMuted && "text-muted-foreground"
            )}
          >
            {match.homeTeam}
          </span>
          {hasScores ? (
            <span
              className={cn(
                "shrink-0 tabular-nums font-semibold",
                homeScoreMuted && "text-muted-foreground"
              )}
            >
              {homeScore}
            </span>
          ) : null}
        </div>
        <div className="text-center text-xs text-muted-foreground">vs</div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span
            className={cn(
              "min-w-0 truncate font-semibold",
              awayMuted && "text-muted-foreground"
            )}
          >
            {match.awayTeam}
          </span>
          {hasScores ? (
            <span
              className={cn(
                "shrink-0 tabular-nums font-semibold",
                awayScoreMuted && "text-muted-foreground"
              )}
            >
              {awayScore}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden w-full min-w-0 @[360px]/card:block">
        {hasScores ? (
          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-x-2">
            <span
              className={cn(
                "truncate text-end font-semibold",
                homeMuted && "text-muted-foreground"
              )}
            >
              {match.homeTeam}
            </span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                homeScoreMuted && "text-muted-foreground"
              )}
            >
              {homeScore}
            </span>
            <span className="px-1 text-muted-foreground">vs</span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                awayScoreMuted && "text-muted-foreground"
              )}
            >
              {awayScore}
            </span>
            <span
              className={cn(
                "truncate text-start font-semibold",
                awayMuted && "text-muted-foreground"
              )}
            >
              {match.awayTeam}
            </span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center justify-center gap-2">
            <span className="truncate font-semibold">{match.homeTeam}</span>
            <span className="shrink-0 text-muted-foreground">vs</span>
            <span className="truncate font-semibold">{match.awayTeam}</span>
          </div>
        )}
      </div>
    </>
  )
})

export const LiveRushMatchCard = React.memo(function LiveRushMatchCard({
  match,
  className,
}: LiveRushMatchCardProps) {
  const isLive = match.status === "live"
  const hasScores = match.status !== "upcoming"
  const homeScore = match.homeScore ?? 0
  const awayScore = match.awayScore ?? 0
  const winner = hasScores ? getMatchWinner(homeScore, awayScore) : null

  return (
    <Card
      className={cn(
        "@container/card",
        isLive && "ring-2 ring-primary/40 dark:ring-primary",
        className
      )}
    >
      <CardHeader>
        <CardDescription>
          {match.group ? `Group ${match.group}` : "Knockout"} ·{" "}
          {match.status === "live"
            ? `${match.kickoffLabel} live`
            : match.kickoffLabel}
        </CardDescription>
        <CardAction>
          <MatchStatusBadge match={match} />
        </CardAction>
        <CardTitle className="col-span-2 w-full min-w-0 font-semibold @[250px]/card:text-xl">
          <MatchScoreline
            match={match}
            hasScores={hasScores}
            homeScore={homeScore}
            awayScore={awayScore}
            winner={winner}
          />
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-muted-foreground">
          {getLiveRushFooterMessage(match.status)}
        </div>
      </CardFooter>
    </Card>
  )
})
