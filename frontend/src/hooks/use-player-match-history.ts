import useSWR from "swr"
import { API_BASE_URL } from "@/lib/api-config"

export interface PlayerMatchHistoryEntry {
  match_id: number
  round: string | null
  phase: string | null
  kickoff_utc: string | null
  opponent: string | null
  team_score: number | null
  opponent_score: number | null
  clean_sheet: boolean | null
  rating: number | null
  minutes_played: number | null
  goal_contributions: number | null
  tackles: number | null
  interceptions: number | null
  pass_accuracy: number | null
  has_player_stats: boolean
}

interface PlayerMatchHistoryResponse {
  matches: PlayerMatchHistoryEntry[]
}

const fetcher = (url: string): Promise<PlayerMatchHistoryResponse> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch player match history")
    return res.json()
  })

export function usePlayerMatchHistory(playerId?: number | string) {
  const { data, error, isLoading } = useSWR<PlayerMatchHistoryResponse>(
    playerId ? `${API_BASE_URL}/players/${playerId}/match-history` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    matches: data?.matches ?? [],
    isLoading,
    error: error ? String(error) : null,
  }
}
