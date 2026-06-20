import { useEffect, useMemo } from "react"
import useSWR from "swr"

import { API_BASE_URL } from "@/lib/api-config"
import { logger } from "@/lib/logger"
import {
  mapMatchApiRowsToLiveRushMatches,
  type MatchApiRow,
} from "@/lib/helpers/match.helpers"
import type { LiveRushMatch } from "@/datatypes"

async function fetchTeamMatches(teamCode: string): Promise<LiveRushMatch[]> {
  const url = `${API_BASE_URL}/matches/team/${teamCode}`
  logger.info("Fetching team matches", { teamCode, url })
  const response = await fetch(url)

  if (!response.ok) {
    logger.error("Failed to fetch team matches", {
      teamCode,
      status: response.status,
    })
    throw new Error("Failed to fetch team matches")
  }

  const rows = (await response.json()) as MatchApiRow[]
  const matches = mapMatchApiRowsToLiveRushMatches(rows)
  logger.info("Fetched team matches", { teamCode, count: matches.length })
  return matches
}

export function useTeamMatches(teamCode: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    teamCode ? `team-matches-${teamCode}` : null,
    () => fetchTeamMatches(teamCode!),
    {
      shouldRetryOnError: true,
      errorRetryCount: 3,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    logger.info("Team matches hook state updated", {
      teamCode,
      loading: isLoading,
      hasError: Boolean(error),
      matchCount: data?.length ?? 0,
    })
  }, [teamCode, data?.length, error, isLoading])

  const matches = useMemo(() => data ?? [], [data])

  return {
    matches,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: mutate,
  }
}
