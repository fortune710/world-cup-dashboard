import * as React from "react"
import { useTranslation } from "react-i18next"

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
import { getMatchWinner } from "@/lib/helpers/match.helpers"
import { cn } from "@/lib/utils"
import { ClockIcon, RadioIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"

function MatchStatusBadge({ match }: { match: LiveRushMatch }) {
  const { t } = useTranslation()

  if (match.status === "live") {
    return (
      <Badge variant="default" className="gap-1">
        <RadioIcon data-icon="inline-start" />
        {t("matchCard.live")}
      </Badge>
    )
  }

  if (match.status === "finished") {
    return <Badge variant="outline">{t("matchCard.fullTime")}</Badge>
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
  const { t } = useTranslation()

  const homeMuted = winner === "away"
  const awayMuted = winner === "home"
  const homeScoreMuted = winner === "away"
  const awayScoreMuted = winner === "home"

  return (
    <>
      {/* Mobile view */}
      <div className="flex w-full min-w-0 flex-col gap-1.5 @[360px]/card:hidden">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-4.5 rounded-xs border border-border/30 overflow-hidden shrink-0">
              <AvatarImage src={getTeamFlagUrl({ teamName: match.homeTeam }, 20)} alt={match.homeTeam} className="object-cover" />
              <AvatarFallback>{match.homeTeam.slice(0, 3).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "min-w-0 truncate font-semibold",
                homeMuted && "text-muted-foreground"
              )}
            >
              {match.homeTeam}
            </span>
          </div>
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
        <div className="text-center text-xs text-muted-foreground">
          {t("common.vs")}
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-4.5 rounded-xs border border-border/30 overflow-hidden shrink-0">
              <AvatarImage src={getTeamFlagUrl({ teamName: match.awayTeam }, 20)} alt={match.awayTeam} className="object-cover" />
              <AvatarFallback>{match.awayTeam.slice(0, 3).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "min-w-0 truncate font-semibold",
                awayMuted && "text-muted-foreground"
              )}
            >
              {match.awayTeam}
            </span>
          </div>
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

      {/* Desktop view */}
      <div className="hidden w-full min-w-0 @[360px]/card:block">
        {hasScores ? (
          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-x-3">
            <div className="flex items-center justify-end gap-2 min-w-0">
              <span
                className={cn(
                  "truncate font-semibold text-end",
                  homeMuted && "text-muted-foreground"
                )}
              >
                {match.homeTeam}
              </span>
              <Avatar className="size-4.5 rounded-xs border border-border/30 overflow-hidden shrink-0">
                <AvatarImage src={getTeamFlagUrl({ teamName: match.homeTeam }, 20)} alt={match.homeTeam} className="object-cover" />
                <AvatarFallback>{match.homeTeam.slice(0, 3).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <span
              className={cn(
                "tabular-nums font-semibold",
                homeScoreMuted && "text-muted-foreground"
              )}
            >
              {homeScore}
            </span>
            <span className="px-1 text-muted-foreground">{t("common.vs")}</span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                awayScoreMuted && "text-muted-foreground"
              )}
            >
              {awayScore}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-4.5 rounded-xs border border-border/30 overflow-hidden shrink-0">
                <AvatarImage src={getTeamFlagUrl({ teamName: match.awayTeam }, 20)} alt={match.awayTeam} className="object-cover" />
                <AvatarFallback>{match.awayTeam.slice(0, 3).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "truncate font-semibold text-start",
                  awayMuted && "text-muted-foreground"
                )}
              >
                {match.awayTeam}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-center justify-center gap-3">
            <div className="flex items-center gap-2 min-w-0 justify-end flex-1">
              <span className="truncate font-semibold">{match.homeTeam}</span>
              <Avatar className="size-4.5 rounded-xs border border-border/30 overflow-hidden shrink-0">
                <AvatarImage src={getTeamFlagUrl({ teamName: match.homeTeam }, 20)} alt={match.homeTeam} className="object-cover" />
                <AvatarFallback>{match.homeTeam.slice(0, 3).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground uppercase tracking-widest">{t("common.vs")}</span>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="size-4.5 rounded-xs border border-border/30 overflow-hidden shrink-0">
                <AvatarImage src={getTeamFlagUrl({ teamName: match.awayTeam }, 20)} alt={match.awayTeam} className="object-cover" />
                <AvatarFallback>{match.awayTeam.slice(0, 3).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate font-semibold">{match.awayTeam}</span>
            </div>
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
  const { t } = useTranslation()
  const isLive = match.status === "live"
  const hasScores = match.status !== "upcoming"
  const homeScore = match.homeScore ?? 0
  const awayScore = match.awayScore ?? 0
  const winner = hasScores ? getMatchWinner(homeScore, awayScore) : null

  const footerMessage =
    match.status === "finished"
      ? t("liveRush.footer.finished")
      : match.status === "live"
        ? t("liveRush.footer.live")
        : t("liveRush.footer.upcoming")

  const kickoffDescription =
    match.status === "live"
      ? t("matchCard.liveKickoff", { label: match.kickoffLabel })
      : match.kickoffLabel

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
          {match.group
            ? t("common.group", { group: match.group })
            : t("common.knockout")}{" "}
          · {kickoffDescription}
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
        <div className="text-muted-foreground">{footerMessage}</div>
      </CardFooter>
    </Card>
  )
})
