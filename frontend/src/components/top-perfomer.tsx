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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import type { PerformerListProps, TopPerformersProps } from "@/datatypes"
import {
  toAssistPerformerRows,
  toGoalPerformerRows,
  toSavePerformerRows,
  topPerformers,
} from "@/lib/helpers/top-performers.helpers"
import { cn } from "@/lib/utils"

const PERFORMER_TABS = [
  { value: "Goals", label: "Goals" },
  { value: "Assists", label: "Assists" },
  { value: "Saves", label: "Saves" },
] as const

type PerformerTab = (typeof PERFORMER_TABS)[number]["value"]

const goalPerformerRows = toGoalPerformerRows(topPerformers[0])
const assistPerformerRows = toAssistPerformerRows(topPerformers[1])
const savePerformerRows = toSavePerformerRows(topPerformers[2])

const PerformerList = React.memo(function PerformerList({
  performers,
}: PerformerListProps) {
  return (
    <ItemGroup className="gap-0">
      {performers.map((performer, index) => (
        <div key={performer.name} className="flex flex-col">
          {index > 0 ? <ItemSeparator /> : null}
          <Item>
            <ItemMedia>
              <Avatar>
                <AvatarImage src={performer.avatar} alt={performer.name} />
                <AvatarFallback>{performer.initials}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{performer.name}</ItemTitle>
              <ItemDescription>{performer.nationality}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <span className="text-sm font-medium tabular-nums">
                {performer.value}
              </span>
            </ItemActions>
          </Item>
        </div>
      ))}
    </ItemGroup>
  )
})

function TopPerformers({ className }: TopPerformersProps) {
  const [activeTab, setActiveTab] = React.useState<PerformerTab>("Goals")

  const handleTabChange = React.useCallback((value: string) => {
    setActiveTab(value as PerformerTab)
  }, [])

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={cn("flex h-full flex-col", className)}
    >
      <Card className="@container/card flex h-full flex-col gap-3">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-2">
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Standouts so far in the tournament
              </span>
              <span className="@[540px]/card:hidden">{activeTab}</span>
            </CardDescription>
          </div>
          <CardAction>
            <TabsList className="hidden @[767px]/card:inline-flex">
              {PERFORMER_TABS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger
                className="flex w-36 @[767px]/card:hidden"
                size="sm"
                aria-label="Select performer category"
              >
                <SelectValue placeholder="Goals" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PERFORMER_TABS.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="rounded-lg">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col pt-0">
          <TabsContent value="Goals" className="flex-1">
            <PerformerList performers={goalPerformerRows} />
          </TabsContent>
          <TabsContent value="Assists" className="flex-1">
            <PerformerList performers={assistPerformerRows} />
          </TabsContent>
          <TabsContent value="Saves" className="flex-1">
            <PerformerList performers={savePerformerRows} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  )
}

export default React.memo(TopPerformers)
