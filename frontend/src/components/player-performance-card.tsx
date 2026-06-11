import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Badge } from "./ui/badge"


export interface PlayerPerformance {
    name: string
    position: string
    country: string
    rating?: number
    goals?: number
    assists?: number
    cleanSheets?: number
    category: "Top Goalscorer" | "Most Assists" | "Top Rated" | "Most Clean Sheets"
    avatar?: string
    federation: string
    group: string


}

interface PlayerPerformanceCardProps {
    playerPerformance: PlayerPerformance[]
}

export function PlayerPerformanceCard({ playerPerformance }: PlayerPerformanceCardProps) {
    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {playerPerformance.map((player) => (
                <Card className="@container/card ">
                    <CardHeader>
                        <CardDescription>{player.category}</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {player.category === "Top Goalscorer" ? player.goals : player.category === "Most Assists" ? player.assists : player.category === "Top Rated" ? player.rating : player.category === "Most Clean Sheets" ? player.cleanSheets : null}
                        </CardTitle>


                        <div className="flex flex-col   gap-2">

                            <span className="font-semibold "> {player.name}</span>
                            <CardDescription className="flex flex-col  gap-2">
                                <div className="flex flex-row  gap-1 ">
                                    <span className="text-muted-foreground">{player.country}</span>
                                    <span> . </span>
                                    <span className="text-muted-foreground">{player.federation}</span>
                                    <span> . </span>
                                    <span className="text-muted-foreground">Group {player.group}</span>
                                </div>
                            </CardDescription>
                        </div>



                        <CardAction>
                            <Badge variant="default">
                                {player.position}
                            </Badge>
                        </CardAction>
                    </CardHeader>

                </Card>

            ))}
        </div>
    )
}