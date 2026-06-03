import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { logger } from "@/lib/logger"

type MatchResult = "W" | "D" | "L"

interface Fixture {
  id: number
  opponent: string
  date: string
  score: string
  result: MatchResult
}

const DUMMY_FIXTURES: Fixture[] = [
  { id: 1, opponent: "Brazil",    date: "2024-10-15", score: "2–1", result: "W" },
  { id: 2, opponent: "Germany",   date: "2024-10-08", score: "1–1", result: "D" },
  { id: 3, opponent: "Argentina", date: "2024-09-25", score: "0–2", result: "L" },
  { id: 4, opponent: "France",    date: "2024-09-10", score: "3–0", result: "W" },
  { id: 5, opponent: "Spain",     date: "2024-09-03", score: "1–1", result: "D" },
]

const resultStyles: Record<MatchResult, string> = {
  W: "bg-green-500/20 text-green-400 border-green-500/30",
  D: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  L: "bg-red-500/20 text-red-400 border-red-500/30",
}

export const LastFiveForm = React.memo(function LastFiveForm() {
  logger.info("Rendering LastFiveForm", { source: "dummy-data" })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Last 5 Results
        </CardTitle>
        {/* Form summary dots */}
        <div className="flex gap-1.5 pt-1">
          {DUMMY_FIXTURES.map((f) => (
            <span
              key={f.id}
              title={`${f.result} vs ${f.opponent}`}
              className={`h-3 w-3 rounded-full border ${
                f.result === "W"
                  ? "bg-green-500 border-green-400"
                  : f.result === "D"
                  ? "bg-yellow-500 border-yellow-400"
                  : "bg-red-500 border-red-400"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {DUMMY_FIXTURES.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/40 text-sm"
          >
            <span className="text-muted-foreground">
              {new Date(f.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </span>
            <span className="font-medium">{f.opponent}</span>
            <span className="tabular-nums font-mono">{f.score}</span>
            <Badge
              variant="outline"
              className={`w-8 justify-center font-bold ${resultStyles[f.result]}`}
            >
              {f.result}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
})
