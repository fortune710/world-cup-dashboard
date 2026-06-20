import { useEffect } from "react"
import useSWR from "swr"

import { API_BASE_URL } from "@/lib/api-config"
import { logger } from "@/lib/logger"

export type TeamStatRankItem = {
  value: number
  rank: number
}

export type TeamStatisticsRankData = {
  team_code: string
  total_teams: number
  goals: TeamStatRankItem
  pass_accuracy: TeamStatRankItem
  chances_created: TeamStatRankItem
  discipline: TeamStatRankItem
}

async function fetchTeamStatisticsRank(
  teamCode: string
): Promise<TeamStatisticsRankData> {
  const url = `${API_BASE_URL}/teams/${teamCode}/statistics-rank`
  logger.info("Fetching team statistics rank", { teamCode, url })
  const response = await fetch(url)

  if (!response.ok) {
    logger.error("Failed to fetch team statistics rank", {
      teamCode,
      status: response.status,
    })
    throw new Error("Failed to fetch team statistics rank")
  }

  const data = (await response.json()) as TeamStatisticsRankData
  logger.info("Fetched team statistics rank", { teamCode })
  return data
}

export function useTeamStatisticsRank(teamCode: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    teamCode ? `team-statistics-rank-${teamCode}` : null,
    () => fetchTeamStatisticsRank(teamCode!),
    {
      shouldRetryOnError: true,
      errorRetryCount: 3,
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    logger.info("Team statistics rank hook state updated", {
      teamCode,
      loading: isLoading,
      hasError: Boolean(error),
      hasData: data !== undefined,
    })
  }, [teamCode, data, error, isLoading])

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: mutate,
  }
}
