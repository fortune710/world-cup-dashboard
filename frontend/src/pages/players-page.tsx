import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, SortingState, VisibilityState } from "@tanstack/react-table"

import { PlayerPerformanceCard, type PlayerPerformance } from "@/components/player-performance-card"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  SearchIcon,
  ArrowUpDownIcon,
} from "lucide-react"

import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"

// ─── Top highlights (hero cards) ───────────────────────────────────────────────

const mockPlayerData: PlayerPerformance[] = [
  {
    name: "Kylian Mbappé",
    position: "FWD",
    country: "FRA",
    rating: 9.5,
    goals: 12,
    assists: 5,
    category: "Top Goalscorer",
    federation: "UEFA",
    group: "A",
    avatar:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Kylian_Mbapp%C3%A9_-_20220917161011.jpg/250px-Kylian_Mbapp%C3%A9_-_20220917161011.jpg",
  },
  {
    name: "Lionel Messi",
    position: "FWD",
    country: "ARG",
    rating: 9.2,
    goals: 10,
    assists: 8,
    category: "Most Assists",
    federation: "CONMEBOL",
    group: "B",
    avatar:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel_Messi_in_2023.jpg/250px-Lionel_Messi_in_2023.jpg",
  },
  {
    name: "Cristiano Ronaldo",
    position: "FWD",
    country: "POR",
    rating: 9.0,
    goals: 8,
    assists: 4,
    category: "Top Rated",
    federation: "UEFA",
    group: "C",
    avatar:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Cristiano_Ronaldo_-_20220402153727.jpg/250px-Cristiano_Ronaldo_-_20220402153727.jpg",
  },
  {
    name: "Marc-Andre ter Stegen",
    position: "GK",
    country: "GER",
    rating: 9.0,
    goals: 0,
    assists: 0,
    cleanSheets: 5,
    category: "Most Clean Sheets",
    federation: "UEFA",
    group: "C",
    avatar:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Cristiano_Ronaldo_-_20220402153727.jpg/250px-Cristiano_Ronaldo_-_20220402153727.jpg",
  },
]

// ─── Full player roster (data table) ───────────────────────────────────────────

export interface PlayerRow {
  id: number
  name: string
  position: string
  country: string
  federation: string
  group: string
  gamesPlayed: number
  minutesPlayed: number
  goals: number
  assists: number
  xg: number
  xa: number
  yellowCards: number
  redCards: number
  rating: number
  injuryStatus: "Fit" | "injured" | "questionable"
  cleanSheets?: number
  avatar?: string
}

