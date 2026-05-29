"use client"

import * as React from "react"

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

export const description = "Group stage standings with tabbed groups"

const StandingsTable = React.memo(function StandingsTable({
  group,
  rows,
}: StandingsTableProps) {
  return (
    <Table aria-label={`Group ${group} standings`}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">Pos</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-end">P</TableHead>
          <TableHead className="hidden text-end sm:table-cell">W</TableHead>
          <TableHead className="hidden text-end sm:table-cell">D</TableHead>
          <TableHead className="hidden text-end sm:table-cell">L</TableHead>
          <TableHead className="text-end">GD</TableHead>
          <TableHead className="text-end">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.team}
            className={cn(isQualificationZone(row.position) && "bg-primary/5")}
          >
            <TableCell className="font-medium tabular-nums text-muted-foreground">
              {row.position}
            </TableCell>
            <TableCell className="font-medium">{row.team}</TableCell>
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
        ))}
      </TableBody>
    </Table>
  )
})

export const GroupStageStandings = React.memo(function GroupStageStandings({
  className,
}: GroupStageStandingsProps) {
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
          <CardTitle>Group Stage Standings</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              Top two from each group advance to the Round of 32
            </span>
            <span className="@[540px]/card:hidden">Group {activeGroup}</span>
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
                aria-label="Select group"
              >
                <SelectValue placeholder="Group A" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {GROUPS.map((group) => (
                  <SelectItem key={group} value={group} className="rounded-lg">
                    Group {group}
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
