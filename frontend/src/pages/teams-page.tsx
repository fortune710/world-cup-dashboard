import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import {
  LayoutGridIcon,
  ListIcon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { TeamForm } from "@/components/team-form"
import { useWc26Teams } from "@/hooks/use-wc26-teams"
import { getTeamHref } from "@/lib/teams/wc26-teams"

type TeamsViewMode = "list" | "cards"

const DEFAULT_PAGE_SIZE = 24
const PAGE_SIZES = [12, 24, 48, 96] as const

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

export function TeamsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = React.useState<TeamsViewMode>("list")
  const { teams: sortedTeams, errorMessage, isLoading } = useWc26Teams()

  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState<number>(DEFAULT_PAGE_SIZE)

  const pageCount = Math.max(1, Math.ceil(sortedTeams.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)

  const pagedTeams = React.useMemo(() => {
    const start = safePageIndex * pageSize
    return sortedTeams.slice(start, start + pageSize)
  }, [pageSize, safePageIndex, sortedTeams])

  const handlePageSizeChange = React.useCallback((value: string) => {
    setPageSize(Number(value))
    setPageIndex(0)
  }, [])

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("routes.teams")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("pages.teams.description")}
      </p>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>{t("teamsPage.rankingTitle")}</CardTitle>
              <CardDescription>{t("teamsPage.rankingDescription")}</CardDescription>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => {
                  if (value === "list" || value === "cards") setViewMode(value)
                }}
                variant="outline"
                spacing={0}
                aria-label={t("teamsPage.viewMode")}
              >
                <ToggleGroupItem value="list" aria-label={t("teamsPage.viewList")}>
                  <ListIcon data-icon="inline-start" />
                  {t("teamsPage.list")}
                </ToggleGroupItem>
                <ToggleGroupItem value="cards" aria-label={t("teamsPage.viewCards")}>
                  <LayoutGridIcon data-icon="inline-start" />
                  {t("teamsPage.cards")}
                </ToggleGroupItem>
              </ToggleGroup>

              <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectGroup>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {t("teamsPage.rowsPerPage", { count: size })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner aria-label={t("teamsPage.loading")} />
              {t("teamsPage.loading")}
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{t("teamsPage.loadFailed")}</p>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  {t("common.reload")}
                </Button>
              </div>
            </div>
          ) : viewMode === "list" ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table aria-label={t("teamsPage.tableAriaLabel")}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("teamsPage.serial")}</TableHead>
                    <TableHead>{t("common.team")}</TableHead>
                    <TableHead className="hidden w-16 sm:table-cell">
                      {t("teamsPage.group")}
                    </TableHead>
                    <TableHead className="hidden w-28 sm:table-cell">
                      {t("teamsPage.fifaRank")}
                    </TableHead>
                    <TableHead className="hidden w-28 sm:table-cell">
                      {t("common.rankChange")}
                    </TableHead>
                    <TableHead className="hidden text-end sm:table-cell">
                      {t("common.confederation")}
                    </TableHead>
                    <TableHead className="text-end">{t("teamsPage.points")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("common.form")}
                    </TableHead>
                    <TableHead className="hidden text-end lg:table-cell">
                      {t("teamsPage.groupStageElo")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedTeams.map((team, index) => {
                    const confed = team.confederation ?? "—"
                    const serial = safePageIndex * pageSize + index + 1
                    const teamHref = getTeamHref(team)

                    const handleRowNavigate = () => {
                      navigate(teamHref)
                    }

                    return (
                      <TableRow
                        key={`${team.group}-${team.teamName}`}
                        role="link"
                        tabIndex={0}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          "hover:bg-primary! hover:text-primary-foreground",
                          "focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "hover:[&_td]:text-primary-foreground",
                          "hover:[&_.text-muted-foreground]:text-primary-foreground/90"
                        )}
                        onClick={handleRowNavigate}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            handleRowNavigate()
                          }
                        }}
                      >
                        <TableCell className="font-medium tabular-nums">
                          {serial}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-40">
                            <span className="block truncate font-medium">
                              {team.teamName}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {team.idCountry}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="outline"
                            className="tabular-nums group-hover:border-primary-foreground/40 group-hover:text-primary-foreground"
                          >
                            {team.group}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden font-medium tabular-nums sm:table-cell">
                          {team.fifaRank != null ? team.fifaRank : "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <RankChangeBadge change={team.rankChange} />
                        </TableCell>
                        <TableCell className="hidden text-end sm:table-cell">
                          <span className="text-muted-foreground">{confed}</span>
                        </TableCell>
                        <TableCell className="text-end font-medium tabular-nums">
                          {team.fifaPoints != null ? team.fifaPoints.toFixed(2) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <TeamForm form={team.form} adaptiveHover />
                        </TableCell>
                        <TableCell className="hidden text-end font-medium tabular-nums lg:table-cell">
                          {team.groupStageElo != null ? team.groupStageElo : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pagedTeams.map((team) => {
                const confed = team.confederation ?? "—"
                const teamHref = getTeamHref(team)

                return (
                  <Link
                    key={`${team.group}-${team.teamName}`}
                    to={teamHref}
                    className="group block rounded-4xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Card
                      className={cn(
                        "transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                        "group-hover:[&_.text-muted-foreground]:text-primary-foreground/90",
                        team.fifaRank != null &&
                          team.fifaRank <= 10 &&
                          "border-primary/30 group-hover:border-primary-foreground/40"
                      )}
                    >
                      <CardHeader className="space-y-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="tabular-nums">
                                {team.fifaRank != null ? `#${team.fifaRank}` : "—"}
                              </Badge>
                              <span className="truncate font-semibold">
                                {team.teamName}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {team.idCountry} · {confed}
                            </p>
                          </div>
                          <RankChangeBadge change={team.rankChange} />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                              {t("teamsPage.group")}
                            </span>
                            <span className="font-medium tabular-nums">
                              {team.group}
                            </span>
                          </div>
                          <div className="flex items-end justify-between gap-3">
                            <div className="text-sm text-muted-foreground">
                              {t("teamsPage.points")}
                            </div>
                            <div className="text-lg font-semibold tabular-nums">
                              {team.fifaPoints != null
                                ? team.fifaPoints.toFixed(2)
                                : "—"}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                              {t("common.form")}
                            </span>
                            <TeamForm form={team.form} adaptiveHover />
                          </div>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                              {t("teamsPage.groupStageElo")}
                            </span>
                            <span className="font-medium tabular-nums">
                              {team.groupStageElo != null ? team.groupStageElo : "—"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}

          {!isLoading && !errorMessage ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t("common.teamsRankedSorted", {
                  count: sortedTeams.length,
                  sort: "rank",
                })}
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <div className="text-sm font-medium tabular-nums">
                  {t("common.pageOf", { current: safePageIndex + 1, total: pageCount })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => setPageIndex(0)}
                    disabled={safePageIndex === 0}
                  >
                    <span className="sr-only">{t("common.goToFirstPage")}</span>
                    {"<<"}
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                    disabled={safePageIndex === 0}
                  >
                    <span className="sr-only">{t("common.goToPreviousPage")}</span>
                    {"<"}
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() =>
                      setPageIndex((current) => Math.min(pageCount - 1, current + 1))
                    }
                    disabled={safePageIndex >= pageCount - 1}
                  >
                    <span className="sr-only">{t("common.goToNextPage")}</span>
                    {">"}
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => setPageIndex(pageCount - 1)}
                    disabled={safePageIndex >= pageCount - 1}
                  >
                    <span className="sr-only">{t("common.goToLastPage")}</span>
                    {">>"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
