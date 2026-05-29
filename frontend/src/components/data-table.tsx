"use client"

import * as React from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
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

import type {
  ConfederationFilter,
  FormBadgeProps,
  FormResult,
  PowerRankingRow,
  PowerRankingTableProps,
  RankChangeBadgeProps,
  TeamFormProps,
} from "@/datatypes"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ELO_RED_CARD_PENALTY,
  ELO_YELLOW_CARD_PENALTY,
  filterPowerRankingsByConfederation,
  formatGoalDifference,
  formatRankChange,
  formatXg,
  getAdjustedElo,
  getDisciplineEloPenalty,
  isTopPowerRank,
  POWER_RANKING_PAGE_SIZES,
  powerRankingRows,
  TOP_POWER_RANK_THRESHOLD,
} from "@/lib/helpers/power-ranking.helpers"
import { cn } from "@/lib/utils"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

export { powerRankingSchema as schema } from "@/datatypes"

const CONFEDERATION_VALUES: ConfederationFilter[] = [
  "all",
  "UEFA",
  "CONMEBOL",
  "CONCACAF",
  "AFC",
  "CAF",
  "OFC",
]

function formatFormLabel(form: FormResult[], t: TFunction): string {
  return form
    .map((result) => {
      if (result === "W") {
        return t("common.win")
      }

      if (result === "D") {
        return t("common.draw")
      }

      return t("common.loss")
    })
    .join(", ")
}

function getConfederationOptions(t: TFunction) {
  return CONFEDERATION_VALUES.map((value) => ({
    value,
    label: value === "all" ? t("common.allConfederations") : value,
  }))
}

const FormBadge = React.memo(function FormBadge({ result }: FormBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex size-4 items-center justify-center rounded-sm text-[9px] font-semibold tabular-nums sm:size-5 sm:text-[10px]",
        result === "W" && "bg-primary/20 text-primary",
        result === "D" && "bg-muted text-muted-foreground",
        result === "L" && "bg-destructive/15 text-destructive"
      )}
    >
      {result}
    </span>
  )
})

const TeamForm = React.memo(function TeamForm({ form }: TeamFormProps) {
  const { t } = useTranslation()

  return (
    <div
      className="flex gap-0.5 sm:gap-1"
      aria-label={t("common.last5Results", {
        results: formatFormLabel(form, t),
      })}
    >
      {form.map((result, index) => (
        <FormBadge key={`${result}-${index}`} result={result} />
      ))}
    </div>
  )
})

const EloRatingCell = React.memo(function EloRatingCell({
  row,
}: {
  row: PowerRankingRow
}) {
  const { t } = useTranslation()
  const penalty = getDisciplineEloPenalty(row)
  const adjustedElo = getAdjustedElo(row)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default text-end font-medium tabular-nums">
          {adjustedElo}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-xs">
        {t("powerRanking.eloTooltip.base", { elo: row.baseElo })}
        {penalty > 0
          ? t("powerRanking.eloTooltip.discipline", {
              penalty,
              yellow: row.yellowCards,
              yellowPenalty: ELO_YELLOW_CARD_PENALTY,
              red: row.redCards,
              redPenalty: ELO_RED_CARD_PENALTY,
            })
          : t("powerRanking.eloTooltip.none")}
      </TooltipContent>
    </Tooltip>
  )
})

