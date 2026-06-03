import * as React from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { logger } from "@/lib/logger"

interface StandingRow {
  position: number
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  gd: number
  points: number
  isCurrentTeam?: boolean
}

const DUMMY_STANDINGS: StandingRow[] = [
  { position: 1, teamName: "Brazil",  played: 3, won: 3, drawn: 0, lost: 0, gd: 6,  points: 9 },
  { position: 2, teamName: "England", played: 3, won: 2, drawn: 0, lost: 1, gd: 2,  points: 6, isCurrentTeam: true },
  { position: 3, teamName: "Iran",    played: 3, won: 1, drawn: 0, lost: 2, gd: -3, points: 3 },
  { position: 4, teamName: "USA",     played: 3, won: 0, drawn: 0, lost: 3, gd: -5, points: 0 },
]

export const GroupStandingsCard = React.memo(function GroupStandingsCard() {
  logger.info("Rendering GroupStandingsCard", { source: "dummy-data" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Group Standings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium w-8">#</th>
              <th className="px-4 py-2 text-left font-medium">Team</th>
              <th className="px-2 py-2 text-center font-medium">P</th>
              <th className="px-2 py-2 text-center font-medium">W</th>
              <th className="px-2 py-2 text-center font-medium">D</th>
              <th className="px-2 py-2 text-center font-medium">L</th>
              <th className="px-2 py-2 text-center font-medium">GD</th>
              <th className="px-4 py-2 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_STANDINGS.map((row) => (
              <tr
                key={row.position}
                className={`border-b last:border-0 transition-colors ${
                  row.isCurrentTeam
                    ? "bg-primary/10 font-semibold"
                    : "hover:bg-muted/40"
                }`}
              >
                <td className="px-4 py-2 text-muted-foreground tabular-nums">
                  {row.position}
                </td>
                <td className="px-4 py-2 flex items-center gap-2">
                  {row.teamName}
                  {row.isCurrentTeam && (
                    <Badge variant="outline" className="text-xs py-0">You</Badge>
                  )}
                </td>
                <td className="px-2 py-2 text-center tabular-nums">{row.played}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.won}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.drawn}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.lost}</td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="px-4 py-2 text-center font-bold tabular-nums">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
})
