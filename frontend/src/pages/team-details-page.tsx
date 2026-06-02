import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"
import {
  ArrowLeftIcon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { TeamForm } from "@/components/team-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useWc26Teams } from "@/hooks/use-wc26-teams"
import { findTeamByRouteId } from "@/lib/teams/wc26-teams"
import { cn } from "@/lib/utils"

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          <Badge variant="secondary" className="tabular-nums">
            {team.fifaRank != null ? `#${team.fifaRank}` : "—"}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{team.teamName}</h1>
          <RankChangeBadge change={team.rankChange} />
        </div>
        <p className="text-sm text-muted-foreground">
          {team.idCountry ?? "—"} · {confed}
        </p>
      </div>

      <Card
        className={cn(
          team.fifaRank != null && team.fifaRank <= 10 && "border-primary/30"
        )}
      >
        <CardHeader>
          <CardTitle>{t("teamDetailsPage.overviewTitle")}</CardTitle>
          <CardDescription>{t("teamDetailsPage.overviewDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">{t("teamsPage.group")}</span>
            <Badge variant="outline" className="tabular-nums">
              {team.group}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">
              {t("teamsPage.fifaRank")}
            </span>
            <span className="font-medium tabular-nums">
              {team.fifaRank != null ? team.fifaRank : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">{t("teamsPage.points")}</span>
            <span className="text-lg font-semibold tabular-nums">
              {team.fifaPoints != null ? team.fifaPoints.toFixed(2) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">
              {t("teamsPage.groupStageElo")}
            </span>
            <span className="font-medium tabular-nums">
              {team.groupStageElo != null ? team.groupStageElo : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
            <span className="text-sm text-muted-foreground">{t("common.form")}</span>
            <TeamForm form={team.form} adaptiveHover />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
