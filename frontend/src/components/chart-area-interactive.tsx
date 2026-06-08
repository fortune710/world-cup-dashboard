"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GROUPS, type GroupKey, type GroupStageStandingsProps, type StandingsTableProps } from "@/datatypes"
import {
  formatGoalDifference,
  groupStandings,
  isQualificationZone,
} from "@/lib/helpers/standings.helpers"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { getTeamFlagUrl } from "@/lib/teams/wc26-teams"
import { Badge } from "./ui/badge"
const STANDINGS_TEAM_CODES: Record<string, string> = {
  "Argentina": "ARG",
  "Poland": "POL",
  "Mexico": "MEX",
  "Saudi Arabia": "KSA",
  "England": "ENG",
  "United States": "USA",
  "Iran": "IRN",
  "Wales": "WAL",
  "France": "FRA",
  "Australia": "AUS",
  "Tunisia": "TUN",
  "Denmark": "DEN",
  "Japan": "JPN",
  "Spain": "ESP",
  "Germany": "GER",
  "Costa Rica": "CRC",
  "Morocco": "MAR",
  "Croatia": "CRO",
  "Belgium": "BEL",
  "Canada": "CAN",
  "Netherlands": "NED",
  "Senegal": "SEN",
  "Ecuador": "ECU",
  "Qatar": "QAT",
  "Brazil": "BRA",
  "Switzerland": "SUI",
  "Serbia": "SRB",
  "Cameroon": "CMR",
  "Portugal": "POR",
  "South Korea": "KOR",
  "Uruguay": "URU",
  "Ghana": "GHA",
  "Colombia": "COL",
  "Italy": "ITA",
  "Paraguay": "PAR",
  "New Zealand": "NZL",
  "Norway": "NOR",
  "Egypt": "EGY",
  "Chile": "CHI",
  "Panama": "PAN",
  "Nigeria": "NGA",
  "Sweden": "SWE",
  "Peru": "PER",
  "Honduras": "HON",
  "Czech Republic": "CZE",
  "Austria": "AUT",
  "Scotland": "SCO",
  "Jamaica": "JAM",
}

function getTeamCode(teamName: string): string {
  return STANDINGS_TEAM_CODES[teamName] ?? teamName.slice(0, 3).toUpperCase()
}

const StandingsTable = React.memo(function StandingsTable({
  group,
  rows,
}: StandingsTableProps) {
  const { t } = useTranslation()

  return (
    <Table aria-label={t("groupStandings.tableAriaLabel", { group })}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">{t("common.pos")}</TableHead>
          <TableHead>{t("common.team")}</TableHead>
          <TableHead className="text-end">P</TableHead>
          <TableHead className="hidden text-end sm:table-cell">W</TableHead>
          <TableHead className="hidden text-end sm:table-cell">D</TableHead>
          <TableHead className="hidden text-end sm:table-cell">L</TableHead>
          <TableHead className="text-end">GD</TableHead>
          <TableHead className="text-end">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const code = getTeamCode(row.team)
          return (
            <TableRow
              key={row.team}
              className={cn(isQualificationZone(row.position) && "bg-primary/5")}
            >
              <TableCell className="font-medium tabular-nums text-muted-foreground">
                {row.position}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2.5 min-w-32 sm:min-w-36">
                  <Avatar className="size-6 rounded-xs border border-border/50 overflow-hidden shrink-0">
                    <AvatarImage
                      src={getTeamFlagUrl({ idCountry: code, teamName: row.team }, 40)}
                      alt={row.team}
                      className="object-cover"
                    />
                    <AvatarFallback>{code}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium line-clamp-1">{row.team}</span>
                    <Badge variant="outline" className="w-fit px-1 py-0 text-[10px] text-muted-foreground leading-none">
                      {code}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-end tabular-nums">{row.played}</TableCell>
            <TableCell className="hidden text-end tabular-nums sm:table-cell">
              {row.won}
            </TableCell>
            <TableCell className="hidden text-end tabular-nums sm:table-cell">
              {row.drawn}
            </TableCell>
            <TableCell className="hidden text-end tabular-nums sm:table-cell">
              {row.lost}
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {formatGoalDifference(row.goalDifference)}
            </TableCell>
            <TableCell className="text-end font-medium tabular-nums">
              {row.points}
            </TableCell>
          </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
})

export const GroupStageStandings = React.memo(function GroupStageStandings({
  className,
}: GroupStageStandingsProps) {
  const { t } = useTranslation()
  const [activeGroup, setActiveGroup] = React.useState<GroupKey>("A")

  const handleGroupChange = React.useCallback((value: string) => {
    setActiveGroup(value as GroupKey)
  }, [])

  return (
    <Tabs
      value={activeGroup}
      onValueChange={handleGroupChange}
      className={cn("flex h-full flex-col", className)}
    >
      <Card className="@container/card flex h-full flex-col gap-3">
        <CardHeader className="pb-0">
          <CardTitle>{t("groupStandings.title")}</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              {t("groupStandings.description")}
            </span>
            <span className="@[540px]/card:hidden">
              {t("groupStandings.groupShort", { group: activeGroup })}
            </span>
          </CardDescription>
          <CardAction>
            <TabsList className="hidden max-w-full overflow-x-auto @[767px]/card:inline-flex">
              {GROUPS.map((group) => (
                <TabsTrigger key={group} value={group}>
                  {group}
                </TabsTrigger>
              ))}
            </TabsList>
            <Select value={activeGroup} onValueChange={handleGroupChange}>
              <SelectTrigger
                className="flex w-36 @[767px]/card:hidden"
                size="sm"
                aria-label={t("common.selectGroup")}
              >
                <SelectValue placeholder={t("groupStandings.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {GROUPS.map((group) => (
                  <SelectItem key={group} value={group} className="rounded-lg">
                    {t("groupStandings.groupShort", { group })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col pt-0">
          {GROUPS.map((group) => (
            <TabsContent key={group} value={group} className="flex-1 outline-none">
              <StandingsTable group={group} rows={groupStandings[group]} />
            </TabsContent>
          ))}
        </CardContent>
      </Card>
    </Tabs>
  )
})

/** @deprecated Use GroupStageStandings */
export const ChartAreaInteractive = GroupStageStandings