const mockTableData: PlayerRow[] = [
  {
    id: 1,
    name: "Kylian Mbappé",
    position: "FWD",
    country: "FRA",
    federation: "UEFA",
    group: "A",
    gamesPlayed: 7,
    minutesPlayed: 612,
    goals: 12,
    assists: 5,
    xg: 10.34,
    xa: 4.21,
    yellowCards: 1,
    redCards: 0,
    rating: 9.47,
    injuryStatus: "Fit",
    avatar:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Kylian_Mbapp%C3%A9_-_20220917161011.jpg/250px-Kylian_Mbapp%C3%A9_-_20220917161011.jpg",
  },
  {
    id: 2,
    name: "Lionel Messi",
    position: "FWD",
    country: "ARG",
    federation: "CONMEBOL",
    group: "B",
    gamesPlayed: 7,
    minutesPlayed: 598,
    goals: 10,
    assists: 8,
    xg: 8.12,
    xa: 7.44,
    yellowCards: 2,
    redCards: 0,
    rating: 9.23,
    injuryStatus: "Fit",
    avatar:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel_Messi_in_2023.jpg/250px-Lionel_Messi_in_2023.jpg",
  },
  {
    id: 3,
    name: "Cristiano Ronaldo",
    position: "FWD",
    country: "POR",
    federation: "UEFA",
    group: "C",
    gamesPlayed: 6,
    minutesPlayed: 521,
    goals: 8,
    assists: 4,
    xg: 7.88,
    xa: 3.05,
    yellowCards: 1,
    redCards: 0,
    rating: 9.01,
    injuryStatus: "questionable",
    avatar:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Cristiano_Ronaldo_-_20220402153727.jpg/250px-Cristiano_Ronaldo_-_20220402153727.jpg",
  },
  {
    id: 4,
    name: "Marc-Andre ter Stegen",
    position: "GK",
    country: "GER",
    federation: "UEFA",
    group: "C",
    gamesPlayed: 6,
    minutesPlayed: 540,
    goals: 0,
    assists: 0,
    xg: 0.0,
    xa: 0.0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 5,
    rating: 8.99,
    injuryStatus: "Fit",
  },
  {
    id: 5,
    name: "Erling Haaland",
    position: "FWD",
    country: "NOR",
    federation: "UEFA",
    group: "D",
    gamesPlayed: 5,
    minutesPlayed: 436,
    goals: 7,
    assists: 2,
    xg: 6.91,
    xa: 1.72,
    yellowCards: 0,
    redCards: 0,
    rating: 8.82,
    injuryStatus: "Fit",
  },
  {
    id: 6,
    name: "Vinicius Junior",
    position: "FWD",
    country: "BRA",
    federation: "CONMEBOL",
    group: "E",
    gamesPlayed: 7,
    minutesPlayed: 607,
    goals: 6,
    assists: 6,
    xg: 5.44,
    xa: 5.19,
    yellowCards: 3,
    redCards: 0,
    rating: 8.91,
    injuryStatus: "injured",
  },
  {
    id: 7,
    name: "Virgil van Dijk",
    position: "DEF",
    country: "NED",
    federation: "UEFA",
    group: "F",
    gamesPlayed: 7,
    minutesPlayed: 630,
    goals: 2,
    assists: 1,
    xg: 1.65,
    xa: 0.88,
    yellowCards: 1,
    redCards: 0,
    cleanSheets: 4,
    rating: 8.71,
    injuryStatus: "Fit",
  },
  {
    id: 8,
    name: "Kevin De Bruyne",
    position: "MID",
    country: "BEL",
    federation: "UEFA",
    group: "G",
    gamesPlayed: 6,
    minutesPlayed: 512,
    goals: 3,
    assists: 9,
    xg: 2.81,
    xa: 8.34,
    yellowCards: 1,
    redCards: 0,
    rating: 9.11,
    injuryStatus: "Fit",
  },
  {
    id: 9,
    name: "Pedri",
    position: "MID",
    country: "ESP",
    federation: "UEFA",
    group: "A",
    gamesPlayed: 6,
    minutesPlayed: 503,
    goals: 2,
    assists: 7,
    xg: 1.78,
    xa: 6.22,
    yellowCards: 2,
    redCards: 0,
    rating: 8.64,
    injuryStatus: "questionable",
  },
  {
    id: 10,
    name: "Rúben Dias",
    position: "DEF",
    country: "POR",
    federation: "UEFA",
    group: "C",
    gamesPlayed: 6,
    minutesPlayed: 540,
    goals: 1,
    assists: 0,
    xg: 0.94,
    xa: 0.11,
    yellowCards: 2,
    redCards: 1,
    cleanSheets: 4,
    rating: 8.53,
    injuryStatus: "Fit",
  },
  {
    id: 11,
    name: "Alisson Becker",
    position: "GK",
    country: "BRA",
    federation: "CONMEBOL",
    group: "E",
    gamesPlayed: 7,
    minutesPlayed: 630,
    goals: 0,
    assists: 0,
    xg: 0.0,
    xa: 0.0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 4,
    rating: 8.78,
    injuryStatus: "Fit",
  },
  {
    id: 12,
    name: "Jude Bellingham",
    position: "MID",
    country: "ENG",
    federation: "UEFA",
    group: "B",
    gamesPlayed: 7,
    minutesPlayed: 587,
    goals: 5,
    assists: 4,
    xg: 4.52,
    xa: 3.67,
    yellowCards: 1,
    redCards: 0,
    rating: 9.03,
    injuryStatus: "Fit",
  },
  {
    id: 13,
    name: "Lautaro Martínez",
    position: "FWD",
    country: "ARG",
    federation: "CONMEBOL",
    group: "B",
    gamesPlayed: 7,
    minutesPlayed: 571,
    goals: 5,
    assists: 3,
    xg: 4.88,
    xa: 2.41,
    yellowCards: 2,
    redCards: 0,
    rating: 8.72,
    injuryStatus: "Fit",
  },
  {
    id: 14,
    name: "Trent Alexander-Arnold",
    position: "DEF",
    country: "ENG",
    federation: "UEFA",
    group: "B",
    gamesPlayed: 7,
    minutesPlayed: 621,
    goals: 1,
    assists: 5,
    xg: 0.78,
    xa: 4.63,
    yellowCards: 1,
    redCards: 0,
    cleanSheets: 3,
    rating: 8.61,
    injuryStatus: "Fit",
  },
  {
    id: 15,
    name: "Manuel Neuer",
    position: "GK",
    country: "GER",
    federation: "UEFA",
    group: "C",
    gamesPlayed: 6,
    minutesPlayed: 540,
    goals: 0,
    assists: 0,
    xg: 0.0,
    xa: 0.0,
    yellowCards: 1,
    redCards: 0,
    cleanSheets: 3,
    rating: 8.41,
    injuryStatus: "Fit",
  },
]

