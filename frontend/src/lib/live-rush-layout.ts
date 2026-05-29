import { cn } from "@/lib/utils"

/**
 * World Cup 2026 daily slate caps (FIFA schedule).
 * Peak: 6 fixtures on final group matchday (e.g. 24 Jun 2026).
 * Typical group days: 4; light openers: 2; knockout days: 1–3.
 */
export const WC26_MAX_MATCHES_PER_DAY = 6

export type LiveRushMatchStatus = "finished" | "live" | "upcoming"

export interface LiveRushMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  /** Display time (e.g. "15:00") or live minute (e.g. "72'") */
  kickoffLabel: string
  status: LiveRushMatchStatus
  group?: string
}

type ColSpanAtXl = 3 | 4 | 6 | 12

function colSpanAtXl(matchCount: number, index: number): ColSpanAtXl {
  const count = Math.min(Math.max(matchCount, 1), WC26_MAX_MATCHES_PER_DAY)

  switch (count) {
    case 1:
      return 12
    case 2:
      return 6
    case 3:
      return 4
    case 4:
      return 6
    case 5:
      return index < 3 ? 4 : 6
    case 6:
    default:
      return 4
  }
}

const colSpanClass: Record<ColSpanAtXl, string> = {
  3: "@xl/main:col-span-3",
  4: "@xl/main:col-span-4",
  6: "@xl/main:col-span-6",
  12: "@xl/main:col-span-12",
}

/** Responsive grid column span for a match tile at a given index. */
export function getLiveRushColSpanClass(matchCount: number, index: number): string {
  return cn("col-span-12", colSpanClass[colSpanAtXl(matchCount, index)])
}
