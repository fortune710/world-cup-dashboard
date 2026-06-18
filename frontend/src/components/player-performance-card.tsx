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
    saves?: number
    category: "Top Goalscorer" | "Most Assists" | "Top Rated" | "Most Clean Sheets" | "Most Saves"
    avatar?: string
    federation: string
    group: string


}

interface PlayerPerformanceCardProps {
    playerPerformance: PlayerPerformance[]
}

/** Football hexagon pattern — Top Goalscorer */
function GoalscorerSvg() {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-4 size-40 text-foreground opacity-[0.07]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Outer circle (ball) */}
            <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="2.5" />
            {/* Central pentagon */}
            <polygon
                points="100,55 130,75 120,110 80,110 70,75"
                fill="currentColor"
                opacity="0.5"
            />
            {/* Surrounding hexagons / panels */}
            <polygon points="100,55 130,75 145,50 125,28 100,20 85,35 70,75 100,55" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polygon points="130,75 120,110 155,125 170,95 155,65 145,50" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polygon points="120,110 80,110 70,145 90,170 120,170 140,145 155,125" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polygon points="80,110 70,75 40,65 25,90 35,125 70,145" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <polygon points="70,75 85,35 60,20 35,40 30,65 40,65" stroke="currentColor" strokeWidth="1.5" fill="none" />
            {/* Stitching lines */}
            <line x1="100" y1="20" x2="100" y2="10" stroke="currentColor" strokeWidth="1" />
            <line x1="170" y1="95" x2="185" y2="95" stroke="currentColor" strokeWidth="1" />
            <line x1="140" y1="170" x2="150" y2="183" stroke="currentColor" strokeWidth="1" />
            <line x1="55" y1="170" x2="45" y2="183" stroke="currentColor" strokeWidth="1" />
            <line x1="25" y1="90" x2="12" y2="85" stroke="currentColor" strokeWidth="1" />
        </svg>
    )
}

/** Curved assist arrows — Most Assists */
function AssistsSvg() {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-4 size-40 text-foreground opacity-[0.07]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Boot / shoe silhouette kicking */}
            <path
                d="M40 160 C40 160 50 130 70 110 C90 90 110 85 120 90 C130 95 125 110 110 115 L95 120 L100 140 L60 165 Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="currentColor"
                opacity="0.3"
            />
            {/* Curved pass trajectory */}
            <path
                d="M110 115 Q140 60 175 45"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                fill="none"
            />
            {/* Arrow at end */}
            <polygon points="175,45 165,35 160,50" fill="currentColor" opacity="0.6" />
            {/* Motion lines */}
            <path d="M120 100 Q145 70 170 55" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
            <path d="M115 108 Q138 78 165 62" stroke="currentColor" strokeWidth="1" opacity="0.2" fill="none" />
            {/* Small ball at tip */}
            <circle cx="175" cy="45" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="175" cy="45" r="3" fill="currentColor" opacity="0.4" />
        </svg>
    )
}

/** Star / diamond burst — Top Rated */
function TopRatedSvg() {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-4 size-40 text-foreground opacity-[0.07]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Central star */}
            <polygon
                points="100,20 115,70 170,70 125,105 142,160 100,130 58,160 75,105 30,70 85,70"
                fill="currentColor"
                opacity="0.35"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            {/* Radiating burst lines */}
            <line x1="100" y1="10" x2="100" y2="0" stroke="currentColor" strokeWidth="1.5" />
            <line x1="145" y1="25" x2="155" y2="15" stroke="currentColor" strokeWidth="1" />
            <line x1="180" y1="70" x2="192" y2="68" stroke="currentColor" strokeWidth="1" />
            <line x1="165" y1="125" x2="178" y2="135" stroke="currentColor" strokeWidth="1" />
            <line x1="130" y1="170" x2="135" y2="185" stroke="currentColor" strokeWidth="1" />
            <line x1="70" y1="170" x2="65" y2="185" stroke="currentColor" strokeWidth="1" />
            <line x1="35" y1="125" x2="22" y2="135" stroke="currentColor" strokeWidth="1" />
            <line x1="20" y1="70" x2="8" y2="68" stroke="currentColor" strokeWidth="1" />
            <line x1="55" y1="25" x2="45" y2="15" stroke="currentColor" strokeWidth="1" />
            {/* Inner glow ring */}
            <circle cx="100" cy="95" r="25" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx="100" cy="95" r="12" fill="currentColor" opacity="0.2" />
        </svg>
    )
}

/** Gloves / shield — Most Clean Sheets */
function CleanSheetsSvg() {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-4 size-40 text-foreground opacity-[0.07]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Shield outline */}
            <path
                d="M100 15 L170 50 L170 110 C170 150 140 180 100 195 C60 180 30 150 30 110 L30 50 Z"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="currentColor"
                opacity="0.15"
            />
            {/* Inner shield */}
            <path
                d="M100 35 L150 60 L150 105 C150 138 128 162 100 175 C72 162 50 138 50 105 L50 60 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
            />
            {/* Checkmark */}
            <path
                d="M72 100 L92 120 L130 75"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.5"
            />
            {/* Glove fingers (top) */}
            <path d="M65 55 L65 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M80 45 L80 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M120 45 L120 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M135 55 L135 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

function getStatValue(player: PlayerPerformance): React.ReactNode {
    switch (player.category) {
        case "Top Goalscorer":
            return player.goals
        case "Most Assists":
            return player.assists
        case "Top Rated":
            return player.rating
        case "Most Clean Sheets":
            return player.cleanSheets
        case "Most Saves":
            return player.saves
        default:
            return null
    }
}

export function PlayerPerformanceCard({ playerPerformance }: PlayerPerformanceCardProps) {
    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {playerPerformance.map((player) => {
                return (
                    <Card key={`${player.category}-${player.name}`} className="@container/card relative overflow-hidden">
                        {player.category === "Top Goalscorer" && <GoalscorerSvg />}
                        {player.category === "Most Assists" && <AssistsSvg />}
                        {player.category === "Top Rated" && <TopRatedSvg />}
                        {(player.category === "Most Clean Sheets" || player.category === "Most Saves") && <CleanSheetsSvg />}

                        <CardHeader>
                            <CardDescription>{player.category}</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {getStatValue(player)}
                            </CardTitle>

                            <div className="flex flex-col gap-2">
                                <span className="font-semibold">{player.name}</span>
                                <CardDescription className="flex flex-col gap-2">
                                    <div className="flex flex-row gap-1">
                                        <span className="text-muted-foreground">{player.country}</span>
                                        <span>·</span>
                                        <span className="text-muted-foreground">{player.federation}</span>
                                        <span>·</span>
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
                )
            })}
        </div>
    )
}