function createPlayerColumns(t: any): ColumnDef<PlayerRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-semibold text-foreground hover:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Player
          <ArrowUpDownIcon className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const player = row.original
        const initials = player.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
        return (
          <div className="flex items-center gap-2.5 min-w-44">
            <Avatar className="size-8 rounded-full border border-border/50 overflow-hidden shrink-0">
              <AvatarImage src={player.avatar} alt={player.name} className="object-cover" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate">{player.name}</span>
              <span className="text-xs text-muted-foreground">{player.position}</span>
            </div>
          </div>
        )
      },
      enableHiding: false,
    },
    {
      accessorKey: "position",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-semibold text-foreground hover:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Position
          <ArrowUpDownIcon className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold border-primary/50 dark:border-primary/20  bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/80">
          {row.original.position}
        </Badge>
      ),
    },
    {
      accessorKey: "country",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-semibold text-foreground hover:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Country
          <ArrowUpDownIcon className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const flagUrl = getTeamFlagUrl({ idCountry: row.original.country, teamName: "" }, 40)
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-5 rounded-xs border border-border/50 overflow-hidden shrink-0">
              <AvatarImage src={flagUrl} alt={row.original.country} className="object-cover" />
              <AvatarFallback>{row.original.country}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm text-foreground">{row.original.country}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "federation",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-semibold text-foreground hover:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fed.
          <ArrowUpDownIcon className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm font-medium">{row.original.federation}</span>
      ),
    },
    {
      accessorKey: "group",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-semibold text-foreground hover:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Group
          <ArrowUpDownIcon className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-foreground text-sm font-medium">Group {row.original.group}</span>
      ),
    },
    {
      accessorKey: "goals",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Goals
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">{row.original.goals}</div>
      ),
    },
    {
      accessorKey: "assists",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assists
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">{row.original.assists}</div>
      ),
    },
    {
      accessorKey: "cleanSheets",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            CS
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">
          {row.original.cleanSheets !== undefined ? row.original.cleanSheets : "—"}
        </div>
      ),
    },
    {
      accessorKey: "xg",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            xG
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-medium tabular-nums text-muted-foreground">{row.original.xg.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "xa",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            xA
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-medium tabular-nums text-muted-foreground">{row.original.xa.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "rating",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rating
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-bold tabular-nums ">{row.original.rating.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "yellowCards",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            YC
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">{row.original.yellowCards}</div>
      ),
    },
    {
      accessorKey: "redCards",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            RC
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">{row.original.redCards}</div>
      ),
    },
    {
      accessorKey: "injuryStatus",
      header: ({ column }) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const status = row.original.injuryStatus
        return (
          <div className="flex justify-center">
            {status === "Fit" ? (
              <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 font-semibold capitalize px-2 py-0.5">
                Fit
              </Badge>
            ) : status === "questionable" ? (
              <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-semibold capitalize px-2 py-0.5">
                Questionable
              </Badge>
            ) : (
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold capitalize px-2 py-0.5">
                Injured
              </Badge>
            )}
          </div>
        )
      },
    },
  ]
}

export function PlayersPage() {
  const { t } = useTranslation()
  const [positionTab, setPositionTab] = React.useState<string>("all")
  const [globalFilter, setGlobalFilter] = React.useState<string>("")
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "rating", desc: true },
  ])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const columns = React.useMemo(() => createPlayerColumns(t), [t])

  // Filter mock data by active position tab
  const filteredByPosition = React.useMemo(() => {
    if (positionTab === "all") return mockTableData
    return mockTableData.filter((player) => player.position === positionTab)
  }, [positionTab])

  const table = useReactTable({
    data: filteredByPosition,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      if (typeof value === "string") {
        return value.toLowerCase().includes(filterValue.toLowerCase())
      }
      return false
    },
  })

  const handleTabChange = React.useCallback((value: string) => {
    setPositionTab(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [])

  return (
    <div className="flex flex-col gap-3 px-4 py-4 md:px-6 md:py-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("routes.players")}</h1>
        <p className="text-sm text-muted-foreground">{t("pages.players.description")}</p>
      </div>

      {/* Highlight cards */}
      <PlayerPerformanceCard playerPerformance={mockPlayerData} />

      {/* Full player table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>
                Detailed tournament stats including expected goals (xG), assists, discipline, and physical fitness.
              </CardDescription>
            </div>

            {/* Actions: Search and Column Visibility */}

          </div>

          {/* Position Tabs */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Column selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Columns3Icon className="mr-2 size-4" />
                    {t("common.columns")}
                    <ChevronDownIcon className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
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
                        {column.id === "yellowCards"
                          ? "Yellow Cards"
                          : column.id === "redCards"
                            ? "Red Cards"
                            : column.id === "cleanSheets"
                              ? "Clean Sheets"
                              : column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Tabs value={positionTab} onValueChange={handleTabChange} >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all" className="px-6">ALL</TabsTrigger>
                <TabsTrigger value="FWD" className="px-6">FWD</TabsTrigger>
                <TabsTrigger value="MID" className="px-6">MID</TabsTrigger>
                <TabsTrigger value="DEF" className="px-6">DEF</TabsTrigger>
                <TabsTrigger value="GK" className="px-6">GK</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-0">
          <div className="overflow-x-auto rounded-lg border bg-card/50">
            <Table>
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
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No players found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {table.getFilteredRowModel().rows.length} players
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="players-page-size" className="text-sm font-medium">
                  {t("common.rows")}
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-20"
                    id="players-page-size"
                  >
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[5, 10, 20, 50].map((pageSize) => (
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
                  <ChevronsLeftIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">{t("common.goToPreviousPage")}</span>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">{t("common.goToNextPage")}</span>
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">{t("common.goToLastPage")}</span>
                  <ChevronsRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
