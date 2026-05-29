import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LiveRushMatch } from "@/lib/live-rush-layout"
import { cn } from "@/lib/utils"
import { ClockIcon, RadioIcon } from "lucide-react"
import { getMatchWinner } from "@/lib/helper"
interface LiveRushMatchCardProps {
  match: LiveRushMatch
  className?: string
}

function statusBadge(match: LiveRushMatch) {
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

function scoreLine(match: LiveRushMatch) {
  if (match.status === "upcoming") {
    return (
      <span className="text-muted-foreground tabular-nums">
        {match.kickoffLabel}
      </span>
    )
  }
  return (
    <span className="tabular-nums">
      {match.homeScore ?? 0} – {match.awayScore ?? 0}
    </span>
  )
}

export function LiveRushMatchCard({ match, className }: LiveRushMatchCardProps) {
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
          {match.status === "live" ? `${match.kickoffLabel} live` : match.kickoffLabel}
        </CardDescription>
        <CardTitle className=" font-semibold @[250px]/card:text-xl flex items-center">
          <span className="line-clamp-1">
            <span
              className={cn(
                winner !== null && winner !== "home" && "text-muted-foreground"
              )}
            >
              {match.homeTeam}
            </span>
            <span className="mx-2" />
            <span
              className={cn(
                "tabular-nums",
                winner !== "home" && "text-muted-foreground"
              )}
            >
              {hasScores ? homeScore : match.homeScore}
            </span>
            <span className="mx-4 text-muted-foreground">vs</span>
            <span className="mx-4" />
            <span
              className={cn(
                "tabular-nums",
                winner !== "away" && "text-muted-foreground"
              )}
            >
              {hasScores ? awayScore : match.awayScore}
            </span>
            <span className="mx-2" />
            <span
              className={cn(
                winner !== null && winner !== "away" && "text-muted-foreground"
              )}
            >
              {match.awayTeam}
            </span>
          </span>
        </CardTitle>
        <CardAction>{statusBadge(match)}</CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
      
        <div className="text-muted-foreground">
          {match.status === "finished" && "Full time — rush locked"}
          {match.status === "live" && "In play — goals count now"}
          {match.status === "upcoming" && "Kickoff pending — picks open"}
        </div>
      </CardFooter>
    </Card>
  )
}
