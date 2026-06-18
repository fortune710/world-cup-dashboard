/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"
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
import { usePlayers } from "@/hooks/use-players"
import { useDebounce } from "@/hooks/use-debounce"
import { useTopPerformers } from "@/hooks/use-top-performers"
import { PlayerCardSkeleton } from "@/components/skeletons/player-card-skeleton"
import { PlayerTableSkeleton } from "@/components/skeletons/player-table-skeleton"
import { ErrorState } from "@/components/error-state"
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
import type { Classification, DisplayPosition, RadarRole } from "@/lib/players/player-mapping"
import type { PlayerStatistics } from "@/types/player-statistics"

export interface MatchPerformance {
  matchName: string
  opponent: string
  rating: number
  goals: number
  assists: number
  minutesPlayed: number
  cleanSheet?: boolean
  formScore: number
  tackles?: number
  interceptions?: number
  saves?: number
}

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
  saves?: number
  avatar?: string
  matchHistory?: MatchPerformance[]
  classification?: Classification
  positions?: string
  displayPosition?: DisplayPosition
  radarRole?: RadarRole
  statistics?: PlayerStatistics
}

export function getPlayerMatchHistory(player: PlayerRow): MatchPerformance[] {
  if (player.matchHistory) return player.matchHistory

  const seed = player.id
  const numMatches = player.gamesPlayed
  if (numMatches <= 0) return []

  // Deterministic random generator seeded by player ID
  const random = (s: number) => {
    const x = Math.sin(s) * 10000
    return x - Math.floor(x)
  }

  const matches: MatchPerformance[] = []
  const opponentPool = ["ARG", "BRA", "FRA", "GER", "ESP", "POR", "ENG", "ITA", "NED", "BEL", "CRO", "URU", "SEN", "USA", "MEX", "JPN"]
  const validOpponents = opponentPool.filter((op) => op !== player.country)

  let goalsLeft = player.goals
  let assistsLeft = player.assists
  let savesLeft = player.saves || 0

  for (let i = 0; i < numMatches; i++) {
    const isKnockout = i >= 3
    let matchName = `Group Match ${i + 1}`
    if (isKnockout) {
      if (i === 3) matchName = "Round of 16"
      else if (i === 4) matchName = "Quarter-final"
      else if (i === 5) matchName = "Semi-final"
      else if (i === 6) matchName = "Final"
    }

    const opponentIndex = Math.floor(random(seed + i * 10) * validOpponents.length)
    const opponent = validOpponents[opponentIndex] || "OPP"

    const fluctuation = (random(seed + i * 20) - 0.5) * 2.4
    const matchRating = Math.max(5.0, Math.min(10.0, player.rating + fluctuation))

    let matchGoals = 0
    if (goalsLeft > 0) {
      const chance = random(seed + i * 30)
      if (i === numMatches - 1) {
        matchGoals = goalsLeft
      } else if (chance > 0.6) {
        matchGoals = Math.min(goalsLeft, chance > 0.9 ? 2 : 1)
      }
      goalsLeft -= matchGoals
    }

    let matchAssists = 0
    if (assistsLeft > 0) {
      const chance = random(seed + i * 40)
      if (i === numMatches - 1) {
        matchAssists = assistsLeft
      } else if (chance > 0.6) {
        matchAssists = Math.min(assistsLeft, chance > 0.9 ? 2 : 1)
      }
      assistsLeft -= matchAssists
    }

    const avgMinutes = player.minutesPlayed / numMatches
    let matchMinutes = 90
    if (avgMinutes < 80) {
      const minsChance = random(seed + i * 50)
      matchMinutes = minsChance > 0.5 ? 90 : Math.round(avgMinutes + (minsChance - 0.5) * 30)
    }
    matchMinutes = Math.max(15, Math.min(120, matchMinutes))

    let matchCleanSheet: boolean | undefined = undefined
    if (player.position === "GK" || player.position === "DEF") {
      if (player.cleanSheets !== undefined) {
        const csChance = random(seed + i * 60)
        const totalCs = player.cleanSheets
        const isCs = (csChance * numMatches) < totalCs
        matchCleanSheet = isCs
      } else {
        matchCleanSheet = matchRating > 7.5
      }
    }

    let matchTackles: number | undefined = undefined
    let matchInterceptions: number | undefined = undefined
    let matchSaves: number | undefined = undefined

    if (player.position === "DEF") {
      matchTackles = Math.floor(random(seed + i * 70) * 5) + 1
      matchInterceptions = Math.floor(random(seed + i * 80) * 4) + 1
    } else if (player.position === "GK") {
      if (i === numMatches - 1) {
        matchSaves = savesLeft
      } else {
        const avgSaves = savesLeft / (numMatches - i)
        const chance = random(seed + i * 90)
        matchSaves = Math.floor(avgSaves * 0.5 + chance * avgSaves)
        matchSaves = Math.min(savesLeft, matchSaves)
      }
      savesLeft -= matchSaves
    }

    let formScore = matchRating
    if (player.position === "FWD" || player.position === "MID") {
      formScore += matchGoals * 1.2 + matchAssists * 0.8
    } else if (player.position === "DEF") {
      const defensiveActionCount = (matchTackles || 0) + (matchInterceptions || 0)
      formScore += defensiveActionCount * 0.2 + (matchCleanSheet ? 1.0 : 0)
    } else if (player.position === "GK") {
      formScore += (matchSaves || 0) * 0.15 + (matchCleanSheet ? 1.5 : 0)
    }
    formScore = Math.max(0, Math.min(10.0, formScore))

    matches.push({
      matchName,
      opponent,
      rating: Number(matchRating.toFixed(2)),
      goals: matchGoals,
      assists: matchAssists,
      minutesPlayed: matchMinutes,
      cleanSheet: matchCleanSheet,
      formScore: Number(formScore.toFixed(2)),
      tackles: matchTackles,
      interceptions: matchInterceptions,
      saves: matchSaves,
    })
  }

  const currentAverage = matches.reduce((acc, m) => acc + m.rating, 0) / numMatches
  const difference = player.rating - currentAverage
  matches.forEach((m) => {
    m.rating = Number(Math.max(3.0, Math.min(10.0, m.rating + difference)).toFixed(2))
    let fScore = m.rating
    if (player.position === "FWD" || player.position === "MID") {
      fScore += m.goals * 1.2 + m.assists * 0.8
    } else if (player.position === "DEF") {
      const defensiveActionCount = (m.tackles || 0) + (m.interceptions || 0)
      fScore += defensiveActionCount * 0.2 + (m.cleanSheet ? 1.0 : 0)
    } else if (player.position === "GK") {
      fScore += (m.saves || 0) * 0.15 + (m.cleanSheet ? 1.5 : 0)
    }
    m.formScore = Number(Math.max(0, Math.min(10.0, fScore)).toFixed(2))
  })

  return matches
}

