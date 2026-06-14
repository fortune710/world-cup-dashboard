import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import {
  ArrowLeftIcon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useWc26Teams } from "@/hooks/use-wc26-teams"
import { findTeamByRouteId, getTeamFlagUrl } from "@/lib/teams/wc26-teams"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSquadPlayers } from "@/hooks/use-squad-players"
import { useTeamEloHistory } from "@/hooks/use-team-elo-history"
import { TeamEloHistoryChart } from "@/components/team-elo-history-chart"

const RankChangeBadge = React.memo(function RankChangeBadge({
  change,
}: {
  change: number
}) {
  if (change > 0) {
    return (
      <Badge
        variant="outline"
        className="gap-0.5 border-primary/30 text-primary tabular-nums"
      >
        <TrendingUpIcon data-icon="inline-start" />
        +{change}
      </Badge>
    )
  }

  if (change < 0) {
    return (
      <Badge
        variant="outline"
        className="gap-0.5 border-destructive/30 text-destructive tabular-nums"
      >
        <TrendingDownIcon data-icon="inline-start" />
        {change}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-0.5 text-muted-foreground tabular-nums">
      <MinusIcon data-icon="inline-start" />
      0
    </Badge>
  )
})

export function TeamDetailsPage() {
  const { t } = useTranslation()
  const { teamId } = useParams<{ teamId: string }>()
  const { teams, errorMessage, isLoading } = useWc26Teams()

  const team = React.useMemo(
    () => findTeamByRouteId(teams, teamId),
    [teamId, teams]
  )

  const teamCode = team?.idCountry ?? undefined
  const { players: squad, loading: squadLoading, error: squadError } = useSquadPlayers(teamCode)
  const { history: eloHistory, loading: eloLoading, error: eloError } = useTeamEloHistory(teamCode)

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-center h-full w-full gap-2 text-sm text-muted-foreground">
          <Spinner aria-label={t("teamsPage.loading")} />
          {t("teamsPage.loading")}
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to="/teams">
            <ArrowLeftIcon data-icon="inline-start" />
            {t("teamDetailsPage.backToTeams")}
          </Link>
        </Button>
        <p className="text-sm text-destructive">{t("teamsPage.loadFailed")}</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to="/teams">
            <ArrowLeftIcon data-icon="inline-start" />
            {t("teamDetailsPage.backToTeams")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("teamDetailsPage.notFound")}
        </h1>
      </div>
    )
  }

  const confed = team.confederation ?? "—"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/teams">
          <ArrowLeftIcon data-icon="inline-start" />
          {t("teamDetailsPage.backToTeams")}
        </Link>
      </Button>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Avatar className="size-8 rounded-xs border border-border/50 overflow-hidden">
            <AvatarImage src={getTeamFlagUrl(team, 80)} alt={team.teamName} className="object-cover" />
            <AvatarFallback>{team.idCountry ?? "—"}</AvatarFallback>
          </Avatar>
          <Badge variant="default" className="tabular-nums">
            {team.fifaRank != null ? `#${team.fifaRank}` : "—"}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{team.teamName}</h1>
          <RankChangeBadge change={team.rankChange} />
        </div>
        <p className="text-sm text-muted-foreground">
          {team.idCountry ?? "—"} · {confed} · {t("teamsPage.group")} {team.group}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch mt-4">
        <div className="col-span-1 md:col-span-2 flex flex-col">
          <TeamEloHistoryChart history={eloHistory} loading={eloLoading} error={eloError} />
        </div>
        <div className="col-span-1 flex flex-col">
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <CardTitle>{t("teamDetailsPage.squadTitle", { defaultValue: "Team Squad" })}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[260px] pr-2">
              {squadLoading ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Loading squad...
                </div>
              ) : squadError ? (
                <div className="text-destructive text-sm py-4">
                  Error loading squad: {squadError}
                </div>
              ) : squad.length === 0 ? (
                <div className="text-muted-foreground text-sm py-4">
                  No squad players found.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {squad.map((player) => (
                    <Link
                      key={player.id}
                      to={`/players/${player.id}`}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-primary/10 transition-colors border border-transparent hover:border-border/50 group"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7 rounded-full border border-border/50 overflow-hidden shrink-0">
                          <AvatarImage src={player.avatarUrl} alt={player.name} className="object-cover" />
                          <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">{player.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 leading-none border-primary/40 bg-primary/5 text-primary">
                        {player.position}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


    </div >
  )
}
