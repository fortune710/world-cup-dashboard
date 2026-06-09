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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useWc26Teams } from "@/hooks/use-wc26-teams"
import { findTeamByRouteId, getTeamFlagUrl } from "@/lib/teams/wc26-teams"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChartRadarDots } from "@/components/radar-chart"

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[140px] mt-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Feature</CardTitle>

          </CardHeader>
          <CardContent>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Form </CardTitle>

          </CardHeader>
          <CardFooter>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.
          </CardFooter>

        </Card>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows mt-2">
        <ChartRadarDots />
        <div className="col-span-1  ">
        </div>

      </div>


    </div >
  )
}