function getPlayerHref(id: number): string {
  return `/players/${id}`
}

function createPlayerColumns(): ColumnDef<PlayerRow>[] {
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
      accessorKey: "gamesPlayed",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Apps
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">{row.original.gamesPlayed}</div>
      ),
    },
    {
      accessorKey: "minutesPlayed",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mins
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">{row.original.minutesPlayed}</div>
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
      accessorKey: "saves",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-semibold text-foreground hover:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Saves
            <ArrowUpDownIcon className="ml-2 size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end font-semibold tabular-nums text-foreground">
          {row.original.saves !== undefined ? row.original.saves : "—"}
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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const globalFilter = searchParams.get("search") ?? ""
  const positionTab = searchParams.get("position") ?? "all"
  const rawPage = Number(searchParams.get("page") ?? "1")
  const page = (!Number.isNaN(rawPage) && rawPage >= 1) ? Math.floor(rawPage) : 1
  const teamFilter = searchParams.get("team") ?? ""

  const setGlobalFilter = React.useCallback((value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set("search", value)
      } else {
        next.delete("search")
      }
      next.delete("page")
      return next
    })
  }, [setSearchParams])

  const setPositionTab = React.useCallback((value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value && value !== "all") {
        next.set("position", value)
      } else {
        next.delete("position")
      }
      next.delete("page")
      return next
    })
  }, [setSearchParams])

  const setPage = React.useCallback((value: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", String(value))
      return next
    })
  }, [setSearchParams])

  const debouncedFilter = useDebounce(globalFilter, 300)
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "rating", desc: true },
  ])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pageSize, setPageSize] = React.useState(10)

  const columns = React.useMemo(() => createPlayerColumns(), [])

  const { players, total, isLoading: playersLoading, error: playersError, mutate } = usePlayers({
    limit: 100,
    search: debouncedFilter,
    position: positionTab,
    page: page,
    team: teamFilter,
  })
  const { data: topPerformers, loading: topLoading, error: topError } = useTopPerformers()

  const highlights = React.useMemo(() => {
    if (!topPerformers) return []
    const list: PlayerPerformance[] = []
    
    // 1. Top Goalscorer
    if (topPerformers.goals?.[0]) {
      const g = topPerformers.goals[0]
      list.push({
        name: g.name,
        position: g.position || "FWD",
        country: g.nationality,
        goals: g.value,
        category: "Top Goalscorer",
        avatar: g.avatar,
        federation: g.federation || "UEFA",
        group: g.group || "A",
      })
    }
    // 2. Most Assists
    if (topPerformers.assists?.[0]) {
      const a = topPerformers.assists[0]
      list.push({
        name: a.name,
        position: a.position || "FWD",
        country: a.nationality,
        assists: a.value,
        category: "Most Assists",
        avatar: a.avatar,
        federation: a.federation || "UEFA",
        group: a.group || "A",
      })
    }
    // 3. Top Rated
    if (topPerformers.rating?.[0]) {
      const r = topPerformers.rating[0]
      list.push({
        name: r.name,
        position: r.position || "FWD",
        country: r.nationality,
        rating: r.value,
        category: "Top Rated",
        avatar: r.avatar,
        federation: r.federation || "UEFA",
        group: r.group || "A",
      })
    }
    // 4. Most Saves
    if (topPerformers.saves?.[0]) {
      const s = topPerformers.saves[0]
      list.push({
        name: s.name,
        position: s.position || "GK",
        country: s.nationality,
        saves: s.value,
        category: "Most Saves",
        avatar: s.avatar,
        federation: s.federation || "UEFA",
        group: s.group || "A",
      })
    }
    return list
  }, [topPerformers])

  const filteredByPosition = players;

  const table = useReactTable({
    data: filteredByPosition,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const nextState = updater({
          pageIndex: page - 1,
          pageSize,
        })
        setPage(nextState.pageIndex + 1)
        setPageSize(nextState.pageSize)
      } else {
        setPage(updater.pageIndex + 1)
        setPageSize(updater.pageSize)
      }
    },
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
  }, [setPositionTab])

  const team = searchParams.get("team") ?? ""
  const position = positionTab !== "all" ? positionTab : ""
  const setPosition = React.useCallback((value: string) => {
    setPositionTab(value || "all")
  }, [setPositionTab])

  const hasActiveFilters = !!globalFilter || !!position || !!team
  const resultLabel = playersLoading ? "Searching…" : `${total} player${total !== 1 ? "s" : ""} found`

  return (
    <div className="flex flex-col gap-3 px-4 py-4 md:px-6 md:py-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("routes.players")}</h1>
        <p className="text-sm text-muted-foreground">{t("pages.players.description")}</p>
      </div>

      {/* Highlight cards */}
      {topLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <PlayerCardSkeleton key={i} />
          ))}
        </div>
      ) : topError ? (
        <Card className="p-4">
          <ErrorState message={`Failed to load highlights: ${topError}`} />
        </Card>
      ) : (
        <PlayerPerformanceCard playerPerformance={highlights} />
      )}

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
              <div className="flex flex-col gap-1 w-full sm:w-64">
                <div className="relative w-full">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {hasActiveFilters && (
                  <p className="text-xs text-muted-foreground mt-0.5">{resultLabel}</p>
                )}
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
                              : column.id === "gamesPlayed"
                                ? "Apps"
                                : column.id === "minutesPlayed"
                                  ? "Mins"
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

          {/* Active filter chips & clear all button */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/20">
              {globalFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  Search: {globalFilter}
                  <button onClick={() => setGlobalFilter('')} aria-label="Clear search" className="ml-1 hover:text-destructive cursor-pointer">×</button>
                </span>
              )}
              {position && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  Position: {position}
                  <button onClick={() => setPosition('')} aria-label="Clear position filter" className="ml-1 hover:text-destructive cursor-pointer">×</button>
                </span>
              )}
              {team && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  Team: {team}
                  <button onClick={() => {
                    setSearchParams(prev => {
                      const next = new URLSearchParams(prev);
                      next.delete('team');
                      next.delete('page');
                      return next;
                    });
                  }} aria-label="Clear team filter" className="ml-1 hover:text-destructive cursor-pointer">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setGlobalFilter('');
                  setPosition('');
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.delete('team');
                    next.delete('page');
                    return next;
                  });
                  setPage(1);
                }}
                className="text-xs text-muted-foreground underline hover:text-foreground cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-0">
          {playersLoading ? (
            <PlayerTableSkeleton rows={10} />
          ) : (
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
                  {playersError ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-auto"
                      >
                        <ErrorState message={`Failed to load players: ${playersError}`} onRetry={() => mutate()} />
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => {
                      const playerHref = getPlayerHref(row.original.id)

                      const handleRowNavigate = () => {
                        navigate(playerHref)
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
                        No players found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

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
