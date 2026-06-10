import * as React from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
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
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  LayoutGridIcon,
  ListIcon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { TeamForm } from "@/components/team-form"
import { useWc26Teams } from "@/hooks/use-wc26-teams"
import { getTeamHref, getTeamFlagUrl } from "@/lib/teams/wc26-teams"
import type { Wc26TeamRow } from "@/lib/teams/wc26-teams"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type TeamsViewMode = "list" | "cards"

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

function createTeamsColumns(t: TFunction): ColumnDef<Wc26TeamRow>[] {
  return [
    {
      id: "serial",
      header: () => <div className="w-10">#</div>,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.index + 1}
        </span>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "teamName",
      header: t("common.team"),
      cell: ({ row }) => {
        const team = row.original
        return (
          <div className="flex items-center gap-2.5 min-w-40">
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
          </div>
        )
      },
      enableHiding: false,
    },
    {
      accessorKey: "group",
      header: t("teamsPage.group"),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="tabular-nums group-hover:border-primary/40 group-hover:text-primary"
        >
          {row.original.group}
        </Badge>
      ),
    },
    {
      accessorKey: "fifaRank",
      header: () => <div className="text-end">{t("teamsPage.fifaRank")}</div>,
      cell: ({ row }) => (
        <div className="text-end font-medium tabular-nums">
          {row.original.fifaRank != null ? row.original.fifaRank : "—"}
        </div>
      ),
    },
    {
      id: "rankChange",
      header: () => <span className="sr-only">{t("common.rankChange")}</span>,
      cell: ({ row }) => <RankChangeBadge change={row.original.rankChange} />,
      enableSorting: false,
    },
    {
      accessorKey: "confederation",
      header: () => (
        <div className="hidden text-end sm:table-cell">
          {t("common.confederation")}
        </div>
      ),
      cell: ({ row }) => (
        <div className="hidden text-end text-muted-foreground sm:table-cell">
          {row.original.confederation ?? "—"}
        </div>
      ),
    },
    {
      accessorKey: "fifaPoints",
      header: () => <div className="text-end">{t("teamsPage.points")}</div>,
      cell: ({ row }) => (
        <div className="text-end font-medium tabular-nums">
          {row.original.fifaPoints != null
            ? row.original.fifaPoints.toFixed(2)
            : "—"}
        </div>
      ),
    },
    {
      id: "form",
      header: () => (
        <div>
          <span>{t("common.form")}</span>
          <span className="sr-only">{t("common.formLast5SrOnly")}</span>
        </div>
      ),
      cell: ({ row }) => <TeamForm form={row.original.form} />,
      enableSorting: false,
    },
    {
      accessorKey: "groupStageElo",
      header: () => (
        <div className="hidden text-end lg:table-cell">
          {t("teamsPage.groupStageElo")}
        </div>
      ),
      cell: ({ row }) => (
        <div className="hidden text-end font-medium tabular-nums lg:table-cell">
          {row.original.groupStageElo != null ? row.original.groupStageElo : "—"}
        </div>
      ),
    },
  ]
}

export function TeamsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = React.useState<TeamsViewMode>("list")
  const { teams: sortedTeams, errorMessage, isLoading } = useWc26Teams()

  const columns = React.useMemo(() => createTeamsColumns(t), [t])

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "fifaRank", desc: false },
  ])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 24,
  })

  const table = useReactTable({
    data: sortedTeams,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => `${row.group}-${row.teamName}`,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // For cards view, use the same paginated data from the table
  const pagedTeams = React.useMemo(
    () => table.getRowModel().rows.map((row) => row.original),
    [table.getRowModel().rows]
  )

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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns3Icon data-icon="inline-start" />
                    {t("common.columns")}
                    <ChevronDownIcon data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => {
                      const team = row.original
                      const teamHref = getTeamHref(team)

                      const handleRowNavigate = () => {
                        navigate(teamHref)
                      }

                      return (
                        <TableRow
                          key={row.id}
                          role="link"
                          tabIndex={0}
                          className={cn(
                            "group cursor-pointer transition-colors",
                            "hover:!bg-primary/10",
                            "focus-visible:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          )}
                          onClick={handleRowNavigate}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              handleRowNavigate()
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {t("teamsPage.noTeams", { defaultValue: "No teams found." })}
                      </TableCell>
                    </TableRow>
                  )}
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
                        "transition-colors group-hover:bg-primary/10",
                        team.fifaRank != null &&
                          team.fifaRank <= 10 &&
                          "border-primary/30 group-hover:border-primary/50"
                      )}
                    >
                      <CardHeader className="space-y-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6 rounded-xs border border-border/30 overflow-hidden shrink-0 group-hover:border-primary/30">
                                <AvatarImage src={getTeamFlagUrl(team, 40)} alt={team.teamName} className="object-cover" />
                                <AvatarFallback>{team.idCountry ?? "—"}</AvatarFallback>
                              </Avatar>
                              <Badge variant="secondary" className="tabular-nums shrink-0">
                                {team.fifaRank != null ? `#${team.fifaRank}` : "—"}
                              </Badge>
                              <span className="truncate font-semibold">
                                {team.teamName}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
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
                            <TeamForm form={team.form} />
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t("common.teamsRankedSorted", {
                  count: sortedTeams.length,
                  sort: sorting[0]?.id ?? "rank",
                })}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="teams-page-size" className="text-sm font-medium">
                    {t("common.rows")}
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-20"
                      id="teams-page-size"
                    >
                      <SelectValue
                        placeholder={table.getState().pagination.pageSize}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      <SelectGroup>
                        {PAGE_SIZES.map((size) => (
                          <SelectItem key={size} value={`${size}`}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm font-medium tabular-nums">
                  {t("common.pageOf", {
                    current: table.getState().pagination.pageIndex + 1,
                    total: table.getPageCount(),
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">{t("common.goToFirstPage")}</span>
                    <ChevronsLeftIcon />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">{t("common.goToPreviousPage")}</span>
                    <ChevronLeftIcon />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">{t("common.goToNextPage")}</span>
                    <ChevronRightIcon />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">{t("common.goToLastPage")}</span>
                    <ChevronsRightIcon />
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
