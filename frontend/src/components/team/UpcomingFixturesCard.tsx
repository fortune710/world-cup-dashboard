import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { logger } from "@/lib/logger"

// Dummy fixture data
const dummyFixtures = [
  { id: 1, opponent: "Team A", date: "2024-11-10" },
  { id: 2, opponent: "Team B", date: "2024-11-12" },
  { id: 3, opponent: "Team C", date: "2024-11-15" },
]

export const UpcomingFixturesCard = React.memo(function UpcomingFixturesCard() {
  logger.info("Rendering UpcomingFixturesCard (dummy data)")
  const fixtures = dummyFixtures
  const isLoading = false
  const error = null

  if (isLoading) {
    return <Card><CardHeader><CardTitle>Upcoming Fixtures</CardTitle></CardHeader><CardContent>Loading...</CardContent></Card>
  }
  if (error) {
    return <Card><CardHeader><CardTitle>Upcoming Fixtures</CardTitle></CardHeader><CardContent>Error loading fixtures.</CardContent></Card>
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Fixtures</CardTitle>
      </CardHeader>
      <CardContent>
        {fixtures && fixtures.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {fixtures.map((f) => (
              <li key={f.id}>{f.opponent} – {new Date(f.date).toLocaleDateString()}</li>
            ))}
          </ul>
        ) : (
          <p>No upcoming fixtures.</p>
        )}
      </CardContent>
    </Card>
  )
})
