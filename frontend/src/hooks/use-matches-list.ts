import { useEffect, useMemo } from "react"
import useSWR from "swr"

import { API_BASE_URL } from "@/lib/api-config"
import { logger } from "@/lib/logger"
import type { LiveRushMatch } from "@/datatypes"
import {
  buildMatchesListApiPath,
  groupMatchesByLocalDate,
  mapMatchApiRowsToLiveRushMatches,
  type MatchApiRow,
  type MatchDayGroup,
} from "@/lib/helpers/match.helpers"

const MATCHES_PAGE_SIZE = 100

async function fetchAllMatches(): Promise<LiveRushMatch[]> {
  logger.info({
    message: "Fetching full matches list from backend",
    page_size: MATCHES_PAGE_SIZE,
  })

  const apiRows: MatchApiRow[] = []
  let page = 1

  while (true) {
    const path = buildMatchesListApiPath(page, MATCHES_PAGE_SIZE)
    logger.info({
      message: "Fetching matches page from backend",
      page,
      page_size: MATCHES_PAGE_SIZE,
      path,
    })

    const response = await fetch(`${API_BASE_URL}${path}`)
    if (!response.ok) {
      logger.error({
        message: "Failed to fetch matches page from backend",
        page,
        page_size: MATCHES_PAGE_SIZE,
        status: response.status,
      })
      throw new Error("Failed to fetch matches")
    }

    const pageRows = (await response.json()) as MatchApiRow[]
    apiRows.push(...pageRows)

    logger.info({
      message: "Fetched matches page from backend",
      page,
      page_size: MATCHES_PAGE_SIZE,
      count: pageRows.length,
    })

    if (pageRows.length < MATCHES_PAGE_SIZE) {
      break
    }

    page += 1
  }

  const matches = mapMatchApiRowsToLiveRushMatches(apiRows)
  logger.info({
    message: "Fetched full matches list from backend",
    match_count: matches.length,
    page_count: page,
  })
  return matches
}

export function useMatchesList(): {
  groups: MatchDayGroup[]
  loading: boolean
  error: string | null
  hasData: boolean
} {
  const { data, error, isLoading } = useSWR("matches-list", fetchAllMatches, {
    shouldRetryOnError: true,
    errorRetryCount: 3,
    revalidateOnFocus: false,
  })

  const groups = useMemo(() => groupMatchesByLocalDate(data ?? []), [data])

  useEffect(() => {
    logger.info({
      message: "Matches list hook state updated",
      loading: isLoading,
      has_error: Boolean(error),
      has_data: data !== undefined,
      group_count: groups.length,
    })
  }, [data, error, groups.length, isLoading])

  return {
    groups,
    loading: isLoading,
    error: error ? error.message : null,
    hasData: data !== undefined,
  }
}
