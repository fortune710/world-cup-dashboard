"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
import { cn } from "@/lib/utils"
import { useTopPerformers } from "@/hooks/use-top-performers"

const PERFORMER_TAB_VALUES = ["Goals", "Assists", "Saves"] as const

type PerformerTab = (typeof PERFORMER_TAB_VALUES)[number]

const PERFORMER_TAB_I18N: Record<PerformerTab, string> = {
  Goals: "topPerformers.tabs.goals",
  Assists: "topPerformers.tabs.assists",
  Saves: "topPerformers.tabs.saves",
}

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
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = React.useState<PerformerTab>("Goals")
  const { data, loading, error } = useTopPerformers()

  const performerTabs = React.useMemo(
    () =>
      PERFORMER_TAB_VALUES.map((value) => ({
        value,
        label: t(PERFORMER_TAB_I18N[value]),
      })),
    [t]
  )

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
            <CardTitle>{t("topPerformers.title")}</CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                {t("topPerformers.description")}
              </span>
            </CardDescription>
            <TabsList className="w-full">
              {performerTabs.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className="w-full">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col pt-0">
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground min-h-60">
              {t("topPerformers.loading", { defaultValue: "Loading performers..." })}
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-destructive min-h-60">
              {t("topPerformers.error", { defaultValue: "Failed to load top performers." })}
            </div>
          ) : data ? (
            <>
              <TabsContent value="Goals" className="flex-1">
                <PerformerList performers={data.goals} />
              </TabsContent>
              <TabsContent value="Assists" className="flex-1">
                <PerformerList performers={data.assists} />
              </TabsContent>
              <TabsContent value="Saves" className="flex-1">
                <PerformerList performers={data.saves} />
              </TabsContent>
            </>
          ) : null}
        </CardContent>
      </Card>
    </Tabs>
  )
}

export default React.memo(TopPerformers)