const RankChangeBadge = React.memo(function RankChangeBadge({
  change,
}: RankChangeBadgeProps) {
  if (change > 0) {
    return (
      <Badge
        variant="outline"
        className="gap-0.5 border-primary/30 text-primary tabular-nums"
      >
        <TrendingUpIcon data-icon="inline-start" />
        {formatRankChange(change)}
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
        {formatRankChange(change)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-0.5 text-muted-foreground tabular-nums">
      <MinusIcon data-icon="inline-start" />
      {formatRankChange(change)}
    </Badge>
  )
})

function createPowerRankingColumns(t: TFunction): ColumnDef<PowerRankingRow>[] {
  return [
    {
      accessorKey: "rank",
      header: () => <div className="w-10">#</div>,
      cell: ({ row }) => {
        const rank = row.original.rank
        const isTopTier = isTopPowerRank(rank)

        return (
          <div className="flex items-center gap-2">
            {isTopTier ? (
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full bg-primary",
                  rank === 1 && "size-2.5 ring-2 ring-primary/40"
                )}
                aria-hidden
              />
            ) : (
              <span className="size-2 shrink-0" aria-hidden />
            )}
            <span
              className={cn(
                "font-medium tabular-nums",
                isTopTier ? "text-primary" : "text-muted-foreground"
              )}
            >
              {rank}
            </span>
          </div>
        )
      },
      enableHiding: false,
    },
    {
      id: "rankChange",
      header: () => <span className="sr-only">{t("common.rankChange")}</span>,
      cell: ({ row }) => <RankChangeBadge change={row.original.rankChange} />,
      enableSorting: false,
    },
    {
      accessorKey: "team",
      header: t("common.team"),
      cell: ({ row }) => (
        <div className="flex min-w-32 flex-col gap-1 sm:min-w-36">
          <span className="font-medium">{row.original.team}</span>
          <Badge variant="outline" className="w-fit px-1.5 text-muted-foreground">
            {row.original.code}
          </Badge>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "played",
      header: () => <div className="text-end">GP</div>,
      cell: ({ row }) => (
        <div className="text-end tabular-nums">{row.original.played}</div>
      ),
    },
    {
      accessorKey: "wins",
      header: () => <div className="text-end">W</div>,
      cell: ({ row }) => (
        <div className="text-end tabular-nums">{row.original.wins}</div>
      ),
    },
    {
      accessorKey: "draws",
      header: () => <div className="hidden text-end sm:table-cell">D</div>,
      cell: ({ row }) => (
        <div className="hidden text-end tabular-nums sm:table-cell">
          {row.original.draws}
        </div>
      ),
    },
    {
      accessorKey: "losses",
      header: () => <div className="hidden text-end sm:table-cell">L</div>,
      cell: ({ row }) => (
        <div className="hidden text-end tabular-nums sm:table-cell">
          {row.original.losses}
        </div>
      ),
    },
    {
      accessorKey: "goalsScored",
      header: () => <div className="hidden text-end md:table-cell">GS</div>,
      cell: ({ row }) => (
        <div className="hidden text-end tabular-nums md:table-cell">
          {row.original.goalsScored}
        </div>
      ),
    },
    {
      accessorKey: "goalsAgainst",
      header: () => <div className="hidden text-end md:table-cell">GA</div>,
      cell: ({ row }) => (
        <div className="hidden text-end tabular-nums md:table-cell">
          {row.original.goalsAgainst}
        </div>
      ),
    },
    {
      accessorKey: "goalDifference",
      header: () => <div className="text-end">GD</div>,
      cell: ({ row }) => (
        <div className="text-end tabular-nums">
          {formatGoalDifference(row.original.goalDifference)}
        </div>
      ),
    },
    {
      accessorKey: "xgFor",
      header: () => <div className="hidden text-end lg:table-cell">xG</div>,
      cell: ({ row }) => (
        <div className="hidden text-end tabular-nums lg:table-cell">
          {formatXg(row.original.xgFor)}
        </div>
      ),
    },
    {
      accessorKey: "yellowCards",
      header: () => <div className="hidden text-end xl:table-cell">YC</div>,
      cell: ({ row }) => (
        <div
          className="hidden text-end tabular-nums xl:table-cell"
          aria-label={t("common.yellowCardsCount", {
            count: row.original.yellowCards,
          })}
        >
          {row.original.yellowCards}
        </div>
      ),
    },
    {
      accessorKey: "redCards",
      header: () => <div className="hidden text-end xl:table-cell">RC</div>,
      cell: ({ row }) => (
        <div
          className="hidden text-end tabular-nums xl:table-cell"
          aria-label={t("common.redCardsCount", {
            count: row.original.redCards,
          })}
        >
          {row.original.redCards}
        </div>
      ),
    },
    {
      id: "adjustedElo",
      accessorFn: (row) => getAdjustedElo(row),
      header: () => <div className="text-end">Elo</div>,
      cell: ({ row }) => <EloRatingCell row={row.original} />,
    },
    {
      accessorKey: "form",
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
      accessorKey: "confederation",
      header: () => (
        <div className="hidden text-end xl:table-cell">{t("common.confederation")}</div>
      ),
      cell: ({ row }) => (
        <div className="hidden text-end text-muted-foreground xl:table-cell">
          {row.original.confederation}
        </div>
      ),
    },
  ]
}

export const PowerRankingTable = React.memo(function PowerRankingTable({
  data = powerRankingRows,
  className,
}: PowerRankingTableProps) {
  const { t } = useTranslation()
  const columns = React.useMemo(() => createPowerRankingColumns(t), [t])
  const confederationOptions = React.useMemo(() => getConfederationOptions(t), [t])

  const [confederationFilter, setConfederationFilter] =
    React.useState<ConfederationFilter>("all")
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "rank", desc: false },
  ])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const filteredData = React.useMemo(
    () => filterPowerRankingsByConfederation(data, confederationFilter),
    [confederationFilter, data]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleConfederationChange = React.useCallback((value: string) => {
    setConfederationFilter(value as ConfederationFilter)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [])

  return (
    <div className={cn("flex flex-col gap-4 px-4 lg:px-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle>{t("powerRanking.title")}</CardTitle>
            <CardDescription>
              {t("powerRanking.description", {
                yellowPenalty: ELO_YELLOW_CARD_PENALTY,
                redPenalty: ELO_RED_CARD_PENALTY,
              })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label htmlFor="confederation-filter" className="sr-only">
                {t("common.filterByConfederation")}
              </Label>
              <Select
                value={confederationFilter}
                onValueChange={handleConfederationChange}
              >
                <SelectTrigger id="confederation-filter" className="w-48" size="sm">
                  <SelectValue placeholder={t("common.allConfederations")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {confederationOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
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

          <div className="overflow-x-auto rounded-lg border">
            <Table aria-label={t("powerRanking.tableAriaLabel")}>
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
                    const rank = row.original.rank
                    const isTopTier = isTopPowerRank(rank)

                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          isTopTier &&
                            "border-l-2 border-l-primary bg-primary/5",
                          rank === 1 && "border-l-[3px] bg-primary/10"
                        )}
                        aria-label={
                          isTopTier
                            ? t("powerRanking.topRankAria", {
                                team: row.original.team,
                                threshold: TOP_POWER_RANK_THRESHOLD,
                              })
                            : undefined
                        }
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
                      {t("powerRanking.noTeams")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("common.teamsRankedSorted", {
                count: filteredData.length,
                sort: sorting[0]?.id ?? "rank",
              })}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="rankings-page-size" className="text-sm font-medium">
                  {t("common.rows")}
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-20"
                    id="rankings-page-size"
                  >
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {POWER_RANKING_PAGE_SIZES.map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
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
        </CardContent>
      </Card>
    </div>
  )
})

/** @deprecated Use PowerRankingTable */
export const DataTable = PowerRankingTable
