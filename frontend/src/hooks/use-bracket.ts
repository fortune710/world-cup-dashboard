import { useEffect, useMemo } from "react"
import useSWR from "swr"

import { API_BASE_URL } from "@/lib/api-config"
import { logger } from "@/lib/logger"
import {
  buildBracketApiPath,
  buildBracketViewModel,
  type BracketRoundApi,
  type BracketRoundViewModel,
} from "@/lib/helpers/bracket.helpers"

async function fetchBracketRounds(): Promise<BracketRoundApi[]> {
  const path = buildBracketApiPath()
  logger.info({
    message: "Fetching bracket rounds from backend",
    path,
  })

  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    logger.error({
      message: "Failed to fetch bracket rounds from backend",
      status: response.status,
    })
    throw new Error("Failed to fetch bracket rounds")
  }

  const data = (await response.json()) as BracketRoundApi[]
  logger.info({
    message: "Fetched bracket rounds from backend",
    round_count: data.length,
  })
  return data
}

export function useBracket(): {
  rounds: BracketRoundViewModel[]
  loading: boolean
  error: string | null
  hasData: boolean
} {
  const { data, error, isLoading } = useSWR("bracket", fetchBracketRounds, {
    shouldRetryOnError: true,
    errorRetryCount: 3,
    revalidateOnFocus: false,
  })

  const rounds = useMemo(() => buildBracketViewModel(data ?? []), [data])

  useEffect(() => {
    logger.info({
      message: "Bracket hook state updated",
      loading: isLoading,
      has_error: Boolean(error),
      has_data: data !== undefined,
      round_count: rounds.length,
    })
  }, [data, error, isLoading, rounds.length])

  return {
    rounds,
    loading: isLoading,
    error: error ? error.message : null,
    hasData: data !== undefined,
  }
}
