import * as React from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { logger } from "@/lib/logger"

interface PlayerStat {
  id: number
  name: string
  position: string
  value: number
  unit: string
}

const DUMMY_TOP_SCORERS: PlayerStat[] = [
  { id: 1, name: "Harry Kane",    position: "FWD", value: 8, unit: "goals" },
  { id: 2, name: "Marcus Rashford", position: "FWD", value: 5, unit: "goals" },
  { id: 3, name: "Phil Foden",   position: "MID", value: 4, unit: "goals" },
]

const DUMMY_TOP_ASSISTS: PlayerStat[] = [
  { id: 1, name: "Bukayo Saka",   position: "MID", value: 7, unit: "assists" },
  { id: 2, name: "Trent Alexander-Arnold", position: "DEF", value: 5, unit: "assists" },
  { id: 3, name: "Phil Foden",   position: "MID", value: 4, unit: "assists" },
]

const DUMMY_TOP_DEFENDERS: PlayerStat[] = [
  { id: 1, name: "John Stones",   position: "DEF", value: 14, unit: "clearances" },
  { id: 2, name: "Kyle Walker",   position: "DEF", value: 11, unit: "clearances" },
  { id: 3, name: "Luke Shaw",     position: "DEF", value: 9,  unit: "clearances" },
]

const DUMMY_TOP_KEEPERS: PlayerStat[] = [
  { id: 1, name: "Jordan Pickford", position: "GK", value: 87, unit: "save %" },
  { id: 2, name: "Dean Henderson", position: "GK", value: 72, unit: "save %" },
]

function PlayerList({ players }: { players: PlayerStat[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {players.map((player, index) => (
        <li
          key={player.id}
          className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/40 text-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground tabular-nums w-4">{index + 1}</span>
            <div>
              <p className="font-medium">{player.name}</p>
              <p className="text-xs text-muted-foreground">{player.position}</p>
            </div>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {player.value} {player.unit}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

export const BestPlayersCard = React.memo(function BestPlayersCard() {
  logger.info("Rendering BestPlayersCard", { source: "dummy-data" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Best Performing Players
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="goals">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="goals" className="flex-1">Goals</TabsTrigger>
            <TabsTrigger value="assists" className="flex-1">Assists</TabsTrigger>
            <TabsTrigger value="defence" className="flex-1">Defence</TabsTrigger>
            <TabsTrigger value="keeper" className="flex-1">Keeper</TabsTrigger>
          </TabsList>
          <TabsContent value="goals">
            <PlayerList players={DUMMY_TOP_SCORERS} />
          </TabsContent>
          <TabsContent value="assists">
            <PlayerList players={DUMMY_TOP_ASSISTS} />
          </TabsContent>
          <TabsContent value="defence">
            <PlayerList players={DUMMY_TOP_DEFENDERS} />
          </TabsContent>
          <TabsContent value="keeper">
            <PlayerList players={DUMMY_TOP_KEEPERS} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
})
