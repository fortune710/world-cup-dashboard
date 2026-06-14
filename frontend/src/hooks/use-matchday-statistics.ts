import { useEffect, useMemo } from "react"
import useSWR from "swr"

import { API_BASE_URL } from "@/lib/api-config"
import { logger } from "@/lib/logger"
import {
  buildMatchdayStatisticsApiPath,
  buildMatchdayStatisticsCards,
  type MatchdayStatisticApiRow,
  type MatchdayStatisticsCards,
} from "@/lib/helpers/matchday-statistics.helpers"

function getCurrentUtcDate(): string {
  const currentDate = new Date().toISOString().slice(0, 10)
  logger.info(
    {
      message: "Resolved current UTC date for matchday statistics",
      current_date: currentDate,
    }
  )
  return currentDate
}

async function fetchMatchdayStatistics(matchDate: string): Promise<MatchdayStatisticApiRow[]> {
  logger.info(
    {
      message: "Fetching matchday statistics from backend",
      match_date: matchDate,
    }
  )
  const response = await fetch(`${API_BASE_URL}${buildMatchdayStatisticsApiPath(matchDate)}`)

  if (!response.ok) {
    logger.error(
      {
        message: "Failed to fetch matchday statistics from backend",
        match_date: matchDate,
        status: response.status,
      }
    )
    throw new Error("Failed to fetch matchday statistics")
  }

  const data = (await response.json()) as MatchdayStatisticApiRow[]
  logger.info(
    {
      message: "Fetched matchday statistics from backend",
      match_date: matchDate,
      count: data.length,
    }
  )
  return data
}

export function useMatchdayStatistics(matchDate?: string): {
  cards: MatchdayStatisticsCards
  loading: boolean
  error: string | null
} {
  const resolvedMatchDate = useMemo(
    () => matchDate ?? getCurrentUtcDate(),
    [matchDate]
  )

  logger.info(
    {
      message: "Using matchday statistics hook",
      match_date: resolvedMatchDate,
    }
  )

  const { data, error, isLoading } = useSWR(
    resolvedMatchDate,
    fetchMatchdayStatistics,
    {
      shouldRetryOnError: true,
      errorRetryCount: 3,
      revalidateOnFocus: false,
    }
  )

  const cards = useMemo(() => buildMatchdayStatisticsCards(data ?? []), [data])

  useEffect(() => {
    logger.info(
      {
        message: "Matchday statistics hook state updated",
        match_date: resolvedMatchDate,
        loading: isLoading,
        has_error: Boolean(error),
        has_data: Boolean(data),
      }
    )
  }, [resolvedMatchDate, isLoading, error, data])

  return {
    cards,
    loading: isLoading,
    error: error ? error.message : null,
  }
}
