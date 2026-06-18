"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import {
  Badge,
} from "@/components/ui/badge"
import {
  Button,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TeamForm } from "@/components/team-form"
import { useWc26Teams } from "@/hooks/use-wc26-teams"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { getTeamFlagUrl, getTeamHref } from "@/lib/teams/wc26-teams"
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

const PAGE_SIZE = 24

export const TeamsEloTable = React.memo(function TeamsEloTable({
  className,
}: {
  className?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { teams, errorMessage, isLoading } = useWc26Teams()
  const [pageIndex, setPageIndex] = React.useState(0)

  React.useEffect(() => {
    logger.info({
      message: "Teams elo table rendered",
      is_loading: isLoading,
      has_error: Boolean(errorMessage),
      team_count: teams.length,
      page_index: pageIndex,
      page_size: PAGE_SIZE,
    })
  }, [errorMessage, isLoading, pageIndex, teams.length])

  const pageCount = Math.max(1, Math.ceil(teams.length / PAGE_SIZE))
  const pagedTeams = React.useMemo(
    () => teams.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE),
    [pageIndex, teams]
  )

  React.useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1))
    }
  }, [pageCount, pageIndex])

  return (
    <div className={cn("flex flex-col gap-4 px-4 lg:px-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle>{t("teamsPage.rankingTitle")}</CardTitle>
            <CardDescription>{t("teamsPage.rankingDescription")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-current" />
              {t("teamsPage.loading")}
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{t("teamsPage.loadFailed")}</p>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table aria-label={t("teamsPage.tableAriaLabel")}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>{t("common.team")}</TableHead>
                      <TableHead>{t("teamsPage.group")}</TableHead>
                      <TableHead className="text-end">{t("teamsPage.fifaRank")}</TableHead>
                      <TableHead className="text-end">{t("common.rankChange")}</TableHead>
                      <TableHead className="hidden text-end sm:table-cell">
                        {t("common.confederation")}
                      </TableHead>
                      <TableHead className="text-end">{t("teamsPage.points")}</TableHead>
                      <TableHead>{t("common.form")}</TableHead>
                      <TableHead className="hidden text-end lg:table-cell">
                        {t("teamsPage.groupStageElo")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedTeams.length ? (
                      pagedTeams.map((team) => {
                        const teamHref = getTeamHref(team)
                        const rank = team.eloRank ?? 0

                        return (
                          <TableRow
                            key={`${team.group}-${team.teamName}`}
                            role="link"
                            tabIndex={0}
                            className={cn(
                              "group cursor-pointer transition-colors",
                              "hover:!bg-primary/10",
                              "focus-visible:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            )}
                            onClick={() => {
                              navigate(teamHref)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                navigate(teamHref)
                              }
                            }}
                          >
                            <TableCell>
                              <span className="font-medium tabular-nums">
                                {rank || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Link
                                to={teamHref}
                                className="flex items-center gap-2.5 min-w-40"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Avatar className="size-6 rounded-xs border border-border/30 overflow-hidden shrink-0 group-hover:border-primary/30">
                                  <AvatarImage
                                    src={getTeamFlagUrl(team, 40)}
                                    alt={team.teamName}
                                    className="object-cover"
                                  />
                                  <AvatarFallback>{team.idCountry ?? "—"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="block truncate font-medium">
                                    {team.teamName}
                                  </span>
                                  <span className="block text-xs text-muted-foreground group-hover:text-foreground">
                                    {team.idCountry}
                                  </span>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="tabular-nums group-hover:border-primary/40 group-hover:text-primary"
                              >
                                {team.group}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-end font-medium tabular-nums">
                              {team.fifaRank != null ? team.fifaRank : "—"}
                            </TableCell>
                            <TableCell className="text-end">
                              {team.rankChange > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="gap-0.5 border-primary/30 text-primary tabular-nums"
                                >
                                  <TrendingUpIcon data-icon="inline-start" />
                                  +{team.rankChange}
                                </Badge>
                              ) : team.rankChange < 0 ? (
                                <Badge
                                  variant="outline"
                                  className="gap-0.5 border-destructive/30 text-destructive tabular-nums"
                                >
                                  <TrendingDownIcon data-icon="inline-start" />
                                  {team.rankChange}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-0.5 text-muted-foreground tabular-nums">
                                  <MinusIcon data-icon="inline-start" />
                                  0
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden text-end text-muted-foreground sm:table-cell">
                              {team.confederation ?? "—"}
                            </TableCell>
                            <TableCell className="text-end font-medium tabular-nums">
                              {team.fifaPoints != null ? team.fifaPoints.toFixed(2) : "—"}
                            </TableCell>
                            <TableCell>
                              <TeamForm form={team.form} />
                            </TableCell>
                            <TableCell className="hidden text-end font-medium tabular-nums lg:table-cell">
                              {team.groupStageElo != null ? Math.round(team.groupStageElo) : "—"}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-24 text-center text-muted-foreground"
                        >
                          {t("teamsPage.noTeams", { defaultValue: "No teams found." })}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  {t("common.teamsRankedSorted", {
                    count: teams.length,
                    sort: "groupStageElo",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Previous page"
                    onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                    disabled={pageIndex === 0}
                  >
                    <ChevronLeftIcon aria-hidden="true" />
                  </Button>
                  <span className="tabular-nums">
                    {pageIndex + 1}/{pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Next page"
                    onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
                    disabled={pageIndex >= pageCount - 1}
                  >
                    <ChevronRightIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
