import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import {
  ArrowLeftIcon,
  TargetIcon,
  AwardIcon,
  StarIcon,
  ClockIcon,
  ActivityIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePlayerDetails } from "@/hooks/use-player-details"
import { useRadarPeers } from "@/hooks/use-radar-peers"
import { ErrorState } from "@/components/error-state"
import * as teams from "@/lib/teams/wc26-teams"
import { positionsToRadarRole, type Classification } from "@/lib/players/player-mapping"

import { ChartRadarGridCircle } from "@/components/player-radar"
import { ChartAreaInteractive } from "@/components/bar-graph"
import { ChartPlayerPercentiles } from "@/components/player-bars"

export function PlayerDetailsPage() {
  const { t } = useTranslation()
  const { playerId } = useParams<{ playerId: string }>()

  const { player, loading, error, refetch } = usePlayerDetails(playerId)
  const role = React.useMemo(() => {
    if (!player) return undefined
    return player.radarRole || positionsToRadarRole(player.positions, player.classification as Classification) || "ST"
  }, [player])
  const { peers, isLoading: peersLoading, error: peersError } = useRadarPeers(role)
  console.log(player)

  const initials = player
    ? player.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
    : ""
  const flagUrl = player
    ? teams.getTeamFlagUrl({ idCountry: player.country, teamName: "" }, 40)
    : ""

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground min-h-[400px]">
        Loading player details...
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to="/players">
            <ArrowLeftIcon data-icon="inline-start" />
            {t("playerDetailsPage.backToPlayers", { defaultValue: "Back to players" })}
          </Link>
        </Button>
        <ErrorState
          message={error ? `Failed to load player details: ${error}` : t("playerDetailsPage.notFound", { defaultValue: "Player not found" })}
          onRetry={error ? refetch : undefined}
        />
      </div>
    )
  }


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/players">
          <ArrowLeftIcon data-icon="inline-start" />
          {t("playerDetailsPage.backToPlayers", { defaultValue: "Back to players" })}
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Avatar className="size-10 rounded-full border border-border/50 overflow-hidden">
            <AvatarImage src={player.avatar} alt={player.name} className="object-cover" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <Badge variant="outline" className="font-semibold border-primary/50 bg-primary/10 text-primary">
            {player.position}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{player.name}</h1>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to={teams.getTeamHref({ idCountry: player.country, teamName: player.country })}
            className="inline-flex items-center gap-1.5 rounded-md  py-0.5 underline cursor-pointer hover:underline-dashed hover:underline-primary"
          >
            <Avatar className="size-5 rounded-xs border border-border/50 overflow-hidden shrink-0">
              <AvatarImage src={flagUrl} alt={player.country} className="object-cover" />
              <AvatarFallback>{player.country}</AvatarFallback>
            </Avatar>
            <span className="font-medium group-hover:underline">{player.country}</span>
          </Link>
          <span>
            · {player.federation} · Group {player.group}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {player.position === "GK" ? (
          <>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>{t("playerDetailsPage.saves", { defaultValue: "Saves" })}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {player.statistics?.saves ?? 0}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TargetIcon className="size-3" />
                    {t("playerDetailsPage.goalsPreventedBadge", { defaultValue: "Prevented" })} {player.statistics?.goals_prevented?.toFixed(2) ?? "0.00"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex items-center gap-2 font-medium">
                  {t("playerDetailsPage.savesAvg", { defaultValue: "Saves per game" })} <TrendingUpIcon className="size-4 text-emerald-500" />
                </div>
                <div className="text-muted-foreground">
                  {t("playerDetailsPage.savesAvgPerGame", { defaultValue: "Avg {{avg}} per game", avg: player.gamesPlayed > 0 ? ((player.statistics?.saves ?? 0) / player.gamesPlayed).toFixed(2) : "0.00" })}
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>{t("playerDetailsPage.cleanSheets", { defaultValue: "Clean Sheets" })}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {player.cleanSheets ?? 0}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AwardIcon className="size-3" />
                    CS
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex items-center gap-2 font-medium">
                  {t("playerDetailsPage.cleanSheetsTotal", { defaultValue: "Total Clean Sheets" })} <TrendingUpIcon className="size-4 text-emerald-500" />
                </div>
                <div className="text-muted-foreground">
                  {t("playerDetailsPage.cleanSheetsAvgPerGame", { defaultValue: "Avg {{avg}} per game", avg: player.gamesPlayed > 0 ? ((player.cleanSheets ?? 0) / player.gamesPlayed).toFixed(2) : "0.00" })}
                </div>
              </CardFooter>
            </Card>
          </>
        ) : (
          <>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>{t("playerDetailsPage.goals", { defaultValue: "Goals" })}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {player.goals}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TargetIcon className="size-3" />
                    {t("playerDetailsPage.xgBadge", { defaultValue: "xG" })} {player.xg.toFixed(2)}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex items-center gap-2 font-medium">
                  {t("playerDetailsPage.expectedGoals", { defaultValue: "Expected Goals (xG)" })} <TrendingUpIcon className="size-4 text-emerald-500" />
                </div>
                <div className="text-muted-foreground">
                  {t("playerDetailsPage.goalsAvgPerGame", { defaultValue: "Avg {{avg}} per game", avg: player.gamesPlayed > 0 ? (player.goals / player.gamesPlayed).toFixed(2) : "0.00" })}
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>{t("playerDetailsPage.assists", { defaultValue: "Assists" })}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {player.assists}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AwardIcon className="size-3" />
                    {t("playerDetailsPage.xaBadge", { defaultValue: "xA" })} {player.xa.toFixed(2)}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex items-center gap-2 font-medium">
                  {t("playerDetailsPage.expectedAssists", { defaultValue: "Expected Assists (xA)" })} <TrendingUpIcon className="size-4 text-emerald-500" />
                </div>
                <div className="text-muted-foreground">
                  {t("playerDetailsPage.assistsAvgPerGame", { defaultValue: "Avg {{avg}} per game", avg: player.gamesPlayed > 0 ? (player.assists / player.gamesPlayed).toFixed(2) : "0.00" })}
                </div>
              </CardFooter>
            </Card>
          </>
        )}

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("playerDetailsPage.apps", { defaultValue: "Apps" })}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {player.gamesPlayed}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="flex items-center gap-1">
                <ActivityIcon className="size-3" />
                {t("playerDetailsPage.appearancesBadge", { defaultValue: "Appearances" })}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex items-center gap-2 font-medium">
              {t("playerDetailsPage.appearancesTitle", { defaultValue: "Appearances" })} <TrendingUpIcon className="size-4 text-emerald-500" />
            </div>
            <div className="text-muted-foreground">
              {t("playerDetailsPage.activeMatches", { defaultValue: "Active tournament matches" })}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("playerDetailsPage.rating", { defaultValue: "Rating" })}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {player.rating.toFixed(2)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="flex items-center gap-1">
                <StarIcon className="size-3" />
                {player.rating >= 9.0
                  ? t("playerDetailsPage.ratingElite", { defaultValue: "Elite" })
                  : player.rating >= 8.5
                    ? t("playerDetailsPage.ratingVeryGood", { defaultValue: "Very Good" })
                    : t("playerDetailsPage.ratingGood", { defaultValue: "Good" })}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex items-center gap-2 font-medium">
              {t("playerDetailsPage.matchAverage", { defaultValue: "Match Average" })} <TrendingUpIcon className="size-4 text-emerald-500" />
            </div>
            <div className="text-muted-foreground">
              {t("playerDetailsPage.topPerformer", { defaultValue: "Top performer in the squad" })}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("playerDetailsPage.minutes", { defaultValue: "Minutes" })}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {player.minutesPlayed}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {t("playerDetailsPage.avgMinutesBadge", {
                  defaultValue: "avg {{mins}}'",
                  mins: player.gamesPlayed > 0 ? Math.round(player.minutesPlayed / player.gamesPlayed) : 0
                })}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex items-center gap-2 font-medium">
              {t("playerDetailsPage.minutesPlayed", { defaultValue: "Minutes Played" })} <ClockIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="text-muted-foreground">
              {t("playerDetailsPage.avgMinutesPerGame", { defaultValue: "Avg {{mins}}m per game", mins: player.gamesPlayed > 0 ? Math.round(player.minutesPlayed / player.gamesPlayed) : 0 })}
            </div>
          </CardFooter>
        </Card>
      </div>


      <ChartAreaInteractive player={player} />



      <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <ChartRadarGridCircle player={player} peers={peers} peersLoading={peersLoading} peersError={peersError} />
        <ChartPlayerPercentiles player={player} peers={peers} peersLoading={peersLoading} />


        <Card>
          <CardHeader>
            <CardTitle>{t("playerDetailsPage.heatmap", { defaultValue: "Heatmap" })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t("playerDetailsPage.cardContent", { defaultValue: "Card content" })}</p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